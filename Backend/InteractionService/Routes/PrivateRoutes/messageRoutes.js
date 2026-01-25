const express = require("express");
const { sendText } = require("../../Controllers/privateControllers/messageController");
 

const messageRoutes = express.Router();

messageRoutes.post("/sendText",sendText)

module.exports = {messageRoutes};