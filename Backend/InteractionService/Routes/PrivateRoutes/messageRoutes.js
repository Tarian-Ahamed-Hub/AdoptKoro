const express = require("express");
const { sendText, conversationDetails, chatList } = require("../../Controllers/privateControllers/messageController");
 

const messageRoutes = express.Router();

messageRoutes.post("/sendText",sendText)
messageRoutes.post("/getText",conversationDetails)
messageRoutes.get("/chatList",chatList)

module.exports = {messageRoutes};