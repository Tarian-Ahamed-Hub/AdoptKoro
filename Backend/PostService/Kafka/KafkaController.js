 
 
const { getRedisClient } = require("../Configs/cacheRedis");
const { Post } = require("../Models/Post");
 
const User = require("../Models/User")

const addUsers = async(users)=>{

     try{
        const operations = users.map((user)=>(
      { 
        updateOne:{
            filter:{email:user.email},
            update:{
                $setOnInsert:{
                    userId:user.userId,
                    name:user.name,
                    pic:user.pic,
                    address:user.address,
                    roles:user.roles,
                    email:user.email,
                    phone:user.phone,
                    verified:user.verified,
                }
            },
            upsert:true
       }
     }
     )
    )

    const result = await User.bulkWrite(operations);
    console.log(users.length," Users added to post service")
    }
    catch(err){
        console.log("Failed to add Users to post service ",err.message)
    }
    

}

const deleteZSet = async(keys)=> {
  try {
    const redis = getRedisClient();
    const deletedKeys = await redis.del(keys);
    console.log(`Erased Cache of ${deletedKeys} keys`);  
  } catch (err) {
    console.error('Redis error while deleting key :', err);
  }
}

const addPosts = async(posts)=>{

    try{
         const categorySet = new Set();
         for (let i = 0; i < posts.length; i++) {
            categorySet.add(posts[i]["category"])
         }
          let keys = []
         for (const category of categorySet) {
              let key = `posts:latest:${category}`
              keys.push(key)
        }

         await Post.insertMany(posts);
         console.log("Added Batch of posts to db")

         if(keys.length)
         await deleteZSet(keys);
    }
    catch(err){
         console.log("Error in kafka Controller ",err.message)
    }

}

module.exports ={addUsers,addPosts}