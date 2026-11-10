// คูปองส่วนลด
// - ลูกค้า: ใส่โค้ดที่หน้าชำระเงิน -> ผูกกับตะกร้า -> หักส่วนลดตอนสร้างการชำระเงิน
// - Admin: สร้าง/แก้/ปิด/ลบคูปอง
// จำนวนครั้งที่ใช้ นับจากคำสั่งซื้อที่ใช้โค้ดนั้น (ไม่นับที่ถูกยกเลิก)
const { query, one } = require('../config/db')

const MIN_PAYMENT = 10 // Stripe รับขั้นต่ำ ฿10

const round2 = (n) => Math.round(n * 100) / 100
const normalizeCode = (code) => String(code || '').trim().toUpperCase()

// คำอธิบายสั้น ๆ เช่น "ลด 10% (สูงสุด ฿500)" / "ลด ฿100"
const describe = (c) =>
    c.type === 'percent'
        ? `ลด ${c.value}%${c.maxDiscount ? ` (สูงสุด ฿${c.maxDiscount.toLocaleString()})` : ''}`
        : `ลด ฿${c.value.toLocaleString()}`

const discountFor = (coupon, subtotal) => {
    const raw = coupon.type === 'percent' ? (subtotal * coupon.value) / 100 : coupon.value
    const capped = coupon.type === 'percent' && coupon.maxDiscount ? Math.min(raw, coupon.maxDiscount) : raw
    return round2(Math.min(capped, subtotal))
}

const usageCount = async (code, userId, conn) => {
    const row = await one(
        `SELECT COUNT(*) AS total, SUM(orderedById = ?) AS mine
         FROM \`order\` WHERE couponCode = ? AND orderStatus <> 'Cancelled'`,
        [userId ?? 0, code],
        conn
    )
    return { total: Number(row.total), mine: Number(row.mine || 0) }
}

// ตรวจคูปองกับยอดตะกร้า -> { coupon, discount, total } หรือ { error }
// lock = true: ล็อกแถวคูปอง (ใช้ใน transaction ตอนบันทึกคำสั่งซื้อ กันใช้เกินจำนวนพร้อมกัน)
async function checkCoupon({ code, couponId }, userId, subtotal, conn, lock = false) {
    const coupon = couponId
        ? await one(`SELECT * FROM coupon WHERE id = ?${lock ? ' FOR UPDATE' : ''}`, [couponId], conn)
        : await one(`SELECT * FROM coupon WHERE code = ?${lock ? ' FOR UPDATE' : ''}`, [normalizeCode(code)], conn)
    if (!coupon || !coupon.isActive) return { error: 'ไม่พบโค้ดส่วนลดนี้ หรือโค้ดถูกปิดใช้งาน' }

    const now = new Date()
    if (coupon.startsAt && now < coupon.startsAt) return { error: 'โค้ดนี้ยังไม่เริ่มใช้งาน' }
    if (coupon.expiresAt && now > coupon.expiresAt) return { error: 'โค้ดนี้หมดอายุแล้ว' }
    if (subtotal < coupon.minOrder) {
        return { error: `ใช้ได้เมื่อสั่งซื้อครบ ฿${coupon.minOrder.toLocaleString()} (ขาดอีก ฿${round2(coupon.minOrder - subtotal).toLocaleString()})` }
    }

    const used = await usageCount(coupon.code, userId, conn)
    if (coupon.usageLimit != null && used.total >= coupon.usageLimit) return { error: 'โค้ดนี้ถูกใช้ครบจำนวนแล้ว' }
    if (coupon.perUserLimit != null && used.mine >= coupon.perUserLimit) return { error: 'คุณใช้โค้ดนี้ครบจำนวนแล้ว' }

    const discount = discountFor(coupon, subtotal)
    const total = round2(subtotal - discount)
    if (total < MIN_PAYMENT) return { error: `ยอดหลังหักส่วนลดต้องไม่ต่ำกว่า ฿${MIN_PAYMENT}` }

    return { coupon, discount, total }
}

