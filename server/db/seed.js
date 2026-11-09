// สร้าง (หรือรีเซ็ต) บัญชีผู้ดูแลระบบ
// ใช้งาน: npm run seed
// เปลี่ยนอีเมล/รหัสผ่านได้ด้วย ADMIN_EMAIL และ ADMIN_PASSWORD ใน .env
const bcrypt = require('bcryptjs')
const { pool, one, query } = require('../config/db')

const email = process.env.ADMIN_EMAIL || 'admin@ithub.com'
const password = process.env.ADMIN_PASSWORD || 'Admin@1234'

async function main() {
    const hash = await bcrypt.hash(password, 10)
    const existing = await one('SELECT id FROM user WHERE email = ?', [email])

    if (existing) {
        await query(
            "UPDATE user SET password = ?, role = 'admin', enabled = 1, updatedAt = UTC_TIMESTAMP(3) WHERE id = ?",
            [hash, existing.id]
        )
        console.log(`รีเซ็ตบัญชี admin แล้ว: ${email}`)
    } else {
        await query(
            "INSERT INTO user (email, password, role, enabled, createdAt, updatedAt) VALUES (?, ?, 'admin', 1, UTC_TIMESTAMP(3), UTC_TIMESTAMP(3))",
            [email, hash]
        )
        console.log(`สร้างบัญชี admin แล้ว: ${email}`)
    }
    console.log(`รหัสผ่าน: ${password}`)
}

main()
    .catch((err) => {
        console.error(err)
        process.exitCode = 1
    })
    .finally(() => pool.end())
