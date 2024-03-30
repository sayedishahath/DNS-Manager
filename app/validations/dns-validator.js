const DNSRecord = require('../models/dns-model')
const DNSRecordValidationSchema = {
    domain:{
        notEmpty:{
            errorMessage:"domain name is required"
        }
    },
    recordType:{
        notEmpty:{
            errorMessage:"record type is required"
        }
    },
    recordValue:{
        notEmpty:{
            errorMessage:"record value is required"
        }
    },
    ttl:{
        notEmpty:{
            errorMessage:"ttl is required"
        }
    }
}
module.exports = DNSRecordValidationSchema