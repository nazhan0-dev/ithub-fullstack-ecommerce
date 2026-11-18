// POST /api/stripe/webhook — Stripe แจ้งผลการชำระเงินมาที่ server โดยตรง
// ใช้เป็นทางสำรอง: ลูกค้าจ่ายเงินแล้วแต่ปิดแท็บ/เน็ตหลุดก่อนหน้าเว็บบันทึกคำสั่งซื้อ
// ต้องได้ body ดิบ (Buffer) เพื่อตรวจลายเซ็น จึงต่อ route นี้ไว้ก่อน express.json ใน server.js
const { stripe } = require('../config/stripe')
const { fulfillPayment } = require('../services/order')

exports.webhook = async (req, res) => {
    const secret = process.env.STRIPE_WEBHOOK_SECRET
    if (!secret) {
        console.log('STRIPE_WEBHOOK_SECRET is not set: webhook disabled')
        return res.status(503).json({ message: 'Webhook not configured' })
    }

    // ตรวจลายเซ็น: ยืนยันว่ามาจาก Stripe จริง และไม่ถูกแก้ระหว่างทาง
    let event
    try {
        event = stripe.webhooks.constructEvent(req.body, req.headers['stripe-signature'], secret)
    } catch {
        return res.status(400).json({ message: 'Invalid signature' })
    }

    if (event.type === 'payment_intent.succeeded') {
        try {
            const result = await fulfillPayment(event.data.object.id)
            if (result.status !== 200) {
                // ผลทางธุรกิจที่จบแล้ว (คืนเงินแล้ว, ไม่ใช่การชำระของร้านนี้ ฯลฯ) -> ตอบ 200 ให้ Stripe ไม่ส่งซ้ำ
                console.log('Webhook', event.data.object.id, result.body.message)
            }
        } catch (error) {
            // ขัดข้องชั่วคราว (เช่น ฐานข้อมูล) -> ตอบ 500 ให้ Stripe ส่งซ้ำภายหลัง
            console.log(error)
            return res.status(500).json({ message: 'Server Error' })
        }
    }

    // event อื่นไม่ได้ใช้ แต่ต้องตอบ 2xx ไม่อย่างนั้น Stripe จะส่งซ้ำ
    res.json({ received: true })
}
