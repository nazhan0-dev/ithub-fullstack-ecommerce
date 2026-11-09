const express = require('express')
const router = express.Router()
// import middlewares
const {authCheck , adminCheck} = require('../middlewares/authCheck')
// import controllers
const  {listUsers , 
       changeStatus , 
       changeRole , 
       userCart , 
       getUserCart ,
       emptyCart ,
       saveAddress ,
       saveOrder,
       getOrder} = require('../controllers/user')
const { listNotifications,
        readNotifications,
        getRestockAlert,
        setRestockAlert } = require('../controllers/notification')
const { listWishlist, setWishlist } = require('../controllers/wishlist')

//@ENDPOINT http://localhost:8000/api/user
router.get('/users',authCheck,adminCheck,listUsers)
router.post('/change-status',authCheck,adminCheck,changeStatus)
router.post('/change-role',authCheck,adminCheck,changeRole)

router.post('/user/cart',authCheck,userCart)
router.get('/user/cart',authCheck,getUserCart)
router.delete('/user/cart',authCheck,emptyCart)

router.post('/user/address',authCheck,saveAddress)

router.post('/user/order',authCheck,saveOrder)
router.get('/user/order',authCheck,getOrder)

// แจ้งเตือน
router.get('/user/notifications',authCheck,listNotifications)
router.post('/user/notifications/read',authCheck,readNotifications)
router.get('/user/restock-alert/:productId',authCheck,getRestockAlert)
router.post('/user/restock-alert/:productId',authCheck,setRestockAlert)

// รายการโปรด (กดหัวใจ)
router.get('/user/wishlist',authCheck,listWishlist)
router.post('/user/wishlist/:productId',authCheck,setWishlist)





module.exports = router