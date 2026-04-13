const axios = require("axios");

const mongoose = require("mongoose");
const { getKafkaProducer } = require("../../Kafka/KafkaProducer");
const { CompressionTypes } = require("kafkajs");
const { Category } = require("../../Models/Category");
const District = require("../../Models/District");
const { Post } = require("../../Models/Post");
const { dbHandler } = require("../../HelperFuncs/dbHelper");
const { getRedisClient } = require("../../Configs/cacheRedis");
const User = require("../../Models/User");
const ngeohash = require('ngeohash');

const createPost = async (req, res) => {
  let { district, category, title, content } = req.body;
  district = JSON.parse(district);

  const images = req.files?.map((file) => file.path) || [];

  const postObject = {
    title,
    content,
    location: {
      type: "Point",
      coordinates: district.coordinate,
    },
    category,
    district: district.district,
    userId: req.user.userId,
    pics: images,
  };

  const producer = getKafkaProducer();
  await producer.send({
    topic: "posts",
    compression: CompressionTypes.GZIP,
    messages: [
      {
        key: "id",
        value: JSON.stringify(postObject),
      },
    ],
  });
  console.log("post sent to kafka");

  return res.status(200).json({
    message: "Your Post is being Posted",
  });
};

const getUserPosts = async (req, res) => {
  dbHandler(res, async () => {
    const user = req.user;

    const posts = await Post.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(user.userId),
        },
      },
      {
        $lookup: {
          localField: "userId",
          foreignField: "userId",
          from: "users",
          as: "user",
        },
      },
      {
        $unwind: "$user",
      },
      {
        $project: {
          title: 1,
          content: 1,
          pics: 1,
          category: 1,
          district: 1,
          createdAt: 1,
          active: 1,
          "user.name": 1,
          "user.pic": 1,
          "user.userId": 1,
        },
      },
    ]);

    return res.status(200).json({
      message: "fetched posts of the user",
      posts: posts,
    });
  });
};

const updatePost = async (req, res) => {
  dbHandler(res, async () => {
    const user = req.user;
    const { post, active } = req.body;

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
        { new: true },
      ),
      User.findOne({ userId: user.userId }),
    ]);

    if (updatedPost && existingUser) {
      updatedPost = updatedPost.toObject();
      updatedPost.user = {
        name: existingUser.name,
        pic: existingUser.pic,
        userId: existingUser.userId,
      };
    } else {
      return res.status(404).json({
        message: "Post not found",
      });
    }

    const key = `post:content:${post._id}`;
    const redis = getRedisClient();

    const exists = await redis.exists(key);
    updatedPost.user = {
      name: post.user.name,
      pic: post.user.pic,
      userId: post.user.userId,
    };

    if (exists) {
      const cacheKey = `posts:latest:${post.category}`;
      await redis.del(cacheKey);
    }

    return res.status(200).json({
      message: "fetched posts of the user",
      post: updatedPost,
    });
  });
};


let CACHE_TTL = 15
let MAX_POSTS = 8
const cacheAllPosts = async(cacheKey,posts)=>{
  
  try{
const redis = getRedisClient();
  const pipeline = redis.pipeline();

  for (let i = 0; i < posts.length; i++) {
    const post = posts[i];
    let postCacheKey = `cache:post:${post._id.toString()}`
    let postJson = JSON.stringify(post);
    pipeline.hset(postCacheKey,'content',postJson);
    pipeline.zadd(cacheKey,posts.length-i,post._id.toString())

       
    pipeline.expire(postCacheKey, CACHE_TTL);
    
  }

   pipeline.expire(cacheKey, CACHE_TTL);  
  await pipeline.exec();

  }
  catch(err){
    console.log(err.message);
    console.log("Failed to cache posts")
  }
  

}

const getPostsFromCache = async(cacheKey)=>{
  try{
const redis = getRedisClient();
let posts = []
const postIds = await redis.zrevrange(cacheKey,0,MAX_POSTS-1);
 
if (postIds.length === 0) {
     return {
      posts: [],
      hasMore:false,
      nextCursor:null
    };
  }
  const pipeline = redis.pipeline();

  postIds.forEach(postId => {
    pipeline.hmget(`cache:post:${postId}`,'content');

  });

const pipelineResult = await pipeline.exec();
 const postsFiltered = pipelineResult
    .map(([err, reply]) => {
      if (err || !reply || !reply[0]) return null;
      return JSON.parse(reply[0]);
    })
    .filter(Boolean);   

    posts = postsFiltered
    let hasMore = false;
    let nextCursor = null
    

  if(posts.length===MAX_POSTS){
     hasMore = true;
    
  }

  if(hasMore){
    nextCursor = posts[posts.length-1]._id
  }
 
  return {
      posts: posts,
      hasMore,
      nextCursor
    };
  }
  catch(err){
    console.log(err.message)
    return {
      posts: [],
      hasMore:false,
      nextCursor:null
    };
  }

 
}



