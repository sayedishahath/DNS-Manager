const express = require('express');
const router = express.Router();
const userCtrl = require('../controllers/user-controller');
const {authenticateUser} = require('../middlewares/auth')
const {registerValidationSchema,loginValidationSchema} = require ('../validations/user-validator')
const {checkSchema} = require ("express-validator") 

router.post('/api/register',checkSchema(registerValidationSchema),userCtrl.register )
router.post('/api/login',checkSchema(loginValidationSchema),userCtrl.login)
router.get('/api/user/account',authenticateUser,userCtrl.account)
// Define other routes for CRUD operations...

module.exports = router