// Stripe client ใช้ร่วมกันทุก controller
// STRIPE_API_BASE: ใช้เฉพาะตอนรันเทสต์ ให้ชี้ไปที่ Stripe จำลองในเครื่อง (เช่น http://127.0.0.1:12111)
// ใช้งานจริงห้ามตั้ง — ไม่ตั้ง = เรียก api.stripe.com ตามปกติ
const options = {}
if (process.env.STRIPE_API_BASE) {
    const url = new URL(process.env.STRIPE_API_BASE)
    options.host = url.hostname
    options.port = url.port
    options.protocol = url.protocol.replace(':', '')
}
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY, options)

// บาท -> สตางค์ (Stripe รับจำนวนเงินเป็นหน่วยย่อยสุด และต้องเป็นจำนวนเต็ม)
const toSatang = (baht) => Math.round(Number(baht) * 100)

module.exports = { stripe, toSatang }
