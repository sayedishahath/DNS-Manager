const express = require('express')
const router = express.Router()
const domainCtrl = require('../controllers/domain-controller')
const upload = require('../middlewares/multer')
const {authenticateUser, authorizeUser} = require('../middlewares/auth')

router
    .route('/api/domain')
        .post(authenticateUser, domainCtrl.createDomain)
        .get(authenticateUser,domainCtrl.getDomain)
router
    .route('/api/domain/:hostedZoneId')
        .delete(authenticateUser,authorizeUser,domainCtrl.deleteDomain)
router
    .route('/api/domain/upload')
        .post(authenticateUser,upload.single('file'),domainCtrl.uploadBukDomain)
module.exports = router