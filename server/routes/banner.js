const express = require('express')
const router = express.Router()
const { authCheck, adminCheck } = require('../middlewares/authCheck')
const { listActive, listAll, create, update, remove } = require('../controllers/banner')

// แบนเนอร์หน้าแรก
router.get('/banners', listActive)
router.get('/admin/banners', authCheck, adminCheck, listAll)
router.post('/admin/banners', authCheck, adminCheck, create)
router.put('/admin/banners/:id', authCheck, adminCheck, update)
router.delete('/admin/banners/:id', authCheck, adminCheck, remove)

module.exports = router
