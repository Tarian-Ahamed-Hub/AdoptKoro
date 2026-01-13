const jwt = require("jsonwebtoken");
const User = require("../Models/User");
const { cacheRedis } = require("../Configs/cacheRedis");

const autheticateClient = async(req,res,next,roles)=>{
  
  
try {
  const sessionToken = req.cookies.sessionToken;
  if(!sessionToken){
    throw new Error("No token");
  }
  const decoded = jwt.verify(sessionToken, process.env.JWT_SECRET);
  
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
  req.user = {userId:decoded.userId}

  next();


} catch (err) {
  return res.status(401).json({
     message: "Unauthenticated",
     err:`User is not authenticated ${err.message}`

  })
}

}

module.exports = autheticateClient;