// ตัวช่วยของ API test: Stripe จำลอง, สร้างฐานข้อมูลทดสอบ, เปิด server, client ที่จำ cookie
const http = require('node:http')
const path = require('node:path')
const fs = require('node:fs')
const { spawn } = require('node:child_process')
const mysql = require('mysql2/promise')
const bcrypt = require('bcryptjs')

const SERVER_DIR = path.join(__dirname, '..')

// ---------- Stripe จำลอง (เฉพาะ endpoint ที่ร้านใช้) ----------
// เก็บ payment intent / charge / refund ไว้ในหน่วยความจำ ให้เทสต์สั่ง "จ่ายสำเร็จ" และตรวจการคืนเงินได้
function startFakeStripe() {
    const intents = new Map()
    const charges = new Map()
    const refunds = [] // { id, payment_intent, idempotencyKey }
    const idempotent = new Map() // key -> response body
    let seq = 0
    const nextId = (prefix) => `${prefix}_test${Date.now().toString(36)}${(++seq).toString(36)}`

    const readBody = (req) =>
        new Promise((resolve) => {
            let data = ''
            req.on('data', (c) => (data += c))
            req.on('end', () => resolve(new URLSearchParams(data)))
        })

    const send = (res, status, body) => {
        res.writeHead(status, { 'content-type': 'application/json', 'request-id': 'req_fake' })
        res.end(JSON.stringify(body))
    }
    const notFound = (res, id) =>
        send(res, 404, { error: { type: 'invalid_request_error', code: 'resource_missing', message: `No such object: '${id}'` } })

    const view = (pi, expand) => {
        const out = { ...pi, metadata: { ...pi.metadata } }
        if (expand.includes('latest_charge') && pi.latest_charge) out.latest_charge = { ...charges.get(pi.latest_charge) }
        return out
    }

    const server = http.createServer(async (req, res) => {
        const url = new URL(req.url, 'http://x')
        const parts = url.pathname.split('/').filter(Boolean) // ['v1', 'payment_intents', id]
        const params = req.method === 'POST' ? await readBody(req) : url.searchParams
        const expand = [...params.entries()].filter(([k]) => k.startsWith('expand')).map(([, v]) => v)

        if (req.method === 'POST' && parts[1] === 'payment_intents' && parts.length === 2) {
            const metadata = {}
            for (const [k, v] of params) {
                const m = /^metadata\[(.+)\]$/.exec(k)
                if (m) metadata[m[1]] = v
            }
            const id = nextId('pi')
            const pi = {
                id,
                object: 'payment_intent',
                amount: Number(params.get('amount')),
                currency: params.get('currency'),
                status: 'requires_payment_method',
                metadata,
                client_secret: `${id}_secret_fake`,
                latest_charge: null,
            }
            intents.set(id, pi)
            return send(res, 200, view(pi, []))
        }
        if (req.method === 'GET' && parts[1] === 'payment_intents' && parts[2]) {
            const pi = intents.get(parts[2])
            return pi ? send(res, 200, view(pi, expand)) : notFound(res, parts[2])
        }
        if (req.method === 'POST' && parts[1] === 'refunds') {
            const key = req.headers['idempotency-key']
            if (key && idempotent.has(key)) return send(res, 200, idempotent.get(key))
            const pi = intents.get(params.get('payment_intent'))
            if (!pi || !pi.latest_charge) return notFound(res, params.get('payment_intent'))
            const charge = charges.get(pi.latest_charge)
            if (charge.refunded) {
                return send(res, 400, {
                    error: { type: 'invalid_request_error', code: 'charge_already_refunded', message: 'Charge has already been refunded.' },
                })
            }
            charge.refunded = true
            charge.amount_refunded = charge.amount
            const refund = { id: nextId('re'), object: 'refund', payment_intent: pi.id, amount: charge.amount, status: 'succeeded' }
            refunds.push({ ...refund, idempotencyKey: key })
            if (key) idempotent.set(key, refund)
            return send(res, 200, refund)
        }
        send(res, 404, { error: { type: 'invalid_request_error', message: `Unhandled ${req.method} ${url.pathname}` } })
    })

    return new Promise((resolve) => {
        server.listen(0, '127.0.0.1', () => {
            resolve({
                url: `http://127.0.0.1:${server.address().port}`,
                close: () => new Promise((r) => server.close(r)),
                intents,
                refunds,
                // จำลองว่าลูกค้ากรอกบัตรและจ่ายสำเร็จ (ที่จริงหน้าเว็บทำผ่าน Stripe.js)
                succeed(id) {
                    const pi = intents.get(id)
                    const chargeId = nextId('ch')
                    charges.set(chargeId, { id: chargeId, object: 'charge', amount: pi.amount, amount_refunded: 0, refunded: false })
                    pi.status = 'succeeded'
                    pi.latest_charge = chargeId
                    return pi
                },
                // สร้าง intent ตรง ๆ (เช่น ของผู้ใช้อื่น หรือไม่มี metadata)
                create(fields) {
                    const id = nextId('pi')
                    const pi = { id, object: 'payment_intent', currency: 'thb', status: 'requires_payment_method', metadata: {}, latest_charge: null, ...fields }
                    intents.set(id, pi)
                    return pi
                },
                refundsFor: (id) => refunds.filter((r) => r.payment_intent === id),
            })
        })
    })
}

