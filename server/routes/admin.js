const express = require('express')
// import middlewares
const {authCheck} = require('../middllewares/authCheck')
const rounter = express.Router()
// import controller
const {getOrderAdmin , changeOrderStatus} = require('../controllers/admin')


rounter.put('/admin/order-status',authCheck,changeOrderStatus)
rounter.get('/admin/orders',authCheck,getOrderAdmin)





module.exports = rounter