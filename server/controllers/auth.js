const bcrypt = require('bcryptjs')
const { query, one } = require('../config/db')
const { setAuthCookie, clearAuthCookie, signToken } = require('../config/authCookie')
const { byEmail, byIp, emailKey } = require('../middlewares/loginLimit')

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MIN_PASSWORD = 8 // ตรงกับเงื่อนไขในหน้าสมัครสมาชิก
const MAX_PASSWORD = 72 // bcrypt ใช้แค่ 72 byte แรก

// ใช้เทียบเมื่อไม่พบอีเมล ให้เวลาตอบพอ ๆ กับกรณีรหัสผิด (กันการเดาว่าอีเมลไหนมีในระบบจากเวลา)
const DUMMY_HASH = bcrypt.hashSync('dummy-password-for-timing', 10)
const LOGIN_FAILED = 'อีเมลหรือรหัสผ่านไม่ถูกต้อง'

exports.register = async (req, res) => {
    try {
        const { email, password } = req.body || {}
        if (typeof email !== 'string' || !email.trim()) {
            return res.status(400).json({ message: 'Email is required !!' })
        }
        if (typeof password !== 'string' || !password) {
            return res.status(400).json({ message: 'Password is required !!' })
        }
        const cleanEmail = email.trim().toLowerCase()
        if (cleanEmail.length > 191 || !EMAIL_RE.test(cleanEmail)) {
            return res.status(400).json({ message: 'รูปแบบอีเมลไม่ถูกต้อง' })
        }
        if (password.length < MIN_PASSWORD || Buffer.byteLength(password) > MAX_PASSWORD) {
            return res.status(400).json({ message: `รหัสผ่านต้องยาว ${MIN_PASSWORD}–${MAX_PASSWORD} ตัวอักษร` })
        }

        const user = await one('SELECT id FROM user WHERE email = ?', [cleanEmail])
        if (user) {
            return res.status(400).json({ message: 'Email Already Exists !!' })
        }

        const hashPassword = await bcrypt.hash(password, 10)
        await query(
            'INSERT INTO user (email, password, createdAt, updatedAt) VALUES (?, ?, UTC_TIMESTAMP(3), UTC_TIMESTAMP(3))',
            [cleanEmail, hashPassword]
        )

        res.send('Register Success')
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'Email Already Exists !!' })
        }
        console.log(error)
        res.status(500).json({ message: 'Server Error' })
    }
}

const tooMany = (res, seconds) => {
    res.set('Retry-After', String(seconds))
    return res.status(429).json({
        message: `เข้าสู่ระบบผิดหลายครั้งเกินไป กรุณารอ ${Math.ceil(seconds / 60)} นาทีแล้วลองใหม่`,
    })
}

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body || {}
        // รับเฉพาะข้อความ: กันการส่ง object/array เข้า SQL
        if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
            return res.status(400).json({ message: 'กรุณากรอกอีเมลและรหัสผ่าน' })
        }

        const key = emailKey(email)
        const ip = req.ip
        const wait = Math.max(byEmail.retryAfter(key), byIp.retryAfter(ip))
        if (wait) return tooMany(res, wait)

        const user = await one('SELECT * FROM user WHERE email = ?', [key])
        const isMatch = await bcrypt.compare(password, user?.password || DUMMY_HASH)
        if (!user || !isMatch) {
            byEmail.fail(key)
            byIp.fail(ip)
            // ข้อความเดียวกันทั้งกรณีไม่มีอีเมลและรหัสผิด: ไม่บอกว่าอีเมลไหนมีในระบบ
            return res.status(400).json({ message: LOGIN_FAILED })
        }
        byEmail.clear(key)

        // แจ้งว่าถูกระงับเฉพาะคนที่รู้รหัสผ่านถูกต้องแล้ว
        if (!user.enabled) {
            return res.status(403).json({ message: 'บัญชีนี้ถูกระงับการใช้งาน กรุณาติดต่อร้าน' })
        }

        const payload = { id: user.id, email: user.email, role: user.role }
        // เก็บ token ใน httpOnly cookie (ไม่ส่ง token กลับใน body)
        setAuthCookie(res, signToken(payload))
        res.json({ payload })
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Server Error' })
    }
}

exports.currentUser = async (req, res) => {
    try {
        const user = await one('SELECT id, email, name, role FROM user WHERE email = ?', [req.user.email])
        res.json({ user })
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Server Error' })
    }
}

exports.logout = (req, res) => {
    clearAuthCookie(res)
    res.json({ message: 'Logout Success' })
}
