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

const PORT = process.env.PORT || 8000
// หน้าเว็บที่อนุญาตให้เรียก API: CLIENT_URL คั่นหลายที่ด้วย , เช่น "https://shop.com,https://www.shop.com"
// เทียบแบบตรงทั้งค่า (ไม่ใช่ขึ้นต้นด้วย/มีคำนี้) — ตัดช่องว่างและ / ท้ายออกให้ตรงกับ header Origin ของเบราว์เซอร์
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
    .split(',')
    .map((url) => url.trim().replace(/\/+$/, ''))
    .filter(Boolean)
const isAllowedOrigin = (origin) => allowedOrigins.includes(origin)

// middleware
app.use(morgan('dev'))
app.use(express.json({limit : '20mb'}))
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

// step 2 start server
app.listen(PORT,
    ()=>console.log(`Server is running on port ${PORT}`))
