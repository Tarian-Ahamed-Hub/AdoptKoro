const autheticateClient = require("../HelperFuncs/middlewareHelper")


const adminMiddleware = (req,res,next)=>{
     autheticateClient(req,res,next,["user","admin"]);
}

module.exports = adminMiddleware;
