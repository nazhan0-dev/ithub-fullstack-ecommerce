// สร้างคำสั่งซื้อจากการชำระเงินที่สำเร็จ ใช้ร่วมกัน 2 ทาง:
//   1) หน้าเว็บเรียก POST /api/user/order หลังจ่ายเงินเสร็จ (ทางปกติ เร็ว)
//   2) Stripe เรียก webhook payment_intent.succeeded (ทางสำรอง กรณีลูกค้าปิดแท็บ/เน็ตหลุดหลังจ่าย)
// สองทางนี้อาจมาพร้อมกัน จึงล็อกตาม payment intent ให้ทำทีละอัน -> ได้คำสั่งซื้อเดียวเสมอ
const { pool, query, one, transaction } = require('../config/db')
const { stripe, toSatang } = require('../config/stripe')
const { cartPricing } = require('../controllers/coupon')

// ตัดเงินไปแล้วแต่สร้างคำสั่งซื้อไม่ได้ -> คืนเงินอัตโนมัติ
class RefundError extends Error {
    constructor(message = 'ขออภัย สินค้าบางรายการหมดระหว่างชำระเงิน ระบบได้คืนเงินให้แล้ว') {
        super(message)
    }
}

// คืนเงินเต็มจำนวน ใช้ idempotency key เดียวกันทุกครั้ง: เรียกซ้ำกี่รอบก็คืนแค่ครั้งเดียว
async function refundPayment(paymentIntentId) {
    try {
        await stripe.refunds.create(
            { payment_intent: paymentIntentId },
            { idempotencyKey: `refund-${paymentIntentId}` }
        )
    } catch (error) {
        // คืนไปแล้ว (เช่น เกิน 24 ชม. ที่ key หมดอายุ) หรือ Stripe ขัดข้อง -> บันทึกไว้ให้ตรวจสอบ
        console.log('Refund failed', paymentIntentId, error.message)
    }
}

// ล็อกแบบมีชื่อของ MySQL: request ที่ใช้ payment intent เดียวกันต้องรอคิว
async function withPaymentLock(paymentIntentId, fn) {
    const conn = await pool.getConnection()
    const name = `ithub-pi-${paymentIntentId}`.slice(0, 64)
    try {
        const [[row]] = await conn.query('SELECT GET_LOCK(?, 20) AS got', [name])
        if (Number(row.got) !== 1) throw new Error('Payment is being processed')
        return await fn()
    } finally {
        await conn.query('SELECT RELEASE_LOCK(?)', [name]).catch(() => {})
        conn.release()
    }
}

const fail = (status, message) => ({ status, body: { ok: false, message } })

