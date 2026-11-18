// โหลดค่าจาก .env (Node 20.12+)
try { process.loadEnvFile(require('path').join(__dirname, '.env')) } catch { console.warn("ไม่พบไฟล์ .env") }

// step 1 import express
const express = require('express')
const app = express()
const morgan = require('morgan')
const path = require('path')
const {readdirSync} = require('fs')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const { webhook } = require('./controllers/stripeWebhook')

const PORT = process.env.PORT || 8000
// หน้าเว็บที่อนุญาตให้เรียก API: CLIENT_URL คั่นหลายที่ด้วย , เช่น "https://shop.com,https://www.shop.com"
// เทียบแบบตรงทั้งค่า (ไม่ใช่ขึ้นต้นด้วย/มีคำนี้) — ตัดช่องว่างและ / ท้ายออกให้ตรงกับ header Origin ของเบราว์เซอร์
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
    .split(',')
    .map((url) => url.trim().replace(/\/+$/, ''))
    .filter(Boolean)
const isAllowedOrigin = (origin) => allowedOrigins.includes(origin)

// อยู่หลัง reverse proxy (Render, Railway, nginx) ให้ตั้ง TRUST_PROXY=true เพื่อให้ req.ip เป็น IP จริงของผู้ใช้
// (ใช้จำกัดการเดารหัสผ่านต่อ IP) — ไม่ได้อยู่หลัง proxy ห้ามเปิด ไม่อย่างนั้นปลอม IP ผ่าน header ได้
if (process.env.TRUST_PROXY === 'true') app.set('trust proxy', 1)

// middleware
app.use(morgan(process.env.NODE_ENV === 'test' ? 'tiny' : 'dev'))

// Stripe webhook ต้องได้ body ดิบไว้ตรวจลายเซ็น -> ต่อไว้ก่อน express.json
app.post('/api/stripe/webhook', express.raw({ type: 'application/json', limit: '1mb' }), webhook)

// ขนาด body: อัปโหลดรูปสินค้า (base64 ที่ย่อเหลือ 720px แล้ว) ให้ 8mb ที่เหลือ 1mb พอสำหรับข้อมูลทั่วไป
// body ที่ใหญ่เกินจะได้ 413 — ตั้งเผื่อน้อย ๆ กันการส่งข้อมูลก้อนใหญ่ถล่ม server
app.use('/api/images', express.json({ limit: '8mb' }))
app.use(express.json({ limit: '1mb' }))
app.use(cookieParser())
// credentials: true -> อนุญาตให้หน้าเว็บส่ง cookie มากับ request
// origin ที่ไม่อยู่ในรายการ -> ไม่ส่ง header CORS กลับ (เบราว์เซอร์จะบล็อกเอง)
// ไม่มี Origin (เช่น curl, Postman, server-to-server) -> ไม่เกี่ยวกับ CORS ปล่อยผ่าน
app.use(
    cors({
        origin: (origin, callback) => callback(null, !origin || isAllowedOrigin(origin)),
        credentials: true,
    })
)

// กัน CSRF: request ที่แก้ไขข้อมูลต้องมาจากหน้าเว็บที่อนุญาตเท่านั้น
app.use((req, res, next) => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next()
    const origin = req.headers.origin
    if (origin && !isAllowedOrigin(origin)) {
        return res.status(403).json({ message: 'Origin not allowed' })
    }
    next()
})

const routesDir = path.join(__dirname, 'routes')
readdirSync(routesDir)
.map((c)=>app.use('/api',require(path.join(routesDir, c))))

// แปลงข้อผิดพลาดจากการอ่าน body (JSON ผิดรูปแบบ, ใหญ่เกิน) เป็น JSON แทนหน้า HTML ของ Express
app.use((err, req, res, next) => {
    if (err.type === 'entity.too.large') {
        return res.status(413).json({ message: 'ข้อมูลที่ส่งมีขนาดใหญ่เกินไป' })
    }
    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({ message: 'รูปแบบข้อมูลไม่ถูกต้อง (JSON)' })
    }
    console.log(err)
    res.status(err.status || 500).json({ message: 'Server Error' })
})

// step 2 start server
app.listen(PORT,
    ()=>console.log(`Server is running on port ${PORT}`))
