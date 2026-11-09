const { query, one, withLineItems } = require('../config/db')

const ORDER_STATUSES = ['Not Process', 'Processing', 'Completed', 'Cancelled']

exports.changeOrderStatus = async (req, res) => {
    try {
        const { orderId, orderStatus } = req.body
        if (!ORDER_STATUSES.includes(orderStatus)) {
            return res.status(400).json({ message: 'Invalid order status' })
        }
        const result = await query(
            'UPDATE `order` SET orderStatus = ?, updatedAt = UTC_TIMESTAMP(3) WHERE id = ?',
            [orderStatus, Number(orderId)]
        )
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Order not found' })
        }
        const orderUpdate = await one('SELECT * FROM `order` WHERE id = ?', [Number(orderId)])
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
