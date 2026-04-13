const express = require("express");
const { getCategoriesAndDistricts, getLatestPostsByCategory, getPost } = require("../../Controllers/PublicControllers/publicControllers");
const { nearestPosts } = require("../../Controllers/PublicControllers/postController");
 

const publicRoutes = express.Router();

publicRoutes.get("/catsAndDistricts",getCategoriesAndDistricts)
publicRoutes.post("/getlatestpostsbycategory/:category/:location",getLatestPostsByCategory)
publicRoutes.post("/getPost",getPost)
publicRoutes.post("/getNearestPosts",nearestPosts)
 

module.exports = {publicRoutes}