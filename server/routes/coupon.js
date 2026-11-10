const express = require('express')
const router = express.Router()
const { authCheck, adminCheck } = require('../middlewares/authCheck')
const {
    applyCoupon, removeCoupon, listCoupons, createCoupon, updateCoupon, deleteCoupon,
    listAvailable, listCenter, collect, myCoupons,
} = require('../controllers/coupon')

// ลูกค้า: ใส่/ถอดโค้ดส่วนลดกับตะกร้า
router.post('/user/cart/coupon', authCheck, applyCoupon)
router.delete('/user/cart/coupon', authCheck, removeCoupon)

// ศูนย์เก็บคูปอง + กระเป๋าคูปอง
router.get('/coupons', listAvailable)
router.get('/user/coupons/center', authCheck, listCenter)
router.post('/user/coupons/:id/collect', authCheck, collect)
router.get('/user/coupons', authCheck, myCoupons)

// admin: จัดการคูปอง
router.get('/admin/coupons', authCheck, adminCheck, listCoupons)
router.post('/admin/coupons', authCheck, adminCheck, createCoupon)
router.put('/admin/coupons/:id', authCheck, adminCheck, updateCoupon)
router.delete('/admin/coupons/:id', authCheck, adminCheck, deleteCoupon)

module.exports = router
