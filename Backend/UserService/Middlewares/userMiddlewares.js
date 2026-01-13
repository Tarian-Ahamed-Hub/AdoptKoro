const autheticateClient = require("../HelperFuncs/middlewareHelper")


const userMiddleware = (req,res,next)=>{
     autheticateClient(req,res,next,["user"]);
}

module.exports = userMiddleware;

