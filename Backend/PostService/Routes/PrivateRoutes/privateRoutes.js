const express = require("express");
 
const { createPost, getUserPosts, updatePost } = require("../../Controllers/PublicControllers/postController");
const { uploadMultiple } = require("../Upload/Cloudinary");
 

const privateRoutes = express.Router();

privateRoutes.post("/create",uploadMultiple("pics", 5),createPost)
privateRoutes.get("/getUserPosts",getUserPosts)
privateRoutes.post("/updatePost",updatePost)


module.exports = {privateRoutes}