const express = require("express");
const {  signInWithGoogle } = require("../../Controllers/PublicControllers/userController");

const publicRoute = express.Router();

publicRoute.get("/signInWithGoogle",signInWithGoogle)

module.exports = {publicRoute}