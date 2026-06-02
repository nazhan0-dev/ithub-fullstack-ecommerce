const express = require('express')
const rounter = express.Router()
// import controller
const {register , login  , currentUser} = require('../controllers/auth')
// import middleware
const {authCheck ,adminCheck } = require('../middllewares/authCheck')
//@ENDPOINT http://localhost:8000/api/auth
rounter.post('/register',register)
rounter.post('/login',login)
rounter.post('/current-user',authCheck,currentUser)
rounter.post('/current-admin',authCheck,adminCheck,currentUser)





module.exports = rounter