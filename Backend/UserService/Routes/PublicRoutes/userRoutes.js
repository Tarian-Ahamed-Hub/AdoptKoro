const express = require("express");
const {  signInWithGoogle, logout, authenticateUser } = require("../../Controllers/PublicControllers/userController");

const publicRoute = express.Router();

publicRoute.get("/signInWithGoogle",signInWithGoogle)
publicRoute.get("/logout",logout)
publicRoute.post("/authenticate",authenticateUser)

module.exports = {publicRoute}