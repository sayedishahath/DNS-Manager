const jwt = require( 'jsonwebtoken' )
const Domain = require('../models/domain-model')
const authenticateUser =(req,res,next)=>{
    const token = req.headers['authorization']
    if(!token){
        return res.status(401).json({error:'token is required'})
    }
    try{
        const tokenData = jwt.verify(token,process.env.JWT_SECRET)
        console.log(tokenData)
        req.user ={
            id : tokenData.id,
            role:tokenData.role
        }
        next()
    }catch(err){
        res.status(401).json({error:'invalid token'})
    }
}
// const authorizeUser = ()=>{
//         return async (req,res,next)=>{
//             userId=req.user.id
//             hostedZoneId = req.params.hostedZoneId

//             const result = await Domain.findOne({userId:userId , zoneId: hostedZoneId })
//             if(!result){
//                 res.status(403).json({error:`You are not authorized to perform this action`})
//             }
//             else{
//                 next()
//             }
        
//     }
// }

const authorizeUser = async (req, res, next) => {
    const userId = req.user.id; 
    const hostedZoneId = req.params.hostedZoneId;
    const isAuthorized = await checkHostedZoneOwnership(userId, hostedZoneId);
    if (!isAuthorized) {
      return res.status(403).json({ message: 'You are not authorized to access this hosted zone' });
    }
    next(); 
  };
  
  const checkHostedZoneOwnership = async (userId, hostedZoneId) => {
    const hostedZone = await Domain.findOne({ zoneId: hostedZoneId, userId: userId });
    if (!hostedZone) {
        return false
    }else{
        return true
    }
  };
module.exports = {authenticateUser,authorizeUser}