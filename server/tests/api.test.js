// API test: เปิด server จริง + ฐานข้อมูล MySQL จริง + Stripe จำลอง (ไม่ต่ออินเทอร์เน็ต ไม่ใช้เงินจริง)
// รัน:  TEST_DATABASE_URL="mysql://root:password@localhost:3306/ecom_test" npm run test:api
// ⚠️ ฐานข้อมูลใน TEST_DATABASE_URL จะถูกลบและสร้างใหม่ทุกครั้ง (ชื่อต้องลงท้าย _test)
const { describe, test, before, after } = require('node:test')
const assert = require('node:assert/strict')
const net = require('node:net')
const Stripe = require('stripe')
const { startFakeStripe, resetDatabase, dbQuery, createAdmin, startServer, makeClient } = require('./helpers')

const DB = process.env.TEST_DATABASE_URL
const ORIGIN = 'http://localhost:5173'
const WEBHOOK_SECRET = 'whsec_test_secret'
const ADMIN = { email: 'admin@ithub.test', password: 'Admin@1234' }
const PASSWORD = 'Passw0rd!'

const freePort = () =>
    new Promise((resolve) => {
        const s = net.createServer().listen(0, '127.0.0.1', () => {
            const { port } = s.address()
            s.close(() => resolve(port))
        })
    })

const signer = Stripe('sk_test_signer')

