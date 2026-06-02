const express = require('express')
const rounter = express.Router()
// import controllers
const {create , list , remove} = require('../controllers/category')
// import middlware
const {authCheck , adminCheck} = require('../middllewares/authCheck')

//@ENDPOINT http://localhost:8000/api/category
rounter.post('/category',authCheck,adminCheck,create)
rounter.get('/category',authCheck,adminCheck,list)
rounter.delete('/category/:id',authCheck,adminCheck,remove)




module.exports = rounter