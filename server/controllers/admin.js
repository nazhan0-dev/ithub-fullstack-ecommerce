const { query, one, transaction, withLineItems } = require('../config/db')
const { notifyOrderStatus } = require('./notification')

const ORDER_STATUSES = ['Not Process', 'Processing', 'Completed', 'Cancelled']

exports.changeOrderStatus = async (req, res) => {
    try {
        const { orderId, orderStatus } = req.body
        if (!ORDER_STATUSES.includes(orderStatus)) {
            return res.status(400).json({ message: 'Invalid order status' })
        }
        const orderUpdate = await transaction(async (conn) => {
            const before = await one('SELECT orderStatus, status FROM `order` WHERE id = ? FOR UPDATE', [Number(orderId)], conn)
            if (!before) return null
            // ลูกค้ายกเลิกและได้เงินคืนแล้ว -> เปลี่ยนสถานะไม่ได้ (สต็อกถูกคืนไปแล้ว)
            if (before.status === 'refunded' && orderStatus !== 'Cancelled') return { refunded: true }
            await query(
                'UPDATE `order` SET orderStatus = ?, updatedAt = UTC_TIMESTAMP(3) WHERE id = ?',
                [orderStatus, Number(orderId)],
                conn
            )
            const order = await one('SELECT * FROM `order` WHERE id = ?', [Number(orderId)], conn)
            // แจ้งลูกค้าเฉพาะเมื่อสถานะเปลี่ยนจริง
            if (before.orderStatus !== orderStatus) await notifyOrderStatus(order, conn)
            return order
        })
        if (!orderUpdate) {
            return res.status(404).json({ message: 'Order not found' })
        }
        if (orderUpdate.refunded) {
            return res.status(400).json({ message: 'คำสั่งซื้อนี้ยกเลิกและคืนเงินแล้ว เปลี่ยนสถานะไม่ได้' })
        }
        res.json(orderUpdate)
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Server Error' })
    }
}

exports.getOrderAdmin = async (req, res) => {
    try {
        const orders = await query(
            `SELECT o.*, u.email AS _email, u.address AS _address
             FROM \`order\` o JOIN user u ON u.id = o.orderedById
             ORDER BY o.id`
        )
        const shaped = orders.map(({ _email, _address, ...o }) => ({
            ...o,
            orderedBy: { id: o.orderedById, email: _email, address: _address },
        }))
        res.json(await withLineItems(shaped, 'productonorder', 'orderId'))
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Server Error' })
    }
}
