// ระบบแจ้งเตือน
// - ผู้ใช้: กล่องแจ้งเตือน (สถานะคำสั่งซื้อเปลี่ยน, สินค้ากลับมามีของ) + กด "แจ้งเตือนเมื่อมีของ"
// - Admin: รายการสินค้าใกล้หมด ตามเกณฑ์ lowStockThreshold ของแต่ละสินค้า
const { query, one, withCategoryAndImages } = require('../config/db')

const STATUS_TH = {
    'Not Process': 'รอดำเนินการ',
    Processing: 'กำลังดำเนินการ',
    Completed: 'สำเร็จ',
    Cancelled: 'ยกเลิก',
}

// เลขที่คำสั่งซื้อสำหรับแสดงผล: 20 -> "ORD-00020" (ตรงกับหน้าเว็บ)
const orderCode = (id) => `ORD-${String(id).padStart(5, '0')}`

// สร้างแจ้งเตือนให้ผู้ใช้หลายคนพร้อมกัน (ใช้ใน transaction ได้)
async function notify(userIds, { type, title, message, link = null }, conn) {
    if (!userIds.length) return
    await query(
        'INSERT INTO notification (userId, type, title, message, link, createdAt) VALUES ?',
        [userIds.map((id) => [id, type, title, message, link, new Date()])],
        conn
    )
}

// แจ้งผู้ใช้เมื่อ admin เปลี่ยนสถานะคำสั่งซื้อ
exports.notifyOrderStatus = async (order, conn) => {
    await notify([order.orderedById], {
        type: 'order_status',
        title: `คำสั่งซื้อ #${orderCode(order.id)}: ${STATUS_TH[order.orderStatus] || order.orderStatus}`,
        message: `สถานะคำสั่งซื้อ #${orderCode(order.id)} ของคุณเปลี่ยนเป็น "${STATUS_TH[order.orderStatus] || order.orderStatus}"`,
        link: '/user/history',
    }, conn)
}

// สินค้ากลับมามีของ -> แจ้งทุกคนที่กดรอไว้ แล้วลบรายการรอออก
exports.notifyRestock = async (product, conn) => {
    if (product.quantity <= 0) return
    const rows = await query('SELECT userId FROM restockalert WHERE productId = ?', [product.id], conn)
    if (!rows.length) return
    await notify(rows.map((r) => r.userId), {
        type: 'restock',
        title: 'สินค้ากลับมามีของแล้ว',
        message: `${product.title} กลับมาพร้อมจำหน่ายแล้ว (${product.quantity} ชิ้น)`,
        link: `/product/${product.id}`,
    }, conn)
    await query('DELETE FROM restockalert WHERE productId = ?', [product.id], conn)
}

// GET /user/notifications — 20 รายการล่าสุด + จำนวนที่ยังไม่อ่าน
exports.listNotifications = async (req, res) => {
    try {
        const notifications = await query(
            'SELECT id, type, title, message, link, isRead, createdAt FROM notification WHERE userId = ? ORDER BY id DESC LIMIT 20',
            [req.user.id]
        )
        const { n } = await one('SELECT COUNT(*) AS n FROM notification WHERE userId = ? AND isRead = 0', [req.user.id])
        res.json({ notifications, unread: n })
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Server Error' })
    }
}

// POST /user/notifications/read — { id } อ่านรายการเดียว, ไม่ส่ง id = อ่านทั้งหมด
exports.readNotifications = async (req, res) => {
    try {
        const id = req.body?.id
        if (id) {
            await query('UPDATE notification SET isRead = 1 WHERE id = ? AND userId = ?', [Number(id), req.user.id])
        } else {
            await query('UPDATE notification SET isRead = 1 WHERE userId = ?', [req.user.id])
        }
        res.json({ ok: true })
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Server Error' })
    }
}

// GET /user/restock-alert/:productId — ผู้ใช้กดรอสินค้านี้ไว้หรือยัง
exports.getRestockAlert = async (req, res) => {
    try {
        const row = await one('SELECT id FROM restockalert WHERE userId = ? AND productId = ?', [req.user.id, Number(req.params.productId)])
        res.json({ subscribed: !!row })
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Server Error' })
    }
}

// POST /user/restock-alert/:productId — { subscribe: true|false }
exports.setRestockAlert = async (req, res) => {
    try {
        const productId = Number(req.params.productId)
        const product = await one('SELECT id, quantity FROM product WHERE id = ?', [productId])
        if (!product) {
            return res.status(404).json({ message: 'Product not found' })
        }
        if (req.body?.subscribe === false) {
            await query('DELETE FROM restockalert WHERE userId = ? AND productId = ?', [req.user.id, productId])
            return res.json({ subscribed: false })
        }
        if (product.quantity > 0) {
            return res.status(400).json({ message: 'สินค้านี้ยังมีของอยู่' })
        }
        await query(
            'INSERT IGNORE INTO restockalert (userId, productId, createdAt) VALUES (?, ?, UTC_TIMESTAMP(3))',
            [req.user.id, productId]
        )
        res.json({ subscribed: true })
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Server Error' })
    }
}

// GET /admin/low-stock — สินค้าที่คงเหลือ ≤ เกณฑ์ของสินค้านั้น (เกณฑ์ 0 = ไม่แจ้ง)
exports.lowStock = async (req, res) => {
    try {
        const products = await query(
            `SELECT p.*, (SELECT COUNT(*) FROM restockalert r WHERE r.productId = p.id) AS waiting
             FROM product p
             WHERE p.lowStockThreshold > 0 AND p.quantity <= p.lowStockThreshold
             ORDER BY p.quantity ASC, p.id ASC`
        )
        res.json(await withCategoryAndImages(products))
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Server Error' })
    }
}
