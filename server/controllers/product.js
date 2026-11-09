const cloudinary = require('cloudinary').v2
const { query, one, transaction, withCategoryAndImages } = require('../config/db')
const { notifyRestock } = require('./notification')

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
})

// คอลัมน์ที่อนุญาตให้เรียงลำดับ (กัน SQL injection จากชื่อคอลัมน์)
const SORTABLE = ['id', 'title', 'price', 'sold', 'quantity', 'createdAt', 'updatedAt']

const toInt = (v, fallback) => {
    const n = parseInt(v, 10)
    return Number.isNaN(n) ? fallback : n
}

const productFields = (body) => [
    body.title,
    body.description,
    parseFloat(body.price),
    parseInt(body.quantity, 10),
    body.categoryId === '' || body.categoryId == null ? null : parseInt(body.categoryId, 10),
    // เกณฑ์แจ้งเตือนสินค้าใกล้หมด (ไม่ส่งมา = 5, 0 = ไม่แจ้ง)
    Math.max(0, toInt(body.lowStockThreshold, 5)),
]

// ข้อมูลยาวเกินช่องในฐานข้อมูล -> แจ้ง 400 พร้อมบอกว่าช่องไหน (แทน 500 เฉย ๆ)
const saveError = (res, error) => {
    console.log(error)
    if (error.code === 'ER_DATA_TOO_LONG') {
        return res.status(400).json({ message: 'ข้อความยาวเกินไป (ชื่อสินค้าไม่เกิน 255 ตัวอักษร)' })
    }
    res.status(500).json({ message: 'Server Error' })
}

async function insertImages(productId, images = [], conn) {
    if (!images.length) return
    await query(
        'INSERT INTO image (asset_id, public_id, url, secure_url, productId, createdAt, updatedAt) VALUES ?',
        [images.map((img) => [img.asset_id || '', img.public_id, img.url, img.secure_url, productId, new Date(), new Date()])],
        conn
    )
}

exports.create = async (req, res) => {
    try {
        const product = await transaction(async (conn) => {
            const result = await query(
                `INSERT INTO product (title, description, price, quantity, categoryId, lowStockThreshold, createdAt, updatedAt)
                 VALUES (?, ?, ?, ?, ?, ?, UTC_TIMESTAMP(3), UTC_TIMESTAMP(3))`,
                productFields(req.body),
                conn
            )
            await insertImages(result.insertId, req.body.images, conn)
            return one('SELECT * FROM product WHERE id = ?', [result.insertId], conn)
        })
        res.send(product)
    } catch (error) {
        saveError(res, error)
    }
}

exports.list = async (req, res) => {
    try {
        const count = toInt(req.params.count, 20)
        const products = await query('SELECT * FROM product ORDER BY createdAt DESC LIMIT ?', [count])
        res.send(await withCategoryAndImages(products))
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Server Error' })
    }
}

exports.read = async (req, res) => {
    try {
        const product = await one('SELECT * FROM product WHERE id = ?', [Number(req.params.id)])
        if (!product) {
            return res.status(404).json({ message: 'Product not found' })
        }
        const [full] = await withCategoryAndImages([product])
        res.send(full)
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Server Error' })
    }
}

exports.update = async (req, res) => {
    try {
        const id = Number(req.params.id)
        const product = await transaction(async (conn) => {
            const result = await query(
                `UPDATE product SET title = ?, description = ?, price = ?, quantity = ?, categoryId = ?, lowStockThreshold = ?, updatedAt = UTC_TIMESTAMP(3)
                 WHERE id = ?`,
                [...productFields(req.body), id],
                conn
            )
            if (result.affectedRows === 0) return null
            // แทนที่รูปทั้งหมดด้วยชุดใหม่
            await query('DELETE FROM image WHERE productId = ?', [id], conn)
            await insertImages(id, req.body.images, conn)
            const updated = await one('SELECT * FROM product WHERE id = ?', [id], conn)
            // เติมสต็อกแล้ว -> แจ้งลูกค้าที่กด "แจ้งเตือนเมื่อมีของ" ไว้
            await notifyRestock(updated, conn)
            return updated
        })
        if (!product) {
            return res.status(404).json({ message: 'Product not found' })
        }
        res.send(product)
    } catch (error) {
        saveError(res, error)
    }
}

