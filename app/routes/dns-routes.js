const express = require('express')
const upload = require('../middlewares/multer')
const router = express.Router()
const dnsCtrl = require('../controllers/dns-controller')
const DNSRecordValidationSchema = require('../validations/dns-validator')
const {checkSchema} = require('express-validator')
const {authenticateUser,authorizeUser} = require('../middlewares/auth')

router
    .route('/api/dns/:hostedZoneId')
        .post(authenticateUser,authorizeUser,checkSchema(DNSRecordValidationSchema),dnsCtrl.createDNSRecord )
        .get(authenticateUser,authorizeUser, dnsCtrl.getAllDNSRecords)
router
    .route('/api/dns/:hostedZoneId/:id')
        .put(authenticateUser,authorizeUser,checkSchema(DNSRecordValidationSchema),dnsCtrl.updateDNSRecord)
        .delete(authenticateUser,authorizeUser,dnsCtrl.deleteDNSRecord)
router
    .route('/api/dns/:hostedZoneId/upload-record')
        .post(authenticateUser,authorizeUser,upload.single('file'),dnsCtrl.createBulkDNSRecord)
module.exports = router