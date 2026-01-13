const axios = require("axios");
const { oauth2client } = require("../../Configs/googleConfig");
const { Session } = require("../../Models/Session");
const jwt = require("jsonwebtoken");
const User = require("../../Models/User");
const { dbHandler } = require("../../HelperFuncs/dbHelper");
const { createToken } = require("../../HelperFuncs/GlobalHelper");
const { v4: uuidv4 } = require("uuid");
const { cacheRedis } = require("../../Configs/cacheRedis");
const {autheticateUserHelper} = require("../../HelperFuncs/authenticate");
const  mongoose = require("mongoose");

const signInWithGoogle = async (req, res) => {
  try {
    const { code } = req.query;
    const googleRes = await oauth2client.getToken(code);
    oauth2client.setCredentials(googleRes.tokens);

    const userDetails = await axios.get(
      `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${googleRes.tokens.access_token}`
    );

    const { email, name, picture } = userDetails.data;

      dbHandler(res, async () => {
      const existingUser = await User.findOneAndUpdate(
        {
          email: email,
        },
        {
          $setOnInsert: {
            email,
            name,
            pic: picture,
            roles: ["user"],
            password: uuidv4(),
          },
        },
        {
          new: true,
          upsert: true,
        }
      );

      const payload = {
        tokenId:uuidv4(),
        userId: existingUser._id,
        roles: existingUser.roles,
      };

      const token = createToken(payload, "30d");

       await Session.create({
        token,
        userId: new mongoose.Types.ObjectId(existingUser._id)
      });

      const user = {
        name:existingUser.name,
        pic:existingUser.pic,
        roles:existingUser.roles   
      }
     return res.status(200)
            .cookie("sessionToken",token,{
                httpOnly: true,
                secure: process.env.PRODUCTION === "true",   
                sameSite: "lax",
                maxAge: 30 * 24 * 60 * 60 * 1000, 
                path: "/" 
            })
            .json({
                message:"Logged In",
                user:user
            })
    });
  } catch (err) {
    return res.status(500).json({
      message: err,
    });
  }
};

const logout = async(req,res)=>{
  try{
    const sessionToken = req.cookies.sessionToken;
    if(sessionToken){
       const decoded = jwt.verify(sessionToken,process.env.JWT_SECRET);
       
       const ttl = decoded.exp - Math.floor(Date.now()/1000);
       await cacheRedis.set(
        `tokenBlock:${decoded.tokenId}`,
        1,
        {EX:ttl}
       )
       
       res.status(200).clearCookie("sessionToken",{
         httpOnly: true,
         secure: process.env.PRODUCTION === "true",  
         sameSite: "lax",                            
         path: "/", 
       }).json({
          message:"logged out"
       })

    }
    else{
      throw new Error("Logged out already")
    }
    
    }
    catch(err){
         res.status(200).clearCookie("sessionToken",{
         httpOnly: true,
         secure: process.env.PRODUCTION === "true",  
         sameSite: "lax",                            
         path: "/", 
       }).json({
          message:"logged out"
       })
    }
  

}

const authenticateUser = async(req,res)=>{
  try{
       const roles = req.body.roles;
       autheticateUserHelper(req,res,roles);

    }
    catch(err){
       return res.status(403).json({
          message:"Roles were not provided",
          err:err
        })
    }

}



module.exports = { signInWithGoogle ,logout,authenticateUser};
