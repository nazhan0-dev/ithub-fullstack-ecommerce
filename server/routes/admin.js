const express = require('express')
// import middlewares
const {authCheck, adminCheck} = require('../middlewares/authCheck')
const router = express.Router()
// import controller
const {getOrderAdmin , changeOrderStatus} = require('../controllers/admin')
const { lowStock } = require('../controllers/notification')


router.put('/admin/order-status',authCheck,adminCheck,changeOrderStatus)
router.get('/admin/orders',authCheck,adminCheck,getOrderAdmin)
router.get('/admin/low-stock',authCheck,adminCheck,lowStock)





module.exports = router