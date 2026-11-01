const { default: mongoose } = require("mongoose");
const { getRedisClient } = require("../../Configs/cacheRedis");
const { dbHandler } = require("../../HelperFuncs/dbHelper")
const { Category } = require("../../Models/Category");
const District = require("../../Models/District");
const { Post } = require("../../Models/Post");


 

const getCategoriesAndDistricts = async(req,res)=>{
 
        dbHandler(res,async()=>{
           const categories = await Category.find().lean();
           const districts = await District.find().sort({ district: 1 }).lean();
           
           return res.status(200).json({
              message:"Categores and districts retrieved",
              categories:categories,
              districts:districts,
           })
        })

}
 
 

const getPost = async(req,res)=>{
 
  
      dbHandler(res,async()=>{
        console.log("Getting post")
         const {postId} = req.body;
         
        
        const postData = await Post.findOne({_id:postId})
        if(!postData){
          return res.status(404).json({
           message:"post doesnt exist"
        })
        }
          return res.status(200).json({
           post:postData,
           message:"post exists"
        })
     
        
     

    })
   
   
   
}
module.exports = {getCategoriesAndDistricts,getPost}
