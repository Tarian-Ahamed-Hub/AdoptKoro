const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')

const createToken = (payload,expiresIn)=>{
    const token = jwt.sign(payload,process.env.JWT_SECRET,{expiresIn,algorithm: 'HS256',})
    return token;
}

const hashPassword = async(plainPassword)=>{
    try{
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(plainPassword,salt);
        return hashedPassword;
    }
    catch(err){
        console.log("BCRYPT Error while hashing password ",err.message)
        let error = new Error('BCRYPT Error while hashing password ',err.message);
        error.name = "service error"
        throw error
    }
    
}

const comparePassword = async(plainPassword,hashedPassword)=>{
    try{
        const valid = await bcrypt.compare(plainPassword,hashedPassword)
        return valid;
    }
     catch(err){
        console.log("BCRYPT Error while comparing password ",err.message)
        let error = new Error('BCRYPT Error while comparing password');
        error.name = "service error"
        throw error
    }

}
module.exports = {
  createToken,
  hashPassword,
  comparePassword,
};