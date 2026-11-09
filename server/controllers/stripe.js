const { one } = require('../config/db')
const { stripe, toSatang } = require('../config/stripe')

exports.payment = async (req, res) => {
    try {
        const cart = await one('SELECT cartTotal FROM cart WHERE orderedById = ? ORDER BY id DESC LIMIT 1', [req.user.id])
        if (!cart) {
            return res.status(400).json({ message: 'Cart is Empty' })
        }

        const paymentIntent = await stripe.paymentIntents.create({
            amount: toSatang(cart.cartTotal),
            currency: 'thb',
            automatic_payment_methods: { enabled: true },
            // ใช้ยืนยันตอนบันทึกคำสั่งซื้อว่าการชำระเงินนี้เป็นของผู้ใช้คนนี้
            metadata: { userId: String(req.user.id) },
        })
        res.send({ clientSecret: paymentIntent.client_secret })
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Server Error' })
    }
}
