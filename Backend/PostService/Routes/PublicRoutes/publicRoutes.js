const express = require("express");
const { getCategoriesAndDistricts, getLatestPostsByCategory, getPost } = require("../../Controllers/PublicControllers/publicControllers");
 

const publicRoutes = express.Router();

publicRoutes.get("/catsAndDistricts",getCategoriesAndDistricts)
 publicRoutes.post("/getlatestpostsbycategory/:category/:location",getLatestPostsByCategory)
  publicRoutes.post("/getPost",getPost)

module.exports = {publicRoutes}