// unit test: ไม่ต้องใช้ฐานข้อมูลหรือเปิด server   รัน: npm run test:unit
const { test } = require('node:test')
const assert = require('node:assert/strict')

process.env.STRIPE_SECRET_KEY ||= 'sk_test_unit'
const { createLimiter, emailKey, WINDOW_MS } = require('../middlewares/loginLimit')
const { toSatang } = require('../config/stripe')

test('limiter: ยังไม่ถึงจำนวนครั้งที่กำหนด ไม่ถูกล็อก', () => {
    const l = createLimiter(3)
    l.fail('a', 0)
    l.fail('a', 1)
    assert.equal(l.retryAfter('a', 2), 0)
})

test('limiter: ผิดครบจำนวน ถูกล็อก และบอกเวลาที่ต้องรอเป็นวินาที', () => {
    const l = createLimiter(3)
    for (let i = 0; i < 3; i++) l.fail('a', 1000)
    assert.equal(l.retryAfter('a', 1000), WINDOW_MS / 1000)
    assert.equal(l.retryAfter('a', 1000 + 60_000), WINDOW_MS / 1000 - 60)
})

test('limiter: นับแยกตาม key', () => {
    const l = createLimiter(2)
    l.fail('a', 0)
    l.fail('a', 0)
    assert.ok(l.retryAfter('a', 0) > 0)
    assert.equal(l.retryAfter('b', 0), 0)
})

test('limiter: พ้นช่วงเวลาแล้วนับใหม่', () => {
    const l = createLimiter(2, 1000)
    l.fail('a', 0)
    l.fail('a', 0)
    assert.ok(l.retryAfter('a', 999) > 0)
    assert.equal(l.retryAfter('a', 1000), 0)
    l.fail('a', 1000) // เริ่มรอบใหม่ = 1 ครั้ง
    assert.equal(l.retryAfter('a', 1001), 0)
})

test('limiter: clear ล้างการนับ (เช่น ล็อกอินสำเร็จ)', () => {
    const l = createLimiter(2)
    l.fail('a', 0)
    l.clear('a')
    l.fail('a', 0)
    assert.equal(l.retryAfter('a', 0), 0)
})

test('limiter: sweep ลบรายการที่หมดเวลา กันหน่วยความจำโต', () => {
    const l = createLimiter(5, 1000)
    l.fail('old', 0)
    l.fail('new', 900)
    l.sweep(1500)
    assert.equal(l.size(), 1)
})

test('emailKey: ตัดช่องว่างและเป็นตัวพิมพ์เล็ก', () => {
    assert.equal(emailKey('  Admin@ITHub.com '), 'admin@ithub.com')
})

test('toSatang: แปลงบาทเป็นสตางค์ ไม่มีเศษทศนิยมลอย', () => {
    assert.equal(toSatang(100), 10000)
    assert.equal(toSatang(19.99), 1999)
    assert.equal(toSatang(0.1 + 0.2), 30)
    assert.equal(toSatang('250.5'), 25050)
})
