const axios = require("axios");
 
 
const  mongoose = require("mongoose");
const { getKafkaProducer } = require("../../Kafka/KafkaProducer");
const { CompressionTypes } = require("kafkajs");
const { Category } = require("../../Models/Category");
const District = require("../../Models/District");
const { Post } = require("../../Models/Post");
const { dbHandler } = require("../../HelperFuncs/dbHelper");
const { getRedisClient } = require("../../Configs/cacheRedis");
const User = require("../../Models/User");


const createPost = async(req,res)=>{

  let {district,category,title,content} = req.body;
    district = JSON.parse(district);

     const images = req.files?.map(file => file.path) || [];
    
    const postObject = {
      title,
      content,
      location:{
        type:"Point",
        coordinates:district.coordinate
      },
      category,
      district:district.district,
      userId:req.user.userId,
      pics:images

    }

   

   const producer = getKafkaProducer();
   await producer.send({
     topic:"posts",
     compression:CompressionTypes.GZIP,
     messages:[
        {
          key:"id",
          value:JSON.stringify(postObject)
        }
     ]
   })
   console.log("post sent to kafka");

  return res.status(200).json({
      message: "Your Post is being Posted",
    });
   
}

const getUserPosts = async(req,res)=>{

   dbHandler(res,async()=>{
          const user = req.user;

          const posts = await Post.aggregate([
            {
              $match:{
                 userId: new mongoose.Types.ObjectId(user.userId)
              }
            },
            {
              $lookup:{
                  localField:"userId",
                  foreignField:"userId",
                  from:"users",
                  as:"user"
              }
            },
            {
              $unwind:"$user"
            },
            {
              $project:{
                title: 1,
                content: 1,
                pics: 1,
                category: 1,
                district: 1,
                createdAt: 1,
                active: 1,
                "user.name": 1,
                "user.pic": 1,
                "user.userId": 1
              }
            }
          
          ]);
        
          return res.status(200).json({
            message:"fetched posts of the user",
            posts:posts
          })
   })



}

const updatePost = async(req,res)=>{

   dbHandler(res,async()=>{
          const user = req.user;
          const {post,active} = req.body;

        //  let updatedPost = await Post.findOneAndUpdate(//fix:findOneAndUpdate and fetch user by userId using promise all
        //     { _id: post._id, userId: user.userId },
        //     { $set: { active: active } },
        //     { new: true }    
        //   );
        //   let existingUser = await User.findOne({userId:user.userId});

        let [updatedPost, existingUser] = await Promise.all([
          Post.findOneAndUpdate(
            { _id: post._id, userId: user.userId },
            { $set: { active } },
            { new: true }
          ),
          User.findOne({ userId: user.userId })
        ]);

        if (updatedPost && existingUser) {
          updatedPost = updatedPost.toObject();  
          updatedPost.user = {
            name: existingUser.name,
            pic: existingUser.pic,
            userId: existingUser.userId
          };
        }
        else{  
           return res.status(404).json({
            message:"Post not found",
          })
        }

          const key = `post:content:${post._id}`;
          const redis = getRedisClient()
          
           
            
          const exists = await redis.exists(key);
          updatedPost.user = {name:post.user.name,pic:post.user.pic,userId:post.user.userId}
       
          if(exists){
          const cacheKey = `posts:latest:${post.category}`;
          await redis.del(cacheKey);
          }
        
          return res.status(200).json({
            message:"fetched posts of the user",
            post:updatedPost
          })
   })



}

module.exports = { createPost,getUserPosts,updatePost};