// paymentIntentId: id จาก Stripe (ข้อมูลจริงจะดึงจาก Stripe ใหม่ทุกครั้ง ไม่เชื่อข้อมูลที่ส่งมา)
// expectedUserId: ผู้ใช้ที่ login (ทางหน้าเว็บ) | null (ทาง webhook)
// คืน { status, body } — ข้อผิดพลาดที่ไม่คาดคิด (เช่น ฐานข้อมูลล่ม) จะ throw ออกไป
async function fulfillPayment(paymentIntentId, expectedUserId = null) {
    if (typeof paymentIntentId !== 'string' || !/^pi_[A-Za-z0-9_]+$/.test(paymentIntentId)) {
        return fail(400, 'Payment is required')
    }

    return withPaymentLock(paymentIntentId, async () => {
        // สร้างไปแล้ว (อีกทางหนึ่งทำเสร็จก่อน หรือกดซ้ำ) -> ตอบคำสั่งซื้อเดิม
        const existing = await one('SELECT * FROM `order` WHERE stripePayment = ?', [paymentIntentId])
        if (existing) {
            if (expectedUserId !== null && existing.orderedById !== expectedUserId) {
                return fail(400, 'Payment not completed')
            }
            return { status: 200, body: { ok: true, order: existing, alreadyCreated: true } }
        }

        let paymentIntent
        try {
            paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, { expand: ['latest_charge'] })
        } catch (error) {
            if (error.statusCode === 404 || error.type === 'StripeInvalidRequestError') {
                return fail(400, 'Payment not found')
            }
            throw error
        }

        const userId = Number(paymentIntent.metadata?.userId)
        if (
            paymentIntent.status !== 'succeeded' ||
            !Number.isInteger(userId) ||
            userId < 1 ||
            (expectedUserId !== null && userId !== expectedUserId)
        ) {
            return fail(400, 'Payment not completed')
        }

        // เคยคืนเงินไปแล้ว (เช่น ยอดไม่ตรงรอบก่อน) -> ห้ามนำมาสร้างคำสั่งซื้อ ไม่อย่างนั้นได้ของฟรี
        const charge = paymentIntent.latest_charge
        if (charge && typeof charge === 'object' && (charge.refunded || charge.amount_refunded > 0)) {
            return fail(409, 'การชำระเงินนี้ถูกคืนเงินแล้ว กรุณาสั่งซื้อใหม่')
        }

        const cart = await one('SELECT * FROM cart WHERE orderedById = ? ORDER BY id DESC LIMIT 1', [userId])
        const items = cart ? await query('SELECT * FROM productoncart WHERE cartId = ? ORDER BY id', [cart.id]) : []
        if (!cart || items.length === 0) {
            // จ่ายแล้วแต่ไม่มีของในตะกร้า (เช่น จ่ายซ้ำจากอีกแท็บ) -> คืนเงิน
            await refundPayment(paymentIntent.id)
            return fail(409, 'ไม่พบสินค้าในตะกร้า ระบบได้คืนเงินให้แล้ว')
        }

        // ยอดที่ต้องจ่าย = ยอดตะกร้า - ส่วนลดคูปอง
        // ยอดไม่ตรง (เช่น คูปองหมดอายุ/ครบจำนวนระหว่างจ่าย, ตะกร้าเปลี่ยน) -> คืนเงิน แล้วให้สั่งใหม่
        const pricing = await cartPricing(cart, userId)
        if (paymentIntent.currency !== 'thb' || paymentIntent.amount !== toSatang(pricing.total)) {
            await refundPayment(paymentIntent.id)
            return fail(
                409,
                pricing.couponError
                    ? `${pricing.couponError} ระบบได้คืนเงินให้แล้ว กรุณาสั่งซื้อใหม่`
                    : 'ยอดชำระไม่ตรงกับตะกร้า ระบบได้คืนเงินให้แล้ว กรุณาสั่งซื้อใหม่'
            )
        }

        const { id, amount, status, currency } = paymentIntent
        try {
            // สร้างคำสั่งซื้อ + ตัดสต็อก + ล้างตะกร้า ในชุดเดียว
            const order = await transaction(async (conn) => {
                // ตรวจคูปองซ้ำแบบล็อกแถว: กันคนอื่นใช้โค้ดจนครบจำนวนระหว่างที่เรากำลังจ่าย
                const locked = await cartPricing(cart, userId, conn, true)
                if (locked.discount !== pricing.discount) {
                    throw new RefundError('โค้ดส่วนลดใช้ไม่ได้แล้วระหว่างชำระเงิน ระบบได้คืนเงินให้แล้ว กรุณาสั่งซื้อใหม่')
                }
                const result = await query(
                    `INSERT INTO \`order\` (cartTotal, couponCode, discount, orderedById, stripePayment, amount, status, currency, createdAt, updatedAt)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, UTC_TIMESTAMP(3), UTC_TIMESTAMP(3))`,
                    [pricing.total, pricing.coupon?.code || null, pricing.discount, userId, id, amount, status, currency],
                    conn
                )
                const orderId = result.insertId
                await query(
                    'INSERT INTO productonorder (orderId, productId, count, price) VALUES ?',
                    [items.map((i) => [orderId, i.productId, i.count, i.price])],
                    conn
                )
                for (const i of items) {
                    // ตัดสต็อกเฉพาะเมื่อของยังพอ (กันกรณีมีคนซื้อชิ้นสุดท้ายพร้อมกัน)
                    const updated = await query(
                        `UPDATE product SET quantity = quantity - ?, sold = sold + ?, updatedAt = UTC_TIMESTAMP(3)
                         WHERE id = ? AND quantity >= ?`,
                        [i.count, i.count, i.productId, i.count],
                        conn
                    )
                    if (updated.affectedRows === 0) throw new RefundError()
                }
                await query('DELETE FROM cart WHERE orderedById = ?', [userId], conn)
                return one('SELECT * FROM `order` WHERE id = ?', [orderId], conn)
            })
            return { status: 200, body: { ok: true, order } }
        } catch (error) {
            if (error instanceof RefundError) {
                await refundPayment(id)
                return fail(409, error.message)
            }
            throw error
        }
    })
}

module.exports = { fulfillPayment, refundPayment }
