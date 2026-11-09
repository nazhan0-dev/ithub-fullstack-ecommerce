// โหลดค่าจาก .env (Node 20.12+)
try { process.loadEnvFile(require('path').join(__dirname, '.env')) } catch { console.warn("ไม่พบไฟล์ .env") }

// step 1 import express
const express = require('express')
const app = express()
const morgan = require('morgan')
const path = require('path')
const {readdirSync} = require('fs')
const cors = require('cors')

const PORT = process.env.PORT || 8000
// หน้าเว็บที่อนุญาตให้เรียก API (คั่นหลายที่ด้วย ,)
const CLIENT_URL = (process.env.CLIENT_URL || 'http://localhost:5173').split(',').map((url) => url.trim())

// middleware
app.use(morgan('dev'))
app.use(express.json({limit : '20mb'}))
app.use(cors({ origin: CLIENT_URL }))

const routesDir = path.join(__dirname, 'routes')
readdirSync(routesDir)
.map((c)=>app.use('/api',require(path.join(routesDir, c))))

// step 2 start server
app.listen(PORT,
    ()=>console.log(`Server is running on port ${PORT}`))
