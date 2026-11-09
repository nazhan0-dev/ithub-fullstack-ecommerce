// การเชื่อมต่อ MySQL (ใช้ mysql2 แทน Prisma)
try { process.loadEnvFile(require('path').join(__dirname, '..', '.env')) } catch { /* โหลดจาก server.js แล้ว หรือไม่มี .env */ }
const mysql = require('mysql2/promise')

const pool = mysql.createPool({
    uri: process.env.DATABASE_URL,
    connectionLimit: 10,
    // เวลาในฐานข้อมูลเก็บเป็น UTC (แบบเดียวกับที่ Prisma เคยบันทึกไว้)
    timezone: 'Z',
    // tinyint(1) -> true/false (เช่น user.enabled)
    typeCast(field, next) {
        if (field.type === 'TINY' && field.length === 1) {
            const v = field.string()
            return v === null ? null : v === '1'
        }
        return next()
    },
})

// รัน SQL แล้วคืนแถวผลลัพธ์ (SELECT) หรือข้อมูลผลการเขียน (INSERT/UPDATE/DELETE)
async function query(sql, params = [], conn = pool) {
    const [rows] = await conn.query(sql, params)
    return rows
}

// คืนแถวแรก หรือ null
async function one(sql, params = [], conn = pool) {
    const rows = await query(sql, params, conn)
    return rows[0] || null
}

// ทำหลายคำสั่งเป็นชุดเดียว: สำเร็จทั้งหมด หรือย้อนกลับทั้งหมด
async function transaction(fn) {
    const conn = await pool.getConnection()
    try {
        await conn.beginTransaction()
        const result = await fn(conn)
        await conn.commit()
        return result
    } catch (err) {
        await conn.rollback()
        throw err
    } finally {
        conn.release()
    }
}

// ---------- ตัวช่วยประกอบข้อมูลที่เกี่ยวข้องกัน ----------

const groupBy = (rows, key) => {
    const map = new Map()
    for (const r of rows) {
        if (!map.has(r[key])) map.set(r[key], [])
        map.get(r[key]).push(r)
    }
    return map
}

// product[] -> product[] พร้อม category และ images
async function withCategoryAndImages(products, conn = pool) {
    if (products.length === 0) return products
    const ids = products.map((p) => p.id)
    const catIds = [...new Set(products.map((p) => p.categoryId).filter((id) => id != null))]
    const images = await query('SELECT * FROM image WHERE productId IN (?) ORDER BY id', [ids], conn)
    const categories = catIds.length ? await query('SELECT * FROM category WHERE id IN (?)', [catIds], conn) : []
    const imgMap = groupBy(images, 'productId')
    const catMap = new Map(categories.map((c) => [c.id, c]))
    return products.map((p) => ({
        ...p,
        category: p.categoryId != null ? catMap.get(p.categoryId) || null : null,
        images: imgMap.get(p.id) || [],
    }))
}

// order[]/cart[] -> พร้อม products: [{...รายการ, product: {...}}]
async function withLineItems(parents, table, fk, conn = pool) {
    if (parents.length === 0) return parents
    const ids = parents.map((o) => o.id)
    const items = await query(`SELECT * FROM ${table} WHERE ${fk} IN (?) ORDER BY id`, [ids], conn)
    const productIds = [...new Set(items.map((i) => i.productId))]
    const products = productIds.length ? await query('SELECT * FROM product WHERE id IN (?)', [productIds], conn) : []
    const prodMap = new Map(products.map((p) => [p.id, p]))
    const itemMap = groupBy(items, fk)
    return parents.map((o) => ({
        ...o,
        products: (itemMap.get(o.id) || []).map((i) => ({ ...i, product: prodMap.get(i.productId) || null })),
    }))
}

module.exports = { pool, query, one, transaction, withCategoryAndImages, withLineItems }
