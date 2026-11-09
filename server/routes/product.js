const express = require('express')
const router = express.Router()
// import controllers
const {create ,
       list , 
       remove , 
       listby , 
       searchFilters ,
       update , 
       read ,
       createImages,
       removeImage
    } = require('../controllers/product')
const {adminCheck , authCheck} = require('../middlewares/authCheck')
//@ENDPOINT http://localhost:8000/api/product
router.post('/product', authCheck, adminCheck, create)
router.get('/products/:count',list)
router.get('/product/:id',read)
router.put('/product/:id', authCheck, adminCheck, update)
router.delete('/product/:id', authCheck, adminCheck, remove)
router.post('/productby',listby)
router.post('/search/filters',searchFilters)

router.post('/images', authCheck, adminCheck, createImages)
router.post('/removeimages', authCheck, adminCheck, removeImage)

module.exports = router