const User = require ('../models/user-model')
const  jwt = require('jsonwebtoken')
const  bcrypt=require("bcryptjs")
const {validationResult} = require('express-validator')
const _ = require('lodash')
const userCtrl ={}

userCtrl.register =async(req,res)=>{
    const errors = validationResult(req)
    if(!errors.isEmpty()){
        return res.status(400).json({error: errors.array()})
    }
    const body = req.body
    const user = new User(body)
    try{
        const salt = await bcrypt.genSalt()
        const encryptedPassword = await bcrypt.hash(user.password,salt)
        user.password = encryptedPassword       
        await user.save()
        res.status(200).json(user)
    }catch(err){
        res.status(500).json('internal server error')
    }
}
userCtrl.login  =async (req,res)=> {
    const errors = validationResult(req)
    if(!errors.isEmpty()){
        return res.status(400).json({errors:errors.array()})
    }
    try{
        const body = req.body
        let user = await User.findOne({email:body.email})
        console.log(user)
        if(!user){
            return res.status(404).json({error:"invalid email/password"})
        }
        const checkPassword = await bcrypt.compare(body.password,user.password)
        if (!checkPassword){
            return res.status(404).json({error:'invalid email/password'})
        }
        // if(!user.isVerified){
        //     return res.status(400).json({error:'user is not verified'})
        // }
        const tokenData={
            id : user._id, 
            role:user.role
        }
        const token = jwt.sign(tokenData,process.env.JWT_SECRET,{expiresIn:'7d'})
        console.log(token)
        // user =await User.findOneAndUpdate({email:body.email},{jwtToken:token},{new:true})
        
        res.json({token:token , data:user })
    }catch(err){
        // console.log('Error in login', err);
        res.status(500).json(err)
    } 
}


userCtrl.account =async (req,res)=>{
    try{
        const user = await(User.findById(req.user.id).select({password:0}))
        // if(user.isVerified){
            return res.status(200).json(user)
        // }else{
        //     return res.status(400).json({error:'user is not verified'})
        // }
        
    }catch(err){
        res.status(500).json({error:"internal server error"})
    }
}
module.exports = userCtrl