const jwt = require('jsonwebtoken')
const { one } = require('../config/db')
const {
    COOKIE_NAME,
    MAX_SECONDS,
    RENEW_AFTER_SECONDS,
    setAuthCookie,
    clearAuthCookie,
    signToken,
} = require('../config/authCookie')

// ตรวจ token และสถานะบัญชี
exports.authCheck = async (req, res, next) => {
    try {
        // อ่าน token จาก httpOnly cookie (รองรับ header "Authorization: Bearer" สำหรับเครื่องมือทดสอบ API ด้วย)
        const header = req.headers.authorization
        const cookieToken = req.cookies?.[COOKIE_NAME]
        const token = cookieToken || (header?.startsWith('Bearer ') ? header.slice(7) : null)
        if (!token) {
            return res.status(401).json({ message: 'No Token, Authorization' })
        }
        let decode
        try {
            decode = jwt.verify(token, process.env.SECRET)
        } catch {
            return res.status(401).json({ message: 'Token Invalid' })
        }
        req.user = decode

        // login มาเกินอายุสูงสุด -> ต้อง login ใหม่ (token รุ่นเก่าไม่มี loginAt ใช้ iat แทน)
        const now = Math.floor(Date.now() / 1000)
        const loginAt = decode.loginAt || decode.iat
        if (now - loginAt > MAX_SECONDS) {
            if (cookieToken) clearAuthCookie(res)
            return res.status(401).json({ message: 'Session expired' })
        }

        const user = await one('SELECT enabled FROM user WHERE email = ?', [decode.email])
        if (!user) {
            return res.status(401).json({ message: 'User not found' })
        }
        if (!user.enabled) {
            return res.status(403).json({ message: 'This account cannot access' })
        }

        // ยังใช้งานอยู่ -> ต่ออายุ cookie (นับ 2 ชั่วโมงใหม่)
        // ยกเว้น request เบื้องหลังที่หน้าเว็บเช็กเอง (X-Background) ไม่นับว่าผู้ใช้กำลังใช้งาน
        if (cookieToken && now - decode.iat > RENEW_AFTER_SECONDS && !req.get('X-Background')) {
            setAuthCookie(res, signToken(decode, loginAt))
        }
        next()
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Server Error' })
    }
}

// อนุญาตเฉพาะ admin (ต้องใช้ต่อจาก authCheck)
exports.adminCheck = async (req, res, next) => {
    try {
        const adminUser = await one('SELECT role FROM user WHERE email = ?', [req.user.email])
        if (!adminUser || adminUser.role !== 'admin') {
            return res.status(403).json({ message: 'Access Denied : Admin Only' })
        }
        next()
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Error Admin access denied' })
    }
}
