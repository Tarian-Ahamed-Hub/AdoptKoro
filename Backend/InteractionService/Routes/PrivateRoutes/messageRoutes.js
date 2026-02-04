const express = require("express");
const { sendText, conversationDetails, chatList, getUnseenCount } = require("../../Controllers/privateControllers/messageController");
 

const messageRoutes = express.Router();

messageRoutes.post("/sendText",sendText)
messageRoutes.post("/getText",conversationDetails)
messageRoutes.get("/chatList",chatList)
messageRoutes.get("/messageCount",getUnseenCount)

module.exports = {messageRoutes};