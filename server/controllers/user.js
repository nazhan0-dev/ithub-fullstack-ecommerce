const { query, one, transaction, withLineItems } = require('../config/db')
const { stripe, toSatang } = require('../config/stripe')

class OutOfStockError extends Error {
    constructor(paymentIntentId) {
        super('ขออภัย สินค้าบางรายการหมดระหว่างชำระเงิน ระบบได้คืนเงินให้แล้ว')
        this.paymentIntentId = paymentIntentId
    }
}

// ---------- admin: จัดการผู้ใช้ ----------

exports.listUsers = async (req, res) => {
    try {
        const users = await query('SELECT id, email, role, enabled, address FROM user ORDER BY id')
        res.send(users)
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Server Error' })
    }
}

exports.changeStatus = async (req, res) => {
    try {
        const { id, enabled } = req.body
        await query('UPDATE user SET enabled = ?, updatedAt = UTC_TIMESTAMP(3) WHERE id = ?', [Boolean(enabled), Number(id)])
        res.send('Update Status Success !!!')
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Server Error' })
    }
}

exports.changeRole = async (req, res) => {
    try {
        const { id, role } = req.body
        if (!['user', 'admin'].includes(role)) {
            return res.status(400).json({ message: 'Invalid role' })
        }
        await query('UPDATE user SET role = ?, updatedAt = UTC_TIMESTAMP(3) WHERE id = ?', [role, Number(id)])
        res.send('Update Role Success !!!')
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Server Error' })
    }
}

// ---------- ตะกร้า ----------

exports.userCart = async (req, res) => {
    try {
        const { cart } = req.body
        const userId = Number(req.user.id)
        if (!Array.isArray(cart) || cart.length === 0) {
            return res.status(400).json({ ok: false, message: 'Cart is Empty' })
        }

        // รวมจำนวนของสินค้าเดียวกัน และรับเฉพาะจำนวนเต็มบวก
        const counts = new Map()
        for (const item of cart) {
            const productId = Number(item.id)
            const count = Number(item.count)
            if (!Number.isInteger(productId) || !Number.isInteger(count) || count < 1) {
                return res.status(400).json({ ok: false, message: 'Invalid cart item' })
            }
            counts.set(productId, (counts.get(productId) || 0) + count)
        }

        // ตรวจสต็อก และใช้ราคาจากฐานข้อมูล (ไม่เชื่อราคาที่ส่งมาจากหน้าเว็บ)
        const products = await query('SELECT id, title, price, quantity FROM product WHERE id IN (?)', [[...counts.keys()]])
        const byId = new Map(products.map((p) => [p.id, p]))
        for (const [productId, count] of counts) {
            const product = byId.get(productId)
            if (!product || count > product.quantity) {
                return res.status(400).json({
                    ok: false,
                    message: `ขออภัย. สินค้า ${product?.title || 'product'} หมด`,
                })
            }
        }

        const lines = [...counts].map(([productId, count]) => ({
            productId,
            count,
            price: byId.get(productId).price,
        }))
        const cartTotal = lines.reduce((sum, l) => sum + l.price * l.count, 0)

        await transaction(async (conn) => {
            // ลบตะกร้าเก่า (รายการใน productoncart ถูกลบตามอัตโนมัติ)
            await query('DELETE FROM cart WHERE orderedById = ?', [userId], conn)
            const result = await query(
                'INSERT INTO cart (cartTotal, orderedById, createdAt, updatedAt) VALUES (?, ?, UTC_TIMESTAMP(3), UTC_TIMESTAMP(3))',
                [cartTotal, userId],
                conn
            )
            await query(
                'INSERT INTO productoncart (cartId, productId, count, price) VALUES ?',
                [lines.map((l) => [result.insertId, l.productId, l.count, l.price])],
                conn
            )
        })

        res.send('Add Cart Ok')
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Server Error' })
    }
}

exports.getUserCart = async (req, res) => {
    try {
        const cart = await one('SELECT * FROM cart WHERE orderedById = ? ORDER BY id DESC LIMIT 1', [Number(req.user.id)])
        if (!cart) {
            return res.json({ products: [], cartTotal: 0 })
        }
        const [full] = await withLineItems([cart], 'productoncart', 'cartId')
        res.json({ products: full.products, cartTotal: full.cartTotal })
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Server Error' })
    }
}

exports.emptyCart = async (req, res) => {
    try {
        const result = await query('DELETE FROM cart WHERE orderedById = ?', [Number(req.user.id)])
        if (result.affectedRows === 0) {
            return res.status(400).json({ message: 'No Cart' })
        }
        res.json({ message: 'Cart Empty Success', deletedCount: result.affectedRows })
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Server Error' })
    }
}

exports.saveAddress = async (req, res) => {
    try {
        const { address } = req.body
        await query('UPDATE user SET address = ?, updatedAt = UTC_TIMESTAMP(3) WHERE id = ?', [address, Number(req.user.id)])
        res.json({ ok: true, message: 'Address update success' })
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Server Error' })
    }
}

// ---------- คำสั่งซื้อ ----------

