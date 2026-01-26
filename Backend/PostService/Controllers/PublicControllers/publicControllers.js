const { default: mongoose } = require("mongoose");
const { getRedisClient } = require("../../Configs/cacheRedis");
const { dbHandler } = require("../../HelperFuncs/dbHelper")
const { Category } = require("../../Models/Category");
const District = require("../../Models/District");
const { Post } = require("../../Models/Post");



const CACHE_SIZE = 200;  
const LOCK_TTL = 15;  
const CACHE_TTL = 30 * 60;  
const PAGE_LIMIT = 20; 


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
const readLatestPostCache = async(redis,cacheKey,startScore)=>{
   
   const result = await redis.zrevrangebyscore(
      cacheKey,
      startScore,
      '-inf',
      'LIMIT',0,PAGE_LIMIT+1
   )
   return result;
}

const readPostsContentCache = async(cacheKey,startScore)=>{
   const redis = getRedisClient()
   const ids = await readLatestPostCache(redis,cacheKey,startScore)
 
   const redisPipeline = redis.pipeline();

   ids.forEach(id => {
        redisPipeline.hmget(`post:content:${id}`,'content')
      });

   const result = await redisPipeline.exec()

   let rawContents = result.map(([err,content])=>{
       if(err||!content[0]){
         return null;
       }
       else
         return JSON.parse(content[0])
   }).filter(Boolean)
   let cacheCursor = null;
   let dbCursor = null;

   if(rawContents.length>PAGE_LIMIT){
       cacheCursor = rawContents[rawContents.length-1]._id;
        rawContents.pop();
   }
   if(rawContents.length)
   dbCursor = rawContents[rawContents.length-1]._id;

   return {posts:rawContents,cacheCursor,dbCursor};

}
const getPostsFromDbWithCursor = async(cursor,category)=>{
   const posts = await Post.aggregate([
  { $match: { category, _id: { $lt: new mongoose.Types.ObjectId(cursor) } } },
  { $sort: { _id: -1 } },
  { $limit: PAGE_LIMIT + 1 },
  {
    $lookup: {
      from: "users",
      localField: "userId",
      foreignField: "userId",
      as: "user",
    },
  },
  {
    $unwind: {
      path: "$user",
      preserveNullAndEmptyArrays: true
    }
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
      "user.userId": 1
    },
  },
]);

    let cacheCursor = null;
    let dbCursor = null;
    
    if(posts.length>PAGE_LIMIT){
       dbCursor = posts[posts.length-2]._id;
       posts.pop()

    }
    return {posts:posts,cacheCursor,dbCursor}

}
const cacheLatestPosts = async(cachekey,category)=>{
   //  const posts =  await Post.find({category})
   //  .sort({ _id: -1 })
   //  .limit(CACHE_SIZE)

   const posts = await Post.aggregate([
    { 
      $match: { category } 
    },
    { 
      $sort: { _id: -1 } 
    },
    { 
      $limit: CACHE_SIZE 
    },
    {
      $lookup: {
        from: "users",      
        localField: "userId",  
        foreignField: "userId", 
        as: "user",
      },
    },
  
  
    {
      $unwind: {
        path: "$user",
        preserveNullAndEmptyArrays: true 
      }
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
        "user.userId":1
      },
    },
  ]);
   
     
    
    
    if(posts.length){
       const redisCache = getRedisClient()
       const redisPipeline = redisCache.pipeline();
       posts.forEach((post)=>{
         const score = BigInt(`0x${post._id.toString()}`).toString();
         const member = post._id.toString();
         redisPipeline.zadd(cachekey,score,member);
         redisPipeline.hmset(`post:content:${post._id}`,'content',JSON.stringify(post))
         redisPipeline.expire(`post:content:${post._id}`,CACHE_TTL)  
      })
      redisPipeline.expire(cachekey,CACHE_TTL);
       await redisPipeline.exec();

      return 1;
    }
    return 0;
   


}
const getLatestPostsByCategory = async(req,res)=>{

   try{
    


    const {category} = req.params;
    const {currentCacheCursor,currentDbCursor} = req.body;
    let startScore = currentCacheCursor;
    if(startScore!=="+inf" && startScore){
       startScore = BigInt(`0x${currentCacheCursor.toString()}`).toString();
   }
    
    const cacheKey = `posts:latest:${category}`;
    const redis = getRedisClient();
    const CacheExists = await redis.exists(cacheKey)

    let res_posts = [];
    let res_cacheCursor = null;
    let res_dbCursor = null;
    
    //hit cache
    if(CacheExists){//if cache exists
      console.log("Cache exists ")
      if(currentCacheCursor!==null){//if cache not exhausted
         console.log("Cache not exausted ")
         const cacheResponse = await readPostsContentCache(cacheKey,startScore);
          res_posts = cacheResponse.posts;
          res_cacheCursor = cacheResponse.cacheCursor;
          res_dbCursor = cacheResponse.dbCursor
      }
      else{//cache exausted, hit db
         console.log("Cache  exausted ")
         if(currentDbCursor!==null) {//db posts not exausted
            console.log("DB not exausted ")
           const dbPostsResponse = await getPostsFromDbWithCursor(currentDbCursor,category)
           res_posts = dbPostsResponse.posts;
           res_cacheCursor = dbPostsResponse.cacheCursor;
           res_dbCursor = dbPostsResponse.dbCursor
         }
      }
      
    }
    else{//cache doesnt exist
      console.log("Cache doesnt exist ")
      if(currentCacheCursor==="+inf"){//if fist page build cache
          console.log("first page buildin cache ")
       const built = await cacheLatestPosts(cacheKey,category);
       if(built){
          console.log("cache built getting from cache ")
         const cacheResponse = await readPostsContentCache(cacheKey,startScore);
          res_posts = cacheResponse.posts;
          res_cacheCursor = cacheResponse.cacheCursor;
          res_dbCursor = cacheResponse.dbCursor
       }
       else{
          console.log("No post found.cache wasnt built ")
       }
      }
      else{//hit db
          console.log("not first page and no cache. DB is hit ")
           const dbPostsResponse = await getPostsFromDbWithCursor(currentDbCursor,category)
           res_posts = dbPostsResponse.posts;
           res_cacheCursor = dbPostsResponse.cacheCursor;
           res_dbCursor = dbPostsResponse.dbCursor
        
      }


      
      
         
    }
    return res.status(200).json({
       message:"Got posts",
       posts:res_posts ,
       currentCacheCursor:res_cacheCursor,
       currentDbCursor:res_dbCursor 
    })

}
catch(err){
   return res.status(404).json({
       message:`Error ${err.message}`,
      
    })

}
     


}

const getPost = async(req,res)=>{
  // try{
  
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
   
  // }
  // catch(err){
  //    return res.status(500).json({
  //      message:err.message
  //    })
  // }
   
}
module.exports = {getCategoriesAndDistricts,getLatestPostsByCategory,getPost}
