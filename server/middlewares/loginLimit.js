// จำกัดการเดารหัสผ่าน (เก็บในหน่วยความจำ: รีสตาร์ท server แล้วนับใหม่)
// - ต่ออีเมล: ผิดเกิน LOGIN_MAX_TRIES ครั้ง (ค่าเริ่มต้น 5) ใน 15 นาที -> ล็อกอีเมลนั้น
// - ต่อ IP: ผิดเกิน LOGIN_MAX_TRIES_IP ครั้ง (ค่าเริ่มต้น 30) ใน 15 นาที -> กันการไล่เดาหลายอีเมลจากเครื่องเดียว
// ถ้ารัน server หลาย instance ควรย้ายไปเก็บใน Redis แทน
const WINDOW_MS = 15 * 60 * 1000

function createLimiter(max, windowMs = WINDOW_MS) {
    const hits = new Map() // key -> { count, resetAt }

    const entry = (key, now) => {
        const e = hits.get(key)
        if (!e || e.resetAt <= now) return null
        return e
    }

    return {
        // เหลือเวลาล็อกกี่วินาที (0 = ยังไม่ถูกล็อก)
        retryAfter(key, now = Date.now()) {
            const e = entry(key, now)
            return e && e.count >= max ? Math.ceil((e.resetAt - now) / 1000) : 0
        },
        fail(key, now = Date.now()) {
            const e = entry(key, now)
            if (e) e.count += 1
            else hits.set(key, { count: 1, resetAt: now + windowMs })
        },
        clear(key) {
            hits.delete(key)
        },
        // ลบรายการที่หมดเวลาแล้ว กันหน่วยความจำโตเรื่อย ๆ
        sweep(now = Date.now()) {
            for (const [key, e] of hits) if (e.resetAt <= now) hits.delete(key)
        },
        size: () => hits.size,
    }
}

const byEmail = createLimiter(Number(process.env.LOGIN_MAX_TRIES) || 5)
const byIp = createLimiter(Number(process.env.LOGIN_MAX_TRIES_IP) || 30)
setInterval(() => {
    byEmail.sweep()
    byIp.sweep()
}, 60 * 1000).unref()

const emailKey = (email) => String(email).trim().toLowerCase()

module.exports = { createLimiter, byEmail, byIp, emailKey, WINDOW_MS }
