const express = require("express");
const {  signInWithGoogle, logout, authenticateUser, registerInitiate, registerVerify, loginInitiate, loginVerify, forgotPasswordInitiate, forgotPasswordVerifyOTP, resetPassword } = require("../../Controllers/PublicControllers/userController");

const publicRoute = express.Router();

publicRoute.get("/signInWithGoogle",signInWithGoogle)
publicRoute.get("/logout",logout)
publicRoute.post("/authenticate",authenticateUser)
publicRoute.post("/register-initiate",registerInitiate);
publicRoute.post("/register-verify",registerVerify);
publicRoute.post("/login-initiate",loginInitiate);
 publicRoute.post("/login-verify",loginVerify);
 publicRoute.post("/forgot-password-initiate",forgotPasswordInitiate);
 publicRoute.post("/forgot-password-verify-otp",forgotPasswordVerifyOTP);
 publicRoute.post("/reset-password",resetPassword);
 

module.exports = {publicRoute}