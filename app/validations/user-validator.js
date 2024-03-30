const User = require('../models/user-model')
const registerValidationSchema = {
    userName:{
        notEmpty:{
            errorMessage:'username is required'
        },
        custom:{
            options : async function (value){
                const user = await User.findOne({userName:value})
                if(!user){
                    return true
                }else{
                    throw new Error('user name already exist')
                }
            }
        }
    },
    email:{
        notEmpty:{
            errorMessage:'email is required'
        },
        isEmail:{
            errorMessage:'invalid email'
        },
        custom:{
            options : async function (value){
                const user = await User.findOne({email:value})
                if(!user){
                    return true
                }else{
                    throw new Error('email already exist')
                }
            }
        },
        trim:true,
        normalizeEmail:true
    },
    password:{
        notEmpty:{
            errorMessage:'password is required'
        },
        isLength:{
            options:{min:8,max:120},
            errorMessage:'password must be between 8 and 120 characters long'
        }
    }
}

const  loginValidationSchema={
    email:{
        notEmpty:{
            errorMessage: 'email is required'
        },
        isEmail:{
            errorMessage: "Invalid Email"
        },
        trim:true,
        normalizeEmail:true
    },
    password:{
        notEmpty:{
            errorMessage:'password is required'
        },
        isLength:{
            options:{min:8,max:120},
            errorMessage:'password must be between 8 and 120 characters long'
        },
        trim:true
    }
}
module.exports ={
    registerValidationSchema,
    loginValidationSchema
}