exports.saveOrder = async (req, res) => {
    try {
        const paymentIntentId = req.body.paymentIntent?.id
        const userId = Number(req.user.id)
        if (typeof paymentIntentId !== 'string' || !paymentIntentId) {
            return res.status(400).json({ ok: false, message: 'Payment is required' })
        }

        const cart = await one('SELECT * FROM cart WHERE orderedById = ? ORDER BY id DESC LIMIT 1', [userId])
        const items = cart ? await query('SELECT * FROM productoncart WHERE cartId = ? ORDER BY id', [cart.id]) : []
        if (!cart || items.length === 0) {
            return res.status(400).json({ ok: false, message: 'Cart is Empty' })
        }

        // ดึงข้อมูลการชำระเงินจาก Stripe โดยตรง (ไม่เชื่อข้อมูลที่ส่งมาจากหน้าเว็บ)
        let paymentIntent
        try {
            paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
        } catch {
            return res.status(400).json({ ok: false, message: 'Payment not found' })
        }
        if (
            paymentIntent.status !== 'succeeded' ||
            paymentIntent.metadata?.userId !== String(userId) ||
            paymentIntent.amount !== toSatang(cart.cartTotal)
        ) {
            return res.status(400).json({ ok: false, message: 'Payment not completed' })
        }
        const used = await one('SELECT id FROM `order` WHERE stripePayment = ?', [paymentIntent.id])
        if (used) {
            return res.status(400).json({ ok: false, message: 'Payment already used' })
        }

        const { id, amount, status, currency } = paymentIntent

        // สร้างคำสั่งซื้อ + ตัดสต็อก + ล้างตะกร้า ในชุดเดียว
        const order = await transaction(async (conn) => {
            const result = await query(
                `INSERT INTO \`order\` (cartTotal, orderedById, stripePayment, amount, status, currency, createdAt, updatedAt)
                 VALUES (?, ?, ?, ?, ?, ?, UTC_TIMESTAMP(3), UTC_TIMESTAMP(3))`,
                [cart.cartTotal, userId, id, amount, status, currency],
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
                if (updated.affectedRows === 0) {
                    throw new OutOfStockError(id)
                }
            }
            await query('DELETE FROM cart WHERE orderedById = ?', [userId], conn)
            return one('SELECT * FROM `order` WHERE id = ?', [orderId], conn)
        })

        res.json({ ok: true, order })
    } catch (error) {
        if (error instanceof OutOfStockError) {
            // ตัดเงินไปแล้วแต่ของไม่พอ -> คืนเงินอัตโนมัติ
            await stripe.refunds.create({ payment_intent: error.paymentIntentId }).catch(console.log)
            return res.status(409).json({ ok: false, message: error.message })
        }
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ ok: false, message: 'Payment already used' })
        }
        console.log(error)
        res.status(500).json({ message: 'Server Error' })
    }
}

exports.getOrder = async (req, res) => {
    try {
        const orders = await query('SELECT * FROM `order` WHERE orderedById = ? ORDER BY id', [Number(req.user.id)])
        res.json({ ok: true, orders: await withLineItems(orders, 'productonorder', 'orderId') })
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Server Error' })
    }
}

// POST /user/order/:id/cancel — ลูกค้ายกเลิกคำสั่งซื้อเอง (เฉพาะสถานะ "รอดำเนินการ")
// คืนสต็อก + ลดยอดขาย + คืนเงินผ่าน Stripe ในชุดเดียว: คืนเงินไม่สำเร็จ = ไม่ยกเลิก
exports.cancelOrder = async (req, res) => {
    try {
        const orderId = Number(req.params.id)
        const userId = Number(req.user.id)
        const result = await transaction(async (conn) => {
            // FOR UPDATE: กันลูกค้ากดซ้ำ / admin เปลี่ยนสถานะพร้อมกัน
            const order = await one(
                'SELECT * FROM `order` WHERE id = ? AND orderedById = ? FOR UPDATE',
                [orderId, userId],
                conn
            )
            if (!order) return { error: 404, message: 'ไม่พบคำสั่งซื้อ' }
            if (order.orderStatus !== 'Not Process') {
                return { error: 400, message: 'ยกเลิกได้เฉพาะคำสั่งซื้อที่ยังรอดำเนินการ' }
            }

            const items = await query('SELECT productId, count FROM productonorder WHERE orderId = ?', [orderId], conn)
            for (const i of items) {
                await query(
                    `UPDATE product SET quantity = quantity + ?, sold = GREATEST(sold - ?, 0), updatedAt = UTC_TIMESTAMP(3)
                     WHERE id = ?`,
                    [i.count, i.count, i.productId],
                    conn
                )
            }
            await query(
                "UPDATE `order` SET orderStatus = 'Cancelled', status = 'refunded', updatedAt = UTC_TIMESTAMP(3) WHERE id = ?",
                [orderId],
                conn
            )

            // คืนเงินเป็นขั้นสุดท้าย — ถ้า Stripe ไม่ผ่าน จะ throw แล้วย้อนกลับทุกอย่างด้านบน
            // idempotencyKey: กดซ้ำ/ส่งซ้ำ Stripe จะไม่คืนเงินสองครั้ง
            await stripe.refunds.create(
                { payment_intent: order.stripePayment },
                { idempotencyKey: `cancel-order-${orderId}` }
            )
            return { order: await one('SELECT * FROM `order` WHERE id = ?', [orderId], conn) }
        })

        if (result.error) {
            return res.status(result.error).json({ ok: false, message: result.message })
        }
        res.json({ ok: true, order: result.order })
    } catch (error) {
        console.log(error)
        if (error.type?.startsWith?.('Stripe')) {
            return res.status(502).json({ ok: false, message: 'คืนเงินไม่สำเร็จ กรุณาลองใหม่หรือติดต่อร้าน' })
        }
        res.status(500).json({ message: 'Server Error' })
    }
}