// ---------- ฐานข้อมูลทดสอบ ----------
// ลบแล้วสร้างใหม่จาก db/schema.sql ทุกครั้ง — บังคับชื่อลงท้าย _test กันลบฐานข้อมูลจริงโดยไม่ตั้งใจ
async function resetDatabase(databaseUrl) {
    const url = new URL(databaseUrl)
    const dbName = url.pathname.slice(1)
    if (!/_test$/.test(dbName)) {
        throw new Error(`TEST_DATABASE_URL ต้องชี้ไปที่ฐานข้อมูลที่ชื่อลงท้ายด้วย _test (ได้ "${dbName}") เพราะเทสต์จะลบข้อมูลทั้งหมด`)
    }
    url.pathname = '/'
    const conn = await mysql.createConnection({ uri: url.toString(), multipleStatements: true })
    try {
        await conn.query(`DROP DATABASE IF EXISTS \`${dbName}\`; CREATE DATABASE \`${dbName}\` CHARACTER SET utf8mb4; USE \`${dbName}\`;`)
        await conn.query(fs.readFileSync(path.join(SERVER_DIR, 'db', 'schema.sql'), 'utf8'))
    } finally {
        await conn.end()
    }
}

async function dbQuery(databaseUrl, sql, params = []) {
    const conn = await mysql.createConnection({ uri: databaseUrl })
    try {
        const [rows] = await conn.query(sql, params)
        return rows
    } finally {
        await conn.end()
    }
}

async function createAdmin(databaseUrl, email, password) {
    await dbQuery(
        databaseUrl,
        "INSERT INTO user (email, password, role, enabled, createdAt, updatedAt) VALUES (?, ?, 'admin', 1, UTC_TIMESTAMP(3), UTC_TIMESTAMP(3))",
        [email, await bcrypt.hash(password, 10)]
    )
}

// ---------- เปิด server จริงเป็น process แยก ----------
function startServer(env) {
    const logFile = path.join(require('node:os').tmpdir(), `ithub-test-server-${process.pid}-${env.PORT}.log`)
    const log = fs.createWriteStream(logFile)
    const child = spawn(process.execPath, ['server.js'], {
        cwd: SERVER_DIR,
        // ไม่สืบทอดค่าจาก .env ของเครื่อง: ใช้เฉพาะค่าที่เทสต์กำหนด
        env: { PATH: process.env.PATH, NODE_ENV: 'test', ...env },
        stdio: ['ignore', 'pipe', 'pipe'],
    })
    child.stdout.pipe(log)
    child.stderr.pipe(log)
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error(`server ไม่ขึ้นภายใน 15 วินาที ดู log: ${logFile}`)), 15000)
        child.stdout.on('data', (d) => {
            if (String(d).includes('Server is running')) {
                clearTimeout(timer)
                resolve({ child, logFile, stop: () => new Promise((r) => { child.once('exit', r); child.kill() }) })
            }
        })
        child.once('exit', (code) => {
            clearTimeout(timer)
            reject(new Error(`server ปิดตัวทันที (exit ${code}) ดู log: ${logFile}`))
        })
    })
}

// ---------- client แบบเบราว์เซอร์: จำ cookie, ส่ง Origin ของหน้าเว็บ ----------
function makeClient(baseUrl, { origin, ip } = {}) {
    let cookie = null
    const client = {
        get cookie() {
            return cookie
        },
        set cookie(v) {
            cookie = v
        },
        async call(method, urlPath, { body, raw, headers = {}, sendOrigin = true } = {}) {
            const res = await fetch(baseUrl + urlPath, {
                method,
                headers: {
                    ...(body !== undefined || raw !== undefined ? { 'content-type': 'application/json' } : {}),
                    ...(cookie ? { cookie } : {}),
                    ...(sendOrigin && origin ? { origin } : {}),
                    ...(ip ? { 'x-forwarded-for': ip } : {}),
                    ...headers,
                },
                body: raw !== undefined ? raw : body !== undefined ? JSON.stringify(body) : undefined,
            })
            const setCookie = res.headers.getSetCookie?.() || []
            for (const c of setCookie) {
                const [pair] = c.split(';')
                if (pair.startsWith('token=')) cookie = pair === 'token=' ? null : pair
            }
            const text = await res.text()
            let data = text
            try {
                data = JSON.parse(text)
            } catch {
                /* ข้อความธรรมดา */
            }
            return { status: res.status, data, headers: res.headers, setCookie }
        },
        get: (p, o) => client.call('GET', p, o),
        post: (p, body, o = {}) => client.call('POST', p, { ...o, body }),
        put: (p, body, o = {}) => client.call('PUT', p, { ...o, body }),
        del: (p, o) => client.call('DELETE', p, o),
        async login(email, password) {
            const r = await client.post('/api/login', { email, password })
            if (r.status !== 200) throw new Error(`login ${email} ไม่ผ่าน: ${r.status} ${JSON.stringify(r.data)}`)
            return r
        },
    }
    return client
}

module.exports = { startFakeStripe, resetDatabase, dbQuery, createAdmin, startServer, makeClient }
