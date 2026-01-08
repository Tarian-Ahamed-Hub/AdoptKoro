const axios  = require("axios");
const { oauth2client } = require("../../Configs/googleConfig");


const signInWithGoogle = async(req,res)=>{
    try{
    const {code} = req.query;
    const googleRes = await oauth2client.getToken(code);
    oauth2client.setCredentials(googleRes.tokens)
    
    const userDetails = await axios.get(`https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${googleRes.tokens.access_token}`)
    const {email,name,picture} = userDetails.data;
    console.log(userDetails.data)

    }
    catch(err){
        return res.status(500).json({
            message:err
        })
    }
    
}

module.exports = {signInWithGoogle}