// ยอดที่ต้องจ่ายของตะกร้า (ตรวจคูปองใหม่ทุกครั้ง — คูปองอาจหมดอายุระหว่างทาง)
async function cartPricing(cart, userId, conn, lock = false) {
    const base = { subtotal: cart.cartTotal, discount: 0, total: cart.cartTotal, coupon: null }
    if (!cart.couponId) return base
    const result = await checkCoupon({ couponId: cart.couponId }, userId, cart.cartTotal, conn, lock)
    if (result.error) return { ...base, couponError: result.error }
    return { subtotal: cart.cartTotal, discount: result.discount, total: result.total, coupon: result.coupon }
}

const publicCoupon = (c) => c && { code: c.code, description: c.description || describe(c), label: describe(c) }

// ---------- ลูกค้า ----------

const latestCart = (userId) => one('SELECT * FROM cart WHERE orderedById = ? ORDER BY id DESC LIMIT 1', [userId])

// POST /user/cart/coupon — { code }
exports.applyCoupon = async (req, res) => {
    try {
        const userId = Number(req.user.id)
        const cart = await latestCart(userId)
        if (!cart) return res.status(400).json({ message: 'ยังไม่มีสินค้าในตะกร้า' })
        if (!normalizeCode(req.body?.code)) return res.status(400).json({ message: 'กรุณากรอกโค้ดส่วนลด' })

        const result = await checkCoupon({ code: req.body.code }, userId, cart.cartTotal)
        if (result.error) return res.status(400).json({ message: result.error })

        await query('UPDATE cart SET couponId = ?, updatedAt = UTC_TIMESTAMP(3) WHERE id = ?', [result.coupon.id, cart.id])
        res.json({
            subtotal: cart.cartTotal,
            discount: result.discount,
            total: result.total,
            coupon: publicCoupon(result.coupon),
        })
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Server Error' })
    }
}

// DELETE /user/cart/coupon
exports.removeCoupon = async (req, res) => {
    try {
        await query('UPDATE cart SET couponId = NULL WHERE orderedById = ?', [Number(req.user.id)])
        res.json({ ok: true })
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Server Error' })
    }
}

// ---------- Admin ----------

const withUsage = async (coupons) => {
    if (!coupons.length) return coupons
    const rows = await query(
        `SELECT couponCode, COUNT(*) AS used, SUM(discount) AS totalDiscount
         FROM \`order\` WHERE couponCode IN (?) AND orderStatus <> 'Cancelled' GROUP BY couponCode`,
        [coupons.map((c) => c.code)]
    )
    const map = new Map(rows.map((r) => [r.couponCode, r]))
    return coupons.map((c) => ({
        ...c,
        label: describe(c),
        used: Number(map.get(c.code)?.used || 0),
        totalDiscount: Number(map.get(c.code)?.totalDiscount || 0),
    }))
}

const toNumberOrNull = (v) => (v === '' || v == null ? null : Number(v))
const toDateOrNull = (v) => (v ? new Date(v) : null)

// ตรวจและแปลงข้อมูลจากฟอร์ม -> { data } หรือ { error }
function parseCoupon(body) {
    const data = {
        code: normalizeCode(body.code),
        description: String(body.description || '').trim() || null,
        type: body.type === 'fixed' ? 'fixed' : 'percent',
        value: Number(body.value),
        minOrder: Number(body.minOrder || 0),
        maxDiscount: toNumberOrNull(body.maxDiscount),
        usageLimit: toNumberOrNull(body.usageLimit),
        perUserLimit: toNumberOrNull(body.perUserLimit),
        startsAt: toDateOrNull(body.startsAt),
        expiresAt: toDateOrNull(body.expiresAt),
        isActive: body.isActive === undefined ? true : !!body.isActive,
        isPublic: body.isPublic === undefined ? true : !!body.isPublic,
    }
    if (!/^[A-Z0-9._-]{3,40}$/.test(data.code)) return { error: 'โค้ดต้องเป็นภาษาอังกฤษ/ตัวเลข 3–40 ตัว (ใช้ . - _ ได้ เว้นวรรคไม่ได้)' }
    if (!(data.value > 0)) return { error: 'มูลค่าส่วนลดต้องมากกว่า 0' }
    if (data.type === 'percent' && data.value > 100) return { error: 'ส่วนลดแบบ % ต้องไม่เกิน 100' }
    if (data.type === 'fixed') data.maxDiscount = null
    for (const [k, label] of [['minOrder', 'ยอดขั้นต่ำ'], ['maxDiscount', 'ลดสูงสุด'], ['usageLimit', 'จำนวนครั้งทั้งหมด'], ['perUserLimit', 'จำนวนครั้งต่อคน']]) {
        if (data[k] != null && (!Number.isFinite(data[k]) || data[k] < 0)) return { error: `${label}ไม่ถูกต้อง` }
    }
    if ([data.startsAt, data.expiresAt].some((d) => d && Number.isNaN(d.getTime()))) return { error: 'วันที่ไม่ถูกต้อง' }
    if (data.startsAt && data.expiresAt && data.expiresAt <= data.startsAt) return { error: 'วันหมดอายุต้องหลังวันเริ่มใช้' }
    return { data }
}

