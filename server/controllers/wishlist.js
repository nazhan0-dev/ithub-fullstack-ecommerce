// รายการโปรด (กดหัวใจ)
const { query, one, withCategoryAndImages } = require('../config/db')

// GET /user/wishlist — สินค้าที่กดหัวใจไว้ (ล่าสุดก่อน)
exports.listWishlist = async (req, res) => {
    try {
        const products = await query(
            `SELECT p.* FROM wishlist w JOIN product p ON p.id = w.productId
             WHERE w.userId = ? ORDER BY w.id DESC`,
            [req.user.id]
        )
        res.json(await withCategoryAndImages(products))
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Server Error' })
    }
}

// POST /user/wishlist/:productId — { liked: true|false }
exports.setWishlist = async (req, res) => {
    try {
        const productId = Number(req.params.productId)
        if (req.body?.liked === false) {
            await query('DELETE FROM wishlist WHERE userId = ? AND productId = ?', [req.user.id, productId])
            return res.json({ liked: false })
        }
        const product = await one('SELECT id FROM product WHERE id = ?', [productId])
        if (!product) {
            return res.status(404).json({ message: 'Product not found' })
        }
        await query(
            'INSERT IGNORE INTO wishlist (userId, productId, createdAt) VALUES (?, ?, UTC_TIMESTAMP(3))',
            [req.user.id, productId]
        )
        res.json({ liked: true })
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Server Error' })
    }
}
