// แบนเนอร์หน้าแรก — admin อัปรูปสินค้าติดกระแส (เช่น มือถือรุ่นใหม่, การ์ดจอ) แล้วลิงก์ไปหน้าสินค้า
const cloudinary = require('cloudinary').v2
const { query, one } = require('../config/db')

const fields = (body) => {
    const title = String(body.title || '').trim()
    const subtitle = String(body.subtitle || '').trim() || null
    const productId = body.productId === '' || body.productId == null ? null : Number(body.productId)
    return { title, subtitle, productId }
}

const invalid = ({ title }, image) => {
    if (!title) return 'กรุณาใส่ชื่อแบนเนอร์'
    if (title.length > 120) return 'ชื่อแบนเนอร์ยาวเกิน 120 ตัวอักษร'
    if (image !== undefined && (!image?.secure_url || !image?.public_id)) return 'กรุณาอัปโหลดรูปแบนเนอร์'
    return null
}

const withProduct = async (banners) => {
    const ids = [...new Set(banners.map((b) => b.productId).filter(Boolean))]
    const products = ids.length ? await query('SELECT id, title, price, quantity FROM product WHERE id IN (?)', [ids]) : []
    const map = new Map(products.map((p) => [p.id, p]))
    return banners.map((b) => ({ ...b, product: b.productId ? map.get(b.productId) || null : null }))
}

// GET /banners — หน้าแรก: เฉพาะที่เปิดใช้งาน
exports.listActive = async (req, res) => {
    try {
        const banners = await query('SELECT * FROM banner WHERE isActive = 1 ORDER BY id DESC')
        res.json(await withProduct(banners))
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Server Error' })
    }
}

// GET /admin/banners — ทั้งหมด
exports.listAll = async (req, res) => {
    try {
        res.json(await withProduct(await query('SELECT * FROM banner ORDER BY id DESC')))
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Server Error' })
    }
}

// POST /admin/banners — { title, subtitle, productId, image: { secure_url, public_id } }
exports.create = async (req, res) => {
    try {
        const f = fields(req.body)
        const error = invalid(f, req.body.image ?? null)
        if (error) return res.status(400).json({ message: error })
        const result = await query(
            `INSERT INTO banner (title, subtitle, imageUrl, publicId, productId, isActive, createdAt, updatedAt)
             VALUES (?, ?, ?, ?, ?, 1, UTC_TIMESTAMP(3), UTC_TIMESTAMP(3))`,
            [f.title, f.subtitle, req.body.image.secure_url, req.body.image.public_id, f.productId]
        )
        const [banner] = await withProduct([await one('SELECT * FROM banner WHERE id = ?', [result.insertId])])
        res.json(banner)
    } catch (error) {
        if (error.code === 'ER_NO_REFERENCED_ROW_2') return res.status(400).json({ message: 'ไม่พบสินค้าที่เลือก' })
        console.log(error)
        res.status(500).json({ message: 'Server Error' })
    }
}

// PUT /admin/banners/:id — แก้ข้อความ/ลิงก์/เปิดปิด (ส่ง image มาด้วย = เปลี่ยนรูป แล้วลบรูปเก่า)
exports.update = async (req, res) => {
    try {
        const id = Number(req.params.id)
        const old = await one('SELECT * FROM banner WHERE id = ?', [id])
        if (!old) return res.status(404).json({ message: 'ไม่พบแบนเนอร์' })

        const f = fields({ ...old, ...req.body })
        const error = invalid(f, req.body.image)
        if (error) return res.status(400).json({ message: error })
        const isActive = req.body.isActive === undefined ? old.isActive : !!req.body.isActive
        const image = req.body.image || { secure_url: old.imageUrl, public_id: old.publicId }

        await query(
            `UPDATE banner SET title = ?, subtitle = ?, productId = ?, isActive = ?, imageUrl = ?, publicId = ?, updatedAt = UTC_TIMESTAMP(3)
             WHERE id = ?`,
            [f.title, f.subtitle, f.productId, isActive, image.secure_url, image.public_id, id]
        )
        if (image.public_id !== old.publicId) {
            await cloudinary.uploader.destroy(old.publicId).catch(console.log)
        }
        const [banner] = await withProduct([await one('SELECT * FROM banner WHERE id = ?', [id])])
        res.json(banner)
    } catch (error) {
        if (error.code === 'ER_NO_REFERENCED_ROW_2') return res.status(400).json({ message: 'ไม่พบสินค้าที่เลือก' })
        console.log(error)
        res.status(500).json({ message: 'Server Error' })
    }
}

// DELETE /admin/banners/:id — ลบแบนเนอร์ + รูปบน Cloudinary
exports.remove = async (req, res) => {
    try {
        const banner = await one('SELECT * FROM banner WHERE id = ?', [Number(req.params.id)])
        if (!banner) return res.status(404).json({ message: 'ไม่พบแบนเนอร์' })
        await query('DELETE FROM banner WHERE id = ?', [banner.id])
        await cloudinary.uploader.destroy(banner.publicId).catch(console.log)
        res.json({ ok: true })
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Server Error' })
    }
}