const COLUMNS = ['code', 'description', 'type', 'value', 'minOrder', 'maxDiscount', 'usageLimit', 'perUserLimit', 'startsAt', 'expiresAt', 'isActive', 'isPublic']

exports.listCoupons = async (req, res) => {
    try {
        res.json(await withUsage(await query('SELECT * FROM coupon ORDER BY id DESC')))
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Server Error' })
    }
}

exports.createCoupon = async (req, res) => {
    try {
        const { data, error } = parseCoupon(req.body)
        if (error) return res.status(400).json({ message: error })
        const result = await query(
            `INSERT INTO coupon (${COLUMNS.join(', ')}, createdAt, updatedAt)
             VALUES (${COLUMNS.map(() => '?').join(', ')}, UTC_TIMESTAMP(3), UTC_TIMESTAMP(3))`,
            COLUMNS.map((k) => data[k])
        )
        const [coupon] = await withUsage([await one('SELECT * FROM coupon WHERE id = ?', [result.insertId])])
        res.json(coupon)
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') return res.status(400).json({ message: 'มีโค้ดนี้อยู่แล้ว' })
        console.log(error)
        res.status(500).json({ message: 'Server Error' })
    }
}

// PUT /admin/coupons/:id — ส่งทั้งฟอร์ม หรือแค่ { isActive } เพื่อเปิด/ปิด
exports.updateCoupon = async (req, res) => {
    try {
        const id = Number(req.params.id)
        const old = await one('SELECT * FROM coupon WHERE id = ?', [id])
        if (!old) return res.status(404).json({ message: 'ไม่พบคูปอง' })
        const { data, error } = parseCoupon({ ...old, ...req.body })
        if (error) return res.status(400).json({ message: error })
        // เปลี่ยนโค้ดของคูปองที่มีคนใช้แล้วไม่ได้ (ประวัติคำสั่งซื้ออ้างอิงด้วยโค้ด)
        if (data.code !== old.code) {
            const used = await usageCount(old.code, null)
            if (used.total > 0) return res.status(400).json({ message: 'คูปองนี้มีคนใช้แล้ว เปลี่ยนโค้ดไม่ได้' })
        }
        await query(
            `UPDATE coupon SET ${COLUMNS.map((k) => `${k} = ?`).join(', ')}, updatedAt = UTC_TIMESTAMP(3) WHERE id = ?`,
            [...COLUMNS.map((k) => data[k]), id]
        )
        const [coupon] = await withUsage([await one('SELECT * FROM coupon WHERE id = ?', [id])])
        res.json(coupon)
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') return res.status(400).json({ message: 'มีโค้ดนี้อยู่แล้ว' })
        console.log(error)
        res.status(500).json({ message: 'Server Error' })
    }
}

// ลบได้ — คำสั่งซื้อเดิมยังเก็บโค้ดและส่วนลดไว้ ตะกร้าที่ใส่โค้ดนี้จะถูกถอดออก
exports.deleteCoupon = async (req, res) => {
    try {
        const result = await query('DELETE FROM coupon WHERE id = ?', [Number(req.params.id)])
        if (result.affectedRows === 0) return res.status(404).json({ message: 'ไม่พบคูปอง' })
        res.json({ ok: true })
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Server Error' })
    }
}

// ---------- ศูนย์เก็บคูปอง / กระเป๋าคูปอง ----------