const getNearestPostFromDB =async(lon,lat,category,limit=MAX_POSTS,cursor,cachekey)=>{

  try{
 
const geoNearStage = {
      $geoNear: {
        near: {
          type: "Point",
          coordinates: [parseFloat(lon), parseFloat(lat)],
        },
        distanceField: "distance",
        spherical: true,
        key: "location",
        query: { category,active: true },
      },
    };

  
    if (cursor && typeof cursor.distance === "number") {
      geoNearStage.$geoNear.minDistance = Number(cursor.distance);
    }

    const stages = [geoNearStage];

    if (cursor && cursor._id && typeof cursor.distance === "number") {
      const lastId = new mongoose.Types.ObjectId(cursor._id);
      const lastDistance = Number(cursor.distance);

      stages.push({
        $match: {
          $or: [
            { distance: { $gt: lastDistance } },                   
            {
              distance: lastDistance,                              
              _id: { $lt: lastId },                                
            },
          ],
        },
      });
    }

    // Full aggregation pipeline
    const posts = await Post.aggregate([
      ...stages,
      { $sort: { distance: 1, _id: -1 } },    
      { $limit: MAX_POSTS + 1 },
      {
        $lookup: {
          localField: "userId",
          foreignField: "userId",
          from: "users",
          as: "user",
        },
      },
      { $unwind: "$user" },

      {
        $project: {
          title: 1,
          content: 1,
          pics: 1,
          category: 1,
          district: 1,
          distance: 1,
          createdAt: 1,
          active: 1,
          "user.name": 1,
          "user.pic": 1,
          "user.userId": 1,
        },
      },
    ]);
 
  
  let hasMore = false;
    let nextCursor = null
    

  if(posts.length===MAX_POSTS+1){
     hasMore = true;
     posts.pop();
    
  }


  if(hasMore){
    nextCursor = posts[posts.length-1]._id
  }

  if(posts.length){
   
      await cacheAllPosts(cachekey,posts);
    }

  return {
      posts: posts,
      hasMore,
      nextCursor
    };

  }
  catch(err){
    console.log(err.message)
    return {
      posts: [],
      hasMore:false,
      nextCursor:null
    };
  }
}

const nearestPosts = async (req, res) => {


  try{

    const { lon,lat, category,cursor=null } = req.body;

  let coordinates = [lon,lat]
  

    // Validation
  if (!coordinates || !Array.isArray(coordinates) || coordinates.length !== 2) {
    return res.status(400).json({
      success: false,
      message: "coordinates must be [longitude, latitude] array in req.body",
    });
  }
  
  const parsedLon = parseFloat(lon);
    const parsedLat = parseFloat(lat);

 
  

  let postData=null;
  let cacheKey = `nearest:${lon}-${lat}:${category}:${cursor}`
  const lockKey = `${cacheKey}:lock`;
  let redis = getRedisClient()
  let cacheExists = await redis.exists(cacheKey)
  if(cacheExists){
   
    postData =  await getPostsFromCache(cacheKey);
    

    console.log("FROM CACHE")
   
  }
  else{
    const lockAcquired = await redis.set(lockKey, "1", "NX", "PX", 15000);
    if(lockAcquired==="OK"){
      try{
           postData = await getNearestPostFromDB(lon,lat,category,MAX_POSTS,cursor,cacheKey)
         console.log("FROM DB")

      }
      catch(err){
        throw err;
      }
      finally {
        await redis.del(lockKey);
      }
  
    }
    else{
       let attempts = 1;
       let max_attempts = 5;
       let wait_time = 200;

       while(attempts<=max_attempts){
          await new Promise((resolve)=>setTimeout(resolve,wait_time));

          if (await redis.exists(cacheKey)) {
          postData = await getPostsFromCache(cacheKey);
          console.log(`FROM CACHE (after wait, attempt ${attempts}),max time ${attempts*wait_time}ms`);
          break;
          }

          attempts++;

       }
       if(!postData){
        throw err;
       }
    }
    
  }
  
  return res.status(200).json({
       message:"Fetched Posts",
      postCount:postData.posts.length,
       ...postData,
      
        
    })


  }
  catch(err){
      return res.status(503).json({
          success: false,
          message: "Please Try Again",
      });
  }
 


//members = await redis.zrange(key, "2450","+inf",  "BYSCORE", "LIMIT", 0, 10,'WITHSCORES')


};


 

module.exports = { createPost, getUserPosts, updatePost,nearestPosts};
