const { query, one } = require('../config/db')

exports.create = async (req, res) => {
    try {
        const { name } = req.body
        const result = await query(
            'INSERT INTO category (name, createdAt, updatedAt) VALUES (?, UTC_TIMESTAMP(3), UTC_TIMESTAMP(3))',
            [name]
        )
        const category = await one('SELECT * FROM category WHERE id = ?', [result.insertId])
        res.send(category)
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Server Error' })
    }
}

exports.list = async (req, res) => {
    try {
        const category = await query('SELECT * FROM category ORDER BY id')
        res.send(category)
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Server Error' })
    }
}

exports.remove = async (req, res) => {
    try {
        const id = Number(req.params.id)
        const category = await one('SELECT * FROM category WHERE id = ?', [id])
        if (!category) {
            return res.status(404).json({ message: 'Category not found' })
        }
        // สินค้าในหมวดนี้จะถูกตั้ง categoryId = NULL อัตโนมัติ (ON DELETE SET NULL)
        await query('DELETE FROM category WHERE id = ?', [id])
        res.send(category)
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Server Error' })
    }
}
