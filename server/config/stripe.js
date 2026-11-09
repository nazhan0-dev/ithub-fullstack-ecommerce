// Stripe client ใช้ร่วมกันทุก controller
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)

// บาท -> สตางค์ (Stripe รับจำนวนเงินเป็นหน่วยย่อยสุด และต้องเป็นจำนวนเต็ม)
const toSatang = (baht) => Math.round(Number(baht) * 100)

module.exports = { stripe, toSatang }
