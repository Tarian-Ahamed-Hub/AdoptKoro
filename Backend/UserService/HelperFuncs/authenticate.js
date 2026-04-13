const jwt = require("jsonwebtoken");
const { getRedisClient } = require("../Configs/cacheRedis");
const { Session } = require("../Models/Session");
 
 
 

const autheticateUserHelper = async(req,res,roles)=>{
  
  
try {
  const authHeader = req.headers.authorization;
  const sessionToken = authHeader.split(" ")[1];

    if (!sessionToken || !authHeader || !authHeader.startsWith("Bearer ")) {
      throw new Error("No token");
    }
    
  const decoded = jwt.verify(sessionToken, process.env.JWT_SECRET);
  
  const cacheRedis = getRedisClient();
  const isBlocked = await cacheRedis.get(`tokenBlock:${decoded.tokenId}`);
  if(isBlocked){
   
    return res.status(401).json({
     message: "Unauthenticated",
     err:"User is not authenticated,logged out already"

  })
  }
 
  for(const role of roles){
     if(!decoded.roles.includes(role)){
        return res.status(403).json({
            message: "Unauthorised",
            err:"User doesn't have the role"
     })
     }
  }
    const userData = await Session.findOne({token:sessionToken}).populate("userId")
 
    const user = {
      userId:userData.userId._id,
      name:userData.userId.name,
      pic:userData.userId.pic,
      roles:userData.userId.roles 
    }
   

    return res.status(200).json({
     message: `User is id: ${decoded.userId}`,
     user:user
    })


} catch (err) {
  return res.status(401).json({
     message: "Unauthenticated",
     err:`User is not authenticated ${err.message}`

  })
}

}

module.exports = {autheticateUserHelper};