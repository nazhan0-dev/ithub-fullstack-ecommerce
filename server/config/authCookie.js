// ตั้งค่า cookie ที่ใช้เก็บ JWT
// httpOnly: JavaScript บนหน้าเว็บอ่านไม่ได้ -> กันการขโมย token ผ่าน XSS
const COOKIE_NAME = 'token'
const MAX_AGE = 24 * 60 * 60 * 1000 // 1 วัน (เท่ากับอายุ JWT)

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

const setAuthCookie = (res, token) => res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: MAX_AGE })
const clearAuthCookie = (res) => res.clearCookie(COOKIE_NAME, cookieOptions)

module.exports = { COOKIE_NAME, setAuthCookie, clearAuthCookie }
