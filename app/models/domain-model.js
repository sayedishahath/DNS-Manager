const {Schema,model} = require ('mongoose');
const domainSchema = new Schema({
    // file:String,
    name: {type : String , required :true},
    zoneId : String,
    userId:  { type: Schema.Types.ObjectId, ref: 'User' }
})
const  Domain= model('Domain',domainSchema);
module.exports = Domain