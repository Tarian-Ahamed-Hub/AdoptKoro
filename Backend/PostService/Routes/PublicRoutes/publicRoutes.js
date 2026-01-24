const express = require("express");
const { getCategoriesAndDistricts, getLatestPostsByCategory } = require("../../Controllers/PublicControllers/publicControllers");
 

const publicRoutes = express.Router();

publicRoutes.get("/catsAndDistricts",getCategoriesAndDistricts)
 publicRoutes.post("/getlatestpostsbycategory/:category",getLatestPostsByCategory)

module.exports = {publicRoutes}