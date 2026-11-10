const { one } = require('../config/db')
const { stripe, toSatang } = require('../config/stripe')
const { cartPricing, publicCoupon } = require('./coupon')

exports.payment = async (req, res) => {
    try {
        const cart = await one('SELECT * FROM cart WHERE orderedById = ? ORDER BY id DESC LIMIT 1', [req.user.id])
        if (!cart) {
            return res.status(400).json({ message: 'Cart is Empty' })
        }

        // หักส่วนลดคูปอง (ถ้ามี และยังใช้ได้)
        const pricing = await cartPricing(cart, Number(req.user.id))
        if (pricing.couponError) {
            return res.status(400).json({ message: pricing.couponError })
        }
        const paymentIntent = await stripe.paymentIntents.create({
            amount: toSatang(pricing.total),
            currency: 'thb',
            automatic_payment_methods: { enabled: true },
            // ใช้ยืนยันตอนบันทึกคำสั่งซื้อว่าการชำระเงินนี้เป็นของผู้ใช้คนนี้
            metadata: { userId: String(req.user.id) },
        })
        res.send({
            clientSecret: paymentIntent.client_secret,
            subtotal: pricing.subtotal,
            discount: pricing.discount,
            total: pricing.total,
            coupon: publicCoupon(pricing.coupon),
        })
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Server Error' })
    }
}
