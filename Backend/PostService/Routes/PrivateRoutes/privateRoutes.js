const express = require("express");
 
const { createPost } = require("../../Controllers/PublicControllers/postController");
const { uploadMultiple } = require("../Upload/Cloudinary");
 

const privateRoutes = express.Router();

privateRoutes.post("/create",uploadMultiple("pics", 5),createPost)


module.exports = {privateRoutes}