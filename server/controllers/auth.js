const bcrypt = require('bcryptjs')
const { query, one } = require('../config/db')
const { setAuthCookie, clearAuthCookie, signToken } = require('../config/authCookie')

exports.register = async (req, res) => {
    try {
        const { email, password } = req.body
        if (!email) {
            return res.status(400).json({ message: 'Email is required !!' })
        }
        if (!password) {
            return res.status(400).json({ message: 'Password is required !!' })
        }

        const user = await one('SELECT id FROM user WHERE email = ?', [email])
        if (user) {
            return res.status(400).json({ message: 'Email Already Exists !!' })
        }

        const hashPassword = await bcrypt.hash(password, 10)
        await query(
            'INSERT INTO user (email, password, createdAt, updatedAt) VALUES (?, ?, UTC_TIMESTAMP(3), UTC_TIMESTAMP(3))',
            [email, hashPassword]
        )

        res.send('Register Success')
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Server Error' })
    }
}

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body
        const user = await one('SELECT * FROM user WHERE email = ?', [email])
        if (!user || !user.enabled) {
            return res.status(400).json({ message: 'User not found or not Enabled' })
        }

        const isMatch = await bcrypt.compare(password || '', user.password || '')
        if (!isMatch) {
            return res.status(400).json({ message: 'Password Invalid !!' })
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