exports.remove = async (req, res) => {
    try {
        const id = Number(req.params.id)
        const product = await one('SELECT id FROM product WHERE id = ?', [id])
        if (!product) {
            return res.status(404).json({ message: 'Product not found' })
        }
        // สินค้าที่อยู่ในตะกร้าของลูกค้า ลบไม่ได้ (foreign key) — แจ้งให้ชัดเจน
        const inCart = await one('SELECT COUNT(*) AS n FROM productoncart WHERE productId = ?', [id])
        if (inCart.n > 0) {
            return res.status(400).json({ message: 'สินค้านี้อยู่ในตะกร้าของลูกค้า ยังลบไม่ได้' })
        }
        // สินค้าที่เคยถูกสั่งซื้อแล้ว ลบไม่ได้ เพื่อเก็บประวัติคำสั่งซื้อไว้
        const inOrder = await one('SELECT COUNT(*) AS n FROM productonorder WHERE productId = ?', [id])
        if (inOrder.n > 0) {
            return res.status(400).json({ message: 'สินค้านี้มีอยู่ในคำสั่งซื้อแล้ว ลบไม่ได้' })
        }

        // ลบรูปบน Cloudinary ก่อน แล้วค่อยลบสินค้า (รูปในตาราง image ถูกลบตามอัตโนมัติ)
        const images = await query('SELECT public_id FROM image WHERE productId = ?', [id])
        await Promise.all(images.map((image) => cloudinary.uploader.destroy(image.public_id)))
        await query('DELETE FROM product WHERE id = ?', [id])
        res.send('Delete Success !!')
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Server Error' })
    }
}

exports.listby = async (req, res) => {
    try {
        const { sort, order, limit } = req.body
        const column = SORTABLE.includes(sort) ? sort : 'createdAt'
        const direction = String(order).toLowerCase() === 'asc' ? 'ASC' : 'DESC'
        const products = await query(`SELECT * FROM product ORDER BY \`${column}\` ${direction} LIMIT ?`, [toInt(limit, 12)])
        res.send(await withCategoryAndImages(products))
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Server Error' })
    }
}

// ค้นหา + หมวดหมู่ + ช่วงราคา ใช้พร้อมกันได้
exports.searchFilters = async (req, res) => {
    try {
        const { query: text, category, price } = req.body
        const where = []
        const params = []

        if (text) {
            where.push('title LIKE ?')
            params.push(`%${String(text).replace(/[\\%_]/g, '\\$&')}%`)
        }
        if (Array.isArray(category) && category.length > 0) {
            where.push('categoryId IN (?)')
            params.push(category.map((id) => Number(id)))
        }
        if (Array.isArray(price) && price.length === 2) {
            where.push('price BETWEEN ? AND ?')
            params.push(Number(price[0]), Number(price[1]))
        }

        const sql = `SELECT * FROM product ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY createdAt DESC`
        const products = await query(sql, params)
        res.send(await withCategoryAndImages(products))
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Server Error' })
    }
}

// ---------- รูปภาพ (Cloudinary) ----------

exports.createImages = async (req, res) => {
    try {
        const result = await cloudinary.uploader.upload(req.body.image, {
            public_id: `${Date.now()}`,
            resource_type: 'auto',
            folder: 'Ecom',
        })
        res.send(result)
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Server Error' })
    }
}

exports.removeImage = async (req, res) => {
    try {
        const { public_id } = req.body
        if (!public_id) {
            return res.status(400).json({ message: 'public_id is required' })
        }
        const result = await cloudinary.uploader.destroy(public_id)
        // 'not found' = รูปถูกลบไปแล้ว ถือว่าสำเร็จ
        if (result.result !== 'ok' && result.result !== 'not found') {
            return res.status(400).json({ message: 'Remove Image Failed' })
        }
        res.send('Remove Image Success!!!')
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: 'Server Error' })
    }
}
