const mongoose = require('mongoose')
const dbConfigure = async ()=>{
    const connectionParams = {
        useNewUrlParser:true,
        useUnifiedTopology: true,
    }
    try{
        await mongoose.connect(process.env.MONGODB_REMOTE,connectionParams)
        console.log("Mongodb Connected Successfully")
    }catch(err){
        console.log('error connecting db')
    }
}
module.exports = dbConfigure