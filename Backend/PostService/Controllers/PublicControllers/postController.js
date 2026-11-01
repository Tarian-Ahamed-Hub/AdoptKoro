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


let CACHE_TTL = 30
let MAX_POSTS = 8


const cacheAllPosts = async (cacheKey, data) => {
  try {
    const { posts, hasMore, nextCursor } = data;
    const pipeline = getRedisClient().pipeline();

    posts.forEach((post, i) => {
      const id = post._id.toString();
      const postKey = `cache:post:${id}`;
      pipeline.hset(postKey, "content", JSON.stringify(post));
      pipeline.expire(postKey, CACHE_TTL);
      pipeline.zadd(cacheKey, posts.length - i, id);
    });

    if (posts.length) pipeline.expire(cacheKey, CACHE_TTL);
    pipeline.set(`${cacheKey}:meta`, JSON.stringify({ hasMore, nextCursor }), "EX", CACHE_TTL);

    await pipeline.exec();
  } catch (err) {
    console.log("Failed to cache posts:", err.message);
  }
};


const getPostsFromCache = async (cacheKey) => {
  try {
    const redis = getRedisClient();
    const [metaRaw, postIds] = await Promise.all([
      redis.get(`${cacheKey}:meta`),
      redis.zrevrange(cacheKey, 0, MAX_POSTS - 1),
    ]);
    if (!metaRaw) return null;

    const meta = JSON.parse(metaRaw);
    if (!postIds.length) return { posts: [], ...meta };

    const pipeline = redis.pipeline();
    postIds.forEach((id) => pipeline.hget(`cache:post:${id}`, "content"));
    const results = await pipeline.exec();

    const posts = results.map(([err, reply]) => (err || !reply ? null : JSON.parse(reply)));
    if (posts.some((p) => !p)) return null;

    return { posts, ...meta };
  } catch (err) {
    console.log("cache read failed:", err.message);
    return null;
  }
};

const getNearestPostFromDB = async (lon, lat, category, limit, cursor, cacheKey) => {
  const geoNearStage = {
    $geoNear: {
      near: { type: "Point", coordinates: [parseFloat(lon), parseFloat(lat)] },
      distanceField: "distance",
      spherical: true,
      key: "location",
      query: { category, active: true },
    },
  };

  const stages = [geoNearStage];

  if (cursor && cursor._id && typeof cursor.distance === "number") {
    const lastId = new mongoose.Types.ObjectId(cursor._id);
    const lastDistance = Number(cursor.distance);

    geoNearStage.$geoNear.minDistance = lastDistance;
    stages.push({
      $match: {
        $or: [
          { distance: { $gt: lastDistance } },
          { distance: lastDistance, _id: { $lt: lastId } },
        ],
      },
    });
  }

  const posts = await Post.aggregate([
    ...stages,
    { $sort: { distance: 1, _id: -1 } },
    { $limit: limit + 1 },
    {
      $lookup: { localField: "userId", foreignField: "userId", from: "users", as: "user" },
    },
    { $unwind: "$user" },
    {
      $project: {
        title: 1, content: 1, pics: 1, category: 1, district: 1,
        distance: 1, createdAt: 1, active: 1,
        "user.name": 1, "user.pic": 1, "user.userId": 1,
      },
    },
  ]);

  const hasMore = posts.length === limit + 1;
  if (hasMore) posts.pop();
  
  let last;
  if(posts.length>0 && hasMore)
  last = posts[posts.length - 1];

  const data = {
    posts,
    hasMore,
    nextCursor: hasMore ? { _id: last._id, distance: last.distance } : null,
  };

  await cacheAllPosts(cacheKey, data); 
  return data;
};

const nearestPosts = async (req, res) => {
  try {
    const { lon, lat, category, cursor = null } = req.body;

    const cursorKey = cursor ? `${cursor.distance}:${cursor._id}` : "first";
    const cacheKey = `nearest:${lon}-${lat}:${category}:${cursorKey}`;
    const lockKey = `${cacheKey}:lock`;

    let postData = await getPostsFromCache(cacheKey);

    if (postData) {
      console.log("FROM CACHE");
    } else {
      const redis = getRedisClient();

      let locked = false;
      let redisUp = true;
      try {
        locked = (await redis.set(lockKey, "1", "NX", "PX", 15000)) === "OK";
      } catch (err) {
        redisUp = false;
        console.log("lock failed, going straight to DB:", err.message);
      }

      if (locked || !redisUp) {
        try {
          postData = await getNearestPostFromDB(lon, lat, category, MAX_POSTS, cursor, cacheKey);
          console.log("FROM DB");
        } finally {
          if (locked) await redis.del(lockKey).catch(() => {});
        }
      } else {
        for (let attempt = 1; attempt <= 5 && !postData; attempt++) {
          await new Promise((resolve) => setTimeout(resolve, 200));
          postData = await getPostsFromCache(cacheKey);
          if (postData) console.log(`FROM CACHE (after wait, attempt ${attempt})`);
        }

      
        if (!postData) {
          postData = await getNearestPostFromDB(lon, lat, category, MAX_POSTS, cursor, cacheKey);
          console.log("FROM DB (after wait)");
        }
      }
    }

    return res.status(200).json({
      message: "Fetched Posts",
      postCount: postData.posts.length,
      ...postData,
    });
  } catch (err) {
    console.log("nearestPosts failed:", err.message);
    return res.status(503).json({ success: false, message: "Please Try Again" });
  }
};


 

module.exports = { createPost, getUserPosts, updatePost,nearestPosts};