describe('IT Hub API', { skip: !DB && 'ตั้ง TEST_DATABASE_URL ก่อน (ดู README หัวข้อ "การทดสอบ")' }, () => {
    let fake, server, base, admin
    let ipSeq = 0
    // ทุก client ได้ IP ของตัวเอง (ผ่าน X-Forwarded-For + TRUST_PROXY) การนับล็อกอินผิดต่อ IP จะไม่ปนกัน
    const client = (opts = {}) => makeClient(base, { origin: ORIGIN, ip: `10.0.${Math.floor(++ipSeq / 250)}.${ipSeq % 250}`, ...opts })
    const P = {} // สินค้าที่ใช้ทดสอบ

    const serverEnv = (port, extra = {}) => ({
        PORT: String(port),
        DATABASE_URL: DB,
        SECRET: 'test-secret-for-jwt-signing-only',
        CLIENT_URL: ORIGIN,
        STRIPE_SECRET_KEY: 'sk_test_fake',
        STRIPE_API_BASE: fake.url,
        STRIPE_WEBHOOK_SECRET: WEBHOOK_SECRET,
        TRUST_PROXY: 'true',
        LOGIN_MAX_TRIES: '5',
        LOGIN_MAX_TRIES_IP: '10',
        ...extra,
    })

    // สมัคร + ล็อกอิน ผู้ใช้ใหม่
    let userSeq = 0
    async function newUser() {
        const c = client()
        const email = `user${++userSeq}@ithub.test`
        assert.equal((await c.post('/api/register', { email, password: PASSWORD })).status, 200)
        await c.login(email, PASSWORD)
        c.email = email
        c.id = (await dbQuery(DB, 'SELECT id FROM user WHERE email = ?', [email]))[0].id
        return c
    }

    // ใส่ตะกร้า -> สร้างการชำระเงิน -> คืน id ของ payment intent
    async function checkout(c, items) {
        const cart = await c.post('/api/user/cart', { cart: items.map(([p, count]) => ({ id: p.id, count, price: 1 })) })
        assert.equal(cart.status, 200, JSON.stringify(cart.data))
        const r = await c.post('/api/user/create-payment-intent', {})
        assert.equal(r.status, 200, JSON.stringify(r.data))
        return r.data.clientSecret.split('_secret')[0]
    }

    const saveOrder = (c, id) => c.post('/api/user/order', { paymentIntent: { id } })

    async function sendWebhook(event, { secret = WEBHOOK_SECRET, signature, url = base } = {}) {
        const payload = JSON.stringify(event)
        const header = signature ?? signer.webhooks.generateTestHeaderString({ payload, secret })
        const res = await fetch(url + '/api/stripe/webhook', {
            method: 'POST',
            headers: { 'content-type': 'application/json', ...(header ? { 'stripe-signature': header } : {}) },
            body: payload,
        })
        return { status: res.status, data: await res.json().catch(() => null) }
    }
    const succeededEvent = (pi) => ({
        id: `evt_${pi.id}_${Math.random().toString(36).slice(2)}`,
        object: 'event',
        type: 'payment_intent.succeeded',
        data: { object: { ...pi } },
    })

    const ordersFor = (piId) => dbQuery(DB, 'SELECT * FROM `order` WHERE stripePayment = ?', [piId])
    const stock = async (p) => (await dbQuery(DB, 'SELECT quantity, sold FROM product WHERE id = ?', [p.id]))[0]

    before(async () => {
        fake = await startFakeStripe()
        await resetDatabase(DB)
        await createAdmin(DB, ADMIN.email, ADMIN.password)
        const port = await freePort()
        server = await startServer(serverEnv(port))
        base = `http://127.0.0.1:${port}`
        admin = client()
        await admin.login(ADMIN.email, ADMIN.password)

        const cat = await admin.post('/api/category', { name: 'Test' })
        const mk = async (title, price, quantity) => {
            const r = await admin.post('/api/product', { title, description: 'd', price, quantity, categoryId: cat.data.id })
            assert.equal(r.status, 200, JSON.stringify(r.data))
            return r.data
        }
        P.laptop = await mk('Laptop', 100, 50)
        P.mouse = await mk('Mouse', 50, 1)
        P.cable = await mk('Cable', 20, 3)
    })

    after(async () => {
        await server?.stop()
        await fake?.close()
    })

    // ---------------------------------------------------------------------------
    describe('ความปลอดภัยพื้นฐาน', () => {
        test('API สาธารณะเปิดได้โดยไม่ login', async () => {
            const r = await client().get('/api/category')
            assert.equal(r.status, 200)
            assert.ok(Array.isArray(r.data))
        })

        test('CSRF: request แก้ไขข้อมูลจากเว็บอื่นถูกปฏิเสธ 403', async () => {
            const r = await client({ origin: 'https://evil.example' }).post('/api/register', { email: 'x@evil.test', password: PASSWORD })
            assert.equal(r.status, 403)
            assert.equal((await dbQuery(DB, 'SELECT id FROM user WHERE email = ?', ['x@evil.test'])).length, 0)
        })

        test('CORS: ตอบ header เฉพาะหน้าเว็บที่อนุญาต', async () => {
            const ok = await client().get('/api/category')
            assert.equal(ok.headers.get('access-control-allow-origin'), ORIGIN)
            const bad = await client({ origin: 'https://evil.example' }).get('/api/category')
            assert.equal(bad.headers.get('access-control-allow-origin'), null)
        })

        test('JSON ผิดรูปแบบ -> 400 พร้อมข้อความ JSON (ไม่ใช่หน้า HTML)', async () => {
            const r = await client().call('POST', '/api/login', { raw: '{"email":' })
            assert.equal(r.status, 400)
            assert.match(r.data.message, /JSON/)
        })

        test('body เกิน 1mb -> 413 พร้อมข้อความ JSON', async () => {
            const r = await client().post('/api/register', { email: 'big@ithub.test', password: 'x'.repeat(1.2 * 1024 * 1024) })
            assert.equal(r.status, 413)
            assert.match(r.data.message, /ใหญ่เกินไป/)
        })

        test('อัปโหลดรูป: รับ body 2mb ได้ (ผ่านไปถึงการตรวจสิทธิ์), เกิน 8mb ได้ 413', async () => {
            const c = await newUser()
            const ok = await c.post('/api/images', { image: 'x'.repeat(2 * 1024 * 1024) })
            assert.equal(ok.status, 403, 'body 2mb ต้องอ่านได้ แล้วติดที่ admin only')
            const big = await c.post('/api/images', { image: 'x'.repeat(9 * 1024 * 1024) })
            assert.equal(big.status, 413)
        })

        test('ยังไม่ login -> 401, ผู้ใช้ทั่วไปเรียก API ของ admin -> 403', async () => {
            assert.equal((await client().get('/api/admin/orders')).status, 401)
            const c = await newUser()
            for (const [m, p] of [['GET', '/api/admin/orders'], ['GET', '/api/users'], ['POST', '/api/product'], ['POST', '/api/admin/coupons']]) {
                assert.equal((await c.call(m, p, m === 'GET' ? {} : { body: {} })).status, 403, `${m} ${p}`)
            }
        })
    })

    // ---------------------------------------------------------------------------
    describe('สมัครสมาชิก', () => {
        const reg = (body) => client().post('/api/register', body)

        test('ข้อมูลไม่ครบหรือผิดชนิด -> 400', async () => {
            assert.equal((await reg({ password: PASSWORD })).status, 400)
            assert.equal((await reg({ email: 'a@ithub.test' })).status, 400)
            assert.equal((await reg({ email: { $gt: '' }, password: PASSWORD })).status, 400)
            assert.equal((await reg({ email: ['a@ithub.test'], password: PASSWORD })).status, 400)
            assert.equal((await reg({ email: 'a@ithub.test', password: 12345678 })).status, 400)
        })

        test('อีเมลผิดรูปแบบ -> 400', async () => {
            for (const email of ['abc', 'a@b', 'a b@c.com', '@c.com']) {
                assert.equal((await reg({ email, password: PASSWORD })).status, 400, email)
            }
        })

        test('รหัสผ่านสั้นกว่า 8 หรือยาวเกิน 72 byte -> 400', async () => {
            assert.equal((await reg({ email: 'short@ithub.test', password: '1234567' })).status, 400)
            assert.equal((await reg({ email: 'long@ithub.test', password: 'ก'.repeat(25) })).status, 400) // 75 byte
        })

        test('สมัครสำเร็จ เก็บอีเมลเป็นตัวพิมพ์เล็ก และรหัสผ่านถูก hash', async () => {
            assert.equal((await reg({ email: '  Mixed@Case.Test ', password: PASSWORD })).status, 200)
            const [row] = await dbQuery(DB, "SELECT email, password FROM user WHERE email = 'mixed@case.test'")
            assert.equal(row.email, 'mixed@case.test')
            assert.notEqual(row.password, PASSWORD)
            assert.match(row.password, /^\$2[aby]\$10\$/)
        })

        test('อีเมลซ้ำ (ต่างตัวพิมพ์) -> 400', async () => {
            assert.equal((await reg({ email: 'MIXED@case.test', password: PASSWORD })).status, 400)
        })
    })

    // ---------------------------------------------------------------------------
    describe('เข้าสู่ระบบ', () => {
        test('สำเร็จ: ได้ httpOnly cookie และไม่มี token ใน body', async () => {
            const c = client()
            const r = await c.login('Mixed@CASE.test', PASSWORD) // ตัวพิมพ์ต่างก็เข้าได้
            assert.equal(r.data.payload.email, 'mixed@case.test')
            assert.ok(!JSON.stringify(r.data).includes(c.cookie.slice(6)))
            const cookie = r.setCookie.find((s) => s.startsWith('token='))
            assert.match(cookie, /HttpOnly/i)
            assert.match(cookie, /SameSite=Lax/i)
            assert.equal((await c.post('/api/current-user', {})).status, 200)
        })

        test('รหัสผิด กับ อีเมลที่ไม่มีในระบบ ได้คำตอบเหมือนกัน (ไม่บอกว่าอีเมลไหนมีอยู่)', async () => {
            const wrong = await client().post('/api/login', { email: 'mixed@case.test', password: 'wrong-pass' })
            const none = await client().post('/api/login', { email: 'nobody@ithub.test', password: 'wrong-pass' })
            assert.equal(wrong.status, 400)
            assert.deepEqual(wrong.data, none.data)
            assert.equal(wrong.status, none.status)
        })

        test('ส่ง object/array แทนข้อความ -> 400 (กันการแทรก SQL)', async () => {
            for (const body of [{ email: { email: 1 }, password: 'x' }, { email: 'a@b.c', password: ['x'] }, {}]) {
                assert.equal((await client().post('/api/login', body)).status, 400)
            }
        })

        test('ใช้ Bearer token แทน cookie ได้ และ token ปลอม/เสีย -> 401', async () => {
            const c = client()
            await c.login(ADMIN.email, ADMIN.password)
            const token = c.cookie.slice('token='.length)
            const bearer = client()
            assert.equal((await bearer.post('/api/current-admin', {}, { headers: { authorization: `Bearer ${token}` } })).status, 200)
            assert.equal((await bearer.post('/api/current-user', {}, { headers: { authorization: 'Bearer abc.def.ghi' } })).status, 401)
        })

        test('logout ลบ cookie แล้วเรียก API ที่ต้อง login ไม่ได้', async () => {
            const c = await newUser()
            await c.post('/api/logout', {})
            assert.equal(c.cookie, null)
            assert.equal((await c.post('/api/current-user', {})).status, 401)
        })

        test('บัญชีถูกระงับ: รหัสถูก -> 403, รหัสผิด -> 400 ข้อความเดิม, cookie เดิมใช้ไม่ได้ -> 403', async () => {
            const c = await newUser()
            assert.equal((await admin.post('/api/change-status', { id: c.id, enabled: false })).status, 200)
            assert.equal((await c.post('/api/current-user', {})).status, 403)
            const ok = await client().post('/api/login', { email: c.email, password: PASSWORD })
            assert.equal(ok.status, 403)
            assert.match(ok.data.message, /ระงับ/)
            const bad = await client().post('/api/login', { email: c.email, password: 'wrong-pass' })
            assert.equal(bad.status, 400)
            assert.doesNotMatch(bad.data.message, /ระงับ/)
            await admin.post('/api/change-status', { id: c.id, enabled: true })
            assert.equal((await client().post('/api/login', { email: c.email, password: PASSWORD })).status, 200)
        })
    })

    // ---------------------------------------------------------------------------
    describe('จำกัดการเดารหัสผ่าน', () => {
        test('ผิด 5 ครั้งต่ออีเมล -> ครั้งที่ 6 ได้ 429 แม้รหัสถูก พร้อม Retry-After', async () => {
            const u = await newUser()
            const c = client()
            for (let i = 0; i < 5; i++) {
                assert.equal((await c.post('/api/login', { email: u.email, password: 'wrong-pass' })).status, 400, `ครั้งที่ ${i + 1}`)
            }
            const r = await c.post('/api/login', { email: u.email, password: PASSWORD })
            assert.equal(r.status, 429)
            assert.match(r.data.message, /นาที/)
            const retry = Number(r.headers.get('retry-after'))
            assert.ok(retry > 0 && retry <= 15 * 60, `Retry-After = ${retry}`)
            // นับตามอีเมลที่ normalize แล้ว: เปลี่ยนตัวพิมพ์ก็ยังถูกล็อก
            assert.equal((await client().post('/api/login', { email: u.email.toUpperCase(), password: PASSWORD })).status, 429)
        })

        test('อีเมลที่ถูกล็อกไม่กระทบคนอื่นจากเครื่องเดียวกัน', async () => {
            const victim = await newUser()
            const other = await newUser()
            const c = client()
            for (let i = 0; i < 5; i++) await c.post('/api/login', { email: victim.email, password: 'wrong-pass' })
            assert.equal((await c.post('/api/login', { email: other.email, password: PASSWORD })).status, 200)
        })

        test('ล็อกอินสำเร็จแล้วนับใหม่', async () => {
            const u = await newUser()
            const c = client()
            for (let round = 0; round < 2; round++) {
                for (let i = 0; i < 4; i++) await c.post('/api/login', { email: u.email, password: 'wrong-pass' })
                assert.equal((await c.post('/api/login', { email: u.email, password: PASSWORD })).status, 200, `รอบ ${round + 1}`)
            }
        })

        test('ไล่เดาหลายอีเมลจาก IP เดียว: ครบ 10 ครั้ง -> IP นั้นถูกล็อก แต่ IP อื่นเข้าได้', async () => {
            const u = await newUser()
            const attacker = client()
            for (let i = 0; i < 10; i++) {
                assert.equal((await attacker.post('/api/login', { email: `guess${i}@ithub.test`, password: 'x' })).status, 400)
            }
            assert.equal((await attacker.post('/api/login', { email: u.email, password: PASSWORD })).status, 429)
            assert.equal((await client().post('/api/login', { email: u.email, password: PASSWORD })).status, 200)
        })
    })

    // ---------------------------------------------------------------------------
    describe('ตะกร้าและการสร้างการชำระเงิน', () => {
        test('รายการไม่ถูกต้อง / เกินสต็อก -> 400', async () => {
            const c = await newUser()
            assert.equal((await c.post('/api/user/cart', { cart: [] })).status, 400)
            assert.equal((await c.post('/api/user/cart', { cart: [{ id: P.laptop.id, count: 0 }] })).status, 400)
            assert.equal((await c.post('/api/user/cart', { cart: [{ id: P.laptop.id, count: 1.5 }] })).status, 400)
            assert.equal((await c.post('/api/user/cart', { cart: [{ id: P.mouse.id, count: 2 }] })).status, 400)
            assert.equal((await c.post('/api/user/cart', { cart: [{ id: 999999, count: 1 }] })).status, 400)
        })

        test('ใช้ราคาจากฐานข้อมูล ไม่เชื่อราคาที่หน้าเว็บส่งมา', async () => {
            const c = await newUser()
            const pi = await checkout(c, [[P.laptop, 2], [P.cable, 1]]) // ส่งราคา 1 บาททุกชิ้น
            assert.equal(fake.intents.get(pi).amount, (100 * 2 + 20) * 100)
            assert.equal(fake.intents.get(pi).currency, 'thb')
            assert.equal(fake.intents.get(pi).metadata.userId, String(c.id))
        })

        test('ไม่มีตะกร้า -> สร้างการชำระเงินไม่ได้', async () => {
            const c = await newUser()
            assert.equal((await c.post('/api/user/create-payment-intent', {})).status, 400)
        })
    })

    // ---------------------------------------------------------------------------
    describe('บันทึกคำสั่งซื้อจากหน้าเว็บ (POST /api/user/order)', () => {
        let buyer, paidPi, order

        test('ไม่ส่ง id / id ผิดรูปแบบ / ไม่มีใน Stripe -> 400', async () => {
            const c = await newUser()
            assert.equal((await c.post('/api/user/order', {})).status, 400)
            assert.equal((await saveOrder(c, 'abc')).status, 400)
            assert.equal((await saveOrder(c, "pi_1' OR '1'='1")).status, 400)
            const r = await saveOrder(c, 'pi_doesnotexist')
            assert.equal(r.status, 400)
            assert.match(r.data.message, /not found/)
        })

        test('ยังไม่จ่ายเงิน -> 400 ไม่สร้างคำสั่งซื้อ', async () => {
            const c = await newUser()
            const pi = await checkout(c, [[P.laptop, 1]])
            assert.equal((await saveOrder(c, pi)).status, 400)
            assert.equal((await ordersFor(pi)).length, 0)
        })

        test('จ่ายสำเร็จ: สร้างคำสั่งซื้อ ตัดสต็อก ล้างตะกร้า', async () => {
            buyer = await newUser()
            const before = await stock(P.laptop)
            paidPi = await checkout(buyer, [[P.laptop, 2]])
            fake.succeed(paidPi)
            const r = await saveOrder(buyer, paidPi)
            assert.equal(r.status, 200, JSON.stringify(r.data))
            order = r.data.order
            assert.equal(order.cartTotal, 200)
            assert.equal(order.amount, 20000)
            assert.equal(order.orderStatus, 'Not Process')
            const after = await stock(P.laptop)
            assert.equal(after.quantity, before.quantity - 2)
            assert.equal(after.sold, before.sold + 2)
            assert.equal((await dbQuery(DB, 'SELECT id FROM cart WHERE orderedById = ?', [buyer.id])).length, 0)
            const items = await dbQuery(DB, 'SELECT productId, count, price FROM productonorder WHERE orderId = ?', [order.id])
            assert.deepEqual(items.map((i) => ({ ...i })), [{ productId: P.laptop.id, count: 2, price: 100 }])
            const list = await buyer.get('/api/user/order')
            assert.equal(list.data.orders.length, 1)
        })

        test('กดซ้ำด้วยการชำระเดิม -> ได้คำสั่งซื้อเดิม ไม่สร้างซ้ำ ไม่ตัดสต็อกซ้ำ', async () => {
            const before = await stock(P.laptop)
            const r = await saveOrder(buyer, paidPi)
            assert.equal(r.status, 200)
            assert.equal(r.data.order.id, order.id)
            assert.equal(r.data.alreadyCreated, true)
            assert.equal((await ordersFor(paidPi)).length, 1)
            assert.deepEqual(await stock(P.laptop), before)
        })

        test('ผู้ใช้อื่นนำการชำระเงินนี้ไปใช้ -> 400', async () => {
            const thief = await newUser()
            await checkout(thief, [[P.laptop, 1]])
            assert.equal((await saveOrder(thief, paidPi)).status, 400)
        })

        test('การชำระเงินของผู้ใช้อื่น (ยังไม่มีคำสั่งซื้อ) -> 400', async () => {
            const owner = await newUser()
            const thief = await newUser()
            const pi = await checkout(owner, [[P.laptop, 1]])
            fake.succeed(pi)
            await checkout(thief, [[P.laptop, 1]])
            assert.equal((await saveOrder(thief, pi)).status, 400)
            assert.equal((await ordersFor(pi)).length, 0)
            assert.equal(fake.refundsFor(pi).length, 0, 'ต้องไม่คืนเงินของเจ้าของจริง')
        })

        test('ตะกร้าเปลี่ยนหลังจ่าย (ยอดไม่ตรง) -> คืนเงิน 409', async () => {
            const c = await newUser()
            const pi = await checkout(c, [[P.laptop, 1]])
            fake.succeed(pi)
            await c.post('/api/user/cart', { cart: [{ id: P.laptop.id, count: 2 }] })
            const r = await saveOrder(c, pi)
            assert.equal(r.status, 409)
            assert.match(r.data.message, /คืนเงิน/)
            assert.equal(fake.refundsFor(pi).length, 1)
            assert.equal((await ordersFor(pi)).length, 0)
        })

        test('ช่องโหว่ "ของฟรี": การชำระที่คืนเงินแล้วนำกลับมาใช้ไม่ได้ แม้แก้ตะกร้าให้ยอดตรง', async () => {
            const c = await newUser()
            const pi = await checkout(c, [[P.laptop, 1]])
            fake.succeed(pi)
            await c.post('/api/user/cart', { cart: [{ id: P.laptop.id, count: 2 }] })
            assert.equal((await saveOrder(c, pi)).status, 409) // ยอดไม่ตรง -> คืนเงิน
            await c.post('/api/user/cart', { cart: [{ id: P.laptop.id, count: 1 }] }) // แก้ให้ยอดตรงกับที่เคยจ่าย
            const r = await saveOrder(c, pi)
            assert.equal(r.status, 409)
            assert.match(r.data.message, /ถูกคืนเงินแล้ว/)
            assert.equal((await sendWebhook(succeededEvent(fake.intents.get(pi)))).status, 200)
            assert.equal((await ordersFor(pi)).length, 0, 'ต้องไม่มีคำสั่งซื้อจากเงินที่คืนไปแล้ว')
            assert.equal(fake.refundsFor(pi).length, 1, 'คืนเงินครั้งเดียว')
        })

        test('ของหมดระหว่างจ่าย: คนแรกได้ของ คนที่สองได้เงินคืน สต็อกไม่ติดลบ', async () => {
            const a = await newUser()
            const b = await newUser()
            const piA = await checkout(a, [[P.mouse, 1]])
            const piB = await checkout(b, [[P.mouse, 1]])
            fake.succeed(piA)
            fake.succeed(piB)
            assert.equal((await saveOrder(a, piA)).status, 200)
            const r = await saveOrder(b, piB)
            assert.equal(r.status, 409)
            assert.match(r.data.message, /หมด/)
            assert.equal(fake.refundsFor(piB).length, 1)
            assert.equal((await stock(P.mouse)).quantity, 0)
            assert.equal((await ordersFor(piB)).length, 0)
        })

        test('จ่ายซ้ำจากสองแท็บ: รายการแรกได้คำสั่งซื้อ รายการที่สองได้เงินคืน', async () => {
            const c = await newUser()
            await c.post('/api/user/cart', { cart: [{ id: P.cable.id, count: 1 }] })
            const pi1 = (await c.post('/api/user/create-payment-intent', {})).data.clientSecret.split('_secret')[0]
            const pi2 = (await c.post('/api/user/create-payment-intent', {})).data.clientSecret.split('_secret')[0]
            fake.succeed(pi1)
            fake.succeed(pi2)
            assert.equal((await saveOrder(c, pi1)).status, 200)
            const r = await saveOrder(c, pi2)
            assert.equal(r.status, 409)
            assert.match(r.data.message, /ไม่พบสินค้าในตะกร้า/)
            assert.equal(fake.refundsFor(pi2).length, 1)
            assert.equal(fake.refundsFor(pi1).length, 0)
        })

        test('ใช้คูปอง: จ่ายยอดหลังหักส่วนลด และบันทึกส่วนลดในคำสั่งซื้อ', async () => {
            const cr = await admin.post('/api/admin/coupons', { code: 'SAVE10', type: 'percent', value: 10 })
            assert.equal(cr.status, 200, JSON.stringify(cr.data))
            const c = await newUser()
            await c.post('/api/user/cart', { cart: [{ id: P.laptop.id, count: 2 }] })
            const ap = await c.post('/api/user/cart/coupon', { code: 'save10' })
            assert.equal(ap.status, 200, JSON.stringify(ap.data))
            assert.equal(ap.data.total, 180)
            const pay = await c.post('/api/user/create-payment-intent', {})
            const pi = pay.data.clientSecret.split('_secret')[0]
            assert.equal(fake.intents.get(pi).amount, 18000)
            fake.succeed(pi)
            const r = await saveOrder(c, pi)
            assert.equal(r.status, 200, JSON.stringify(r.data))
            assert.equal(r.data.order.discount, 20)
            assert.equal(r.data.order.couponCode, 'SAVE10')
            assert.equal(r.data.order.cartTotal, 180)
        })

        test('ยกเลิกคำสั่งซื้อ: คืนเงิน คืนสต็อก ยกเลิกซ้ำไม่ได้ คนอื่นยกเลิกแทนไม่ได้', async () => {
            const stranger = await newUser()
            assert.equal((await stranger.post(`/api/user/order/${order.id}/cancel`, {})).status, 404)
            const before = await stock(P.laptop)
            const r = await buyer.post(`/api/user/order/${order.id}/cancel`, {})
            assert.equal(r.status, 200, JSON.stringify(r.data))
            assert.equal(r.data.order.orderStatus, 'Cancelled')
            assert.equal((await stock(P.laptop)).quantity, before.quantity + 2)
            assert.equal(fake.refundsFor(paidPi).length, 1)
            assert.equal((await buyer.post(`/api/user/order/${order.id}/cancel`, {})).status, 400)
            assert.equal(fake.refundsFor(paidPi).length, 1)
        })
    })

    // ---------------------------------------------------------------------------
    describe('Stripe webhook (POST /api/stripe/webhook)', () => {
        test('ไม่มีลายเซ็น / ลายเซ็นผิด / ใช้ secret อื่น -> 400', async () => {
            const event = { id: 'evt_1', object: 'event', type: 'payment_intent.succeeded', data: { object: { id: 'pi_x' } } }
            assert.equal((await sendWebhook(event, { signature: '' })).status, 400)
            assert.equal((await sendWebhook(event, { signature: 't=1,v1=deadbeef' })).status, 400)
            assert.equal((await sendWebhook(event, { secret: 'whsec_other' })).status, 400)
        })

        test('event ที่ไม่ได้ใช้ ตอบ 200 (Stripe จะได้ไม่ส่งซ้ำ)', async () => {
            const r = await sendWebhook({ id: 'evt_2', object: 'event', type: 'charge.refunded', data: { object: {} } })
            assert.equal(r.status, 200)
            assert.deepEqual(r.data, { received: true })
        })

        test('ลูกค้าปิดแท็บหลังจ่าย: webhook สร้างคำสั่งซื้อให้ แล้วหน้าเว็บมาทีหลังได้คำสั่งซื้อเดิม', async () => {
            const c = await newUser()
            const before = await stock(P.laptop)
            const pi = await checkout(c, [[P.laptop, 3]])
            fake.succeed(pi)
            // หน้าเว็บไม่ได้เรียก /user/order เลย
            assert.equal((await sendWebhook(succeededEvent(fake.intents.get(pi)))).status, 200)
            const [row] = await ordersFor(pi)
            assert.ok(row, 'ต้องมีคำสั่งซื้อจาก webhook')
            assert.equal(row.orderedById, c.id)
            assert.equal(row.cartTotal, 300)
            assert.equal((await stock(P.laptop)).quantity, before.quantity - 3)
            const late = await saveOrder(c, pi)
            assert.equal(late.status, 200)
            assert.equal(late.data.order.id, row.id)
            assert.equal(late.data.alreadyCreated, true)
        })

        test('Stripe ส่ง event เดิมซ้ำ -> คำสั่งซื้อเดียว', async () => {
            const c = await newUser()
            const pi = await checkout(c, [[P.cable, 1]])
            fake.succeed(pi)
            const event = succeededEvent(fake.intents.get(pi))
            for (let i = 0; i < 3; i++) assert.equal((await sendWebhook(event)).status, 200)
            assert.equal((await ordersFor(pi)).length, 1)
        })

        test('ไม่เชื่อข้อมูลใน event: event บอกว่าจ่ายแล้ว แต่ Stripe จริงยังไม่จ่าย -> ไม่สร้าง', async () => {
            const c = await newUser()
            const pi = await checkout(c, [[P.laptop, 1]])
            const forged = succeededEvent({ ...fake.intents.get(pi), status: 'succeeded' })
            assert.equal((await sendWebhook(forged)).status, 200)
            assert.equal((await ordersFor(pi)).length, 0)
        })

        test('การชำระที่ไม่ใช่ของร้าน (ไม่มี userId) -> ตอบ 200 แต่ไม่ทำอะไร', async () => {
            const pi = fake.create({ amount: 5000 })
            fake.succeed(pi.id)
            assert.equal((await sendWebhook(succeededEvent(pi))).status, 200)
            assert.equal((await ordersFor(pi.id)).length, 0)
            assert.equal(fake.refundsFor(pi.id).length, 0)
        })

        test('webhook กับหน้าเว็บมาพร้อมกัน 6 request -> คำสั่งซื้อเดียว ไม่คืนเงินผิด ตัดสต็อกครั้งเดียว', async () => {
            const c = await newUser()
            const before = await stock(P.laptop)
            const pi = await checkout(c, [[P.laptop, 1]])
            fake.succeed(pi)
            const event = succeededEvent(fake.intents.get(pi))
            const results = await Promise.all([
                sendWebhook(event),
                saveOrder(c, pi),
                sendWebhook(event),
                saveOrder(c, pi),
                saveOrder(c, pi),
                sendWebhook(event),
            ])
            assert.deepEqual(results.map((r) => r.status), [200, 200, 200, 200, 200, 200])
            const orderIds = new Set(results.filter((r) => r.data?.order).map((r) => r.data.order.id))
            assert.equal(orderIds.size, 1)
            assert.equal((await ordersFor(pi)).length, 1)
            assert.equal(fake.refundsFor(pi).length, 0)
            assert.equal((await stock(P.laptop)).quantity, before.quantity - 1)
        })

        test('ไม่ได้ตั้ง STRIPE_WEBHOOK_SECRET -> 503 (ไม่รับ event ที่ตรวจลายเซ็นไม่ได้)', async () => {
            const port = await freePort()
            const s = await startServer(serverEnv(port, { STRIPE_WEBHOOK_SECRET: '' }))
            try {
                const r = await sendWebhook({ id: 'e', type: 'payment_intent.succeeded', data: { object: { id: 'pi_x' } } }, { url: `http://127.0.0.1:${port}` })
                assert.equal(r.status, 503)
            } finally {
                await s.stop()
            }
        })
    })
})