// ข้อมูลคูปองที่ลูกค้าเห็น (ไม่ส่งตัวเลขภายในอย่างจำนวนที่ใช้ไปทั้งหมด)
const shopCoupon = (c) => ({
    id: c.id,
    code: c.code,
    type: c.type,
    value: c.value,
    label: describe(c),
    description: c.description || describe(c),
    minOrder: c.minOrder,
    maxDiscount: c.maxDiscount,
    startsAt: c.startsAt,
    expiresAt: c.expiresAt,
})

// คูปองที่กำลังแจก: เปิดใช้งาน + แสดงในศูนย์ + ยังไม่หมดอายุ + ยังไม่ถูกใช้ครบ
async function availableCoupons() {
    const rows = await query(
        `SELECT * FROM coupon
         WHERE isActive = 1 AND isPublic = 1 AND (expiresAt IS NULL OR expiresAt > UTC_TIMESTAMP(3))
         ORDER BY (expiresAt IS NULL), expiresAt, id DESC`
    )
    const withUse = await withUsage(rows)
    return withUse.filter((c) => c.usageLimit == null || c.used < c.usageLimit)
}

// GET /coupons — หน้าเก็บคูปอง (ไม่ต้อง login)
exports.listAvailable = async (req, res) => {
    try {
        res.json((await availableCoupons()).map(shopCoupon))
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Server Error' })
    }
}

// GET /user/coupons/center — เหมือน /coupons + บอกว่าเก็บแล้วหรือยัง
exports.listCenter = async (req, res) => {
    try {
        const mine = await query('SELECT couponId FROM usercoupon WHERE userId = ?', [Number(req.user.id)])
        const collected = new Set(mine.map((r) => r.couponId))
        res.json((await availableCoupons()).map((c) => ({ ...shopCoupon(c), collected: collected.has(c.id) })))
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Server Error' })
    }
}

// POST /user/coupons/:id/collect — เก็บเข้ากระเป๋า
exports.collect = async (req, res) => {
    try {
        const id = Number(req.params.id)
        const coupon = (await availableCoupons()).find((c) => c.id === id)
        if (!coupon) return res.status(400).json({ message: 'คูปองนี้หมดแล้ว หรือไม่ได้แจกแล้ว' })
        await query(
            'INSERT IGNORE INTO usercoupon (userId, couponId, collectedAt) VALUES (?, ?, UTC_TIMESTAMP(3))',
            [Number(req.user.id), id]
        )
        res.json({ ok: true, coupon: { ...shopCoupon(coupon), collected: true } })
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Server Error' })
    }
}

// GET /user/coupons?subtotal=12000 — กระเป๋าคูปอง
// ส่ง subtotal มา (หน้าชำระเงิน) -> บอกว่าแต่ละใบใช้กับตะกร้านี้ได้ไหม ลดเท่าไร หรือติดเงื่อนไขอะไร
exports.myCoupons = async (req, res) => {
    try {
        const userId = Number(req.user.id)
        const subtotal = req.query.subtotal != null ? Number(req.query.subtotal) : null
        const rows = await query(
            `SELECT c.*, uc.collectedAt FROM usercoupon uc JOIN coupon c ON c.id = uc.couponId
             WHERE uc.userId = ? ORDER BY uc.id DESC`,
            [userId]
        )
        const list = []
        for (const c of rows) {
            // ใช้ราคาสูงมากเช็กเงื่อนไขอื่นก่อน (ไม่ให้ติดเรื่องยอดขั้นต่ำ) แล้วค่อยเช็กกับยอดจริง
            const general = await checkCoupon({ couponId: c.id }, userId, Math.max(c.minOrder, 1e9))
            const forCart = subtotal != null && !general.error ? await checkCoupon({ couponId: c.id }, userId, subtotal) : null
            list.push({
                ...shopCoupon(c),
                collectedAt: c.collectedAt,
                status: general.error ? 'unusable' : 'ready', // ready = ยังใช้ได้ (ไม่หมดอายุ/ไม่ครบจำนวน)
                reason: general.error || forCart?.error || null,
                usable: forCart ? !forCart.error : !general.error,
                discount: forCart && !forCart.error ? forCart.discount : 0,
            })
        }
        res.json(list)
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Server Error' })
    }
}

exports.cartPricing = cartPricing
exports.publicCoupon = publicCoupon
