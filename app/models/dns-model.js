const {Schema,model} = require ('mongoose')
const dnsSchema = new Schema({
    domain:String,
    recordType:String,
    recordValue:String,
    ttl:Number,
    zoneId:String
})
const DNSRecord = model( 'DNSRecord', dnsSchema ) 
module.exports = DNSRecord