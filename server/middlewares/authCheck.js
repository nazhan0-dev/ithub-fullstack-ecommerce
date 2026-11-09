const jwt = require('jsonwebtoken')
const { one } = require('../config/db')
const { COOKIE_NAME } = require('../config/authCookie')

// ตรวจ token และสถานะบัญชี
exports.authCheck = async (req, res, next) => {
    try {
        // อ่าน token จาก httpOnly cookie (รองรับ header "Authorization: Bearer" สำหรับเครื่องมือทดสอบ API ด้วย)
        const header = req.headers.authorization
        const token = req.cookies?.[COOKIE_NAME] || (header?.startsWith('Bearer ') ? header.slice(7) : null)
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

        const user = await one('SELECT enabled FROM user WHERE email = ?', [decode.email])
        if (!user) {
            return res.status(401).json({ message: 'User not found' })
        }
        if (!user.enabled) {
            return res.status(403).json({ message: 'This account cannot access' })
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
