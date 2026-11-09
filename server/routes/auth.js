const express = require('express')
const router = express.Router()
// import controller
const {register , login , logout , currentUser} = require('../controllers/auth')
// import middleware
const {authCheck ,adminCheck } = require('../middlewares/authCheck')
//@ENDPOINT http://localhost:8000/api/auth
router.post('/register',register)
router.post('/login',login)
router.post('/logout',logout)
router.post('/current-user',authCheck,currentUser)
router.post('/current-admin',authCheck,adminCheck,currentUser)





module.exports = router