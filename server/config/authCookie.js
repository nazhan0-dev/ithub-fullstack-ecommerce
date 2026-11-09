// ตั้งค่า cookie ที่ใช้เก็บ JWT
// httpOnly: JavaScript บนหน้าเว็บอ่านไม่ได้ -> กันการขโมย token ผ่าน XSS
const jwt = require('jsonwebtoken')

const COOKIE_NAME = 'token'

// อายุการ login
// - IDLE: ไม่ใช้งานเกินนี้ -> หมดอายุ (ใช้งานอยู่ระบบต่ออายุให้เอง)
// - MAX: นับจากตอน login ต่ออายุได้ไม่เกินนี้ (ครบแล้วต้อง login ใหม่)
// - RENEW_AFTER: ต่ออายุเมื่อ token ใช้มาแล้วเกินนี้ (ไม่ออก token ใหม่ทุก request)
const IDLE_SECONDS = 2 * 60 * 60 // 2 ชั่วโมง
const MAX_SECONDS = 24 * 60 * 60 // 1 วัน
const RENEW_AFTER_SECONDS = 5 * 60 // 5 นาที

const isProduction = process.env.NODE_ENV === 'production'

// หน้าเว็บกับ API อยู่คนละโดเมน (cross-site) -> ต้องใช้ SameSite=None + Secure (HTTPS)
// อยู่โดเมนเดียวกัน หรือ localhost -> ใช้ Lax ได้ (ค่าเริ่มต้น)
const sameSite = process.env.COOKIE_SAMESITE || 'lax'

const cookieOptions = {
    httpOnly: true,
    secure: sameSite === 'none' || isProduction,
    sameSite,
    path: '/',
}

const setAuthCookie = (res, token) => res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: IDLE_SECONDS * 1000 })
const clearAuthCookie = (res) => res.clearCookie(COOKIE_NAME, cookieOptions)

// ออก token ใหม่ (loginAt = เวลาที่ login ครั้งแรก ใช้นับอายุสูงสุด)
const signToken = ({ id, email, role }, loginAt = Math.floor(Date.now() / 1000)) =>
    jwt.sign({ id, email, role, loginAt }, process.env.SECRET, { expiresIn: IDLE_SECONDS })

module.exports = { COOKIE_NAME, IDLE_SECONDS, MAX_SECONDS, RENEW_AFTER_SECONDS, setAuthCookie, clearAuthCookie, signToken }
