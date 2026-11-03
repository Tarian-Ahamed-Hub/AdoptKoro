const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");
const axios = require("axios");
const { CompressionTypes } = require("kafkajs");

const Conversation = require("../../Models/Conversation");
const Chat = require("../../Models/Chat");
const { getSocketIo } = require("../../Socket/initSocket");
const { dbHandler } = require("../../../PostService/HelperFuncs/dbHelper");
const { checkStatus, getKafkaProducer } = require("../../Kafka/KafkaProducer");
const { encrypt, decrypt } = require("../../HelperFuncs/GlobalHelper");

const MESSAGES_PAGE_SIZE = 10;

const decryptMessage = (message) => ({
  ...message,
  text: decrypt(message.iv, message.text),
});

const fetchPost = async (postId) => {
  const response = await axios.post(
    `${process.env.GATEWAY_SERVICE_URL}/api/post/public/getPost`,
    { postId },
    { headers: { "Content-Type": "application/json" } }
  );
  return response.data.post;
};



const chatList = (req, res) => {
  dbHandler(res, async () => {
    const { userId } = req.user;

    const chats = await Conversation.aggregate([
      { $match: { members: new mongoose.Types.ObjectId(userId) } },
      {
        $lookup: {
          from: "chats",
          let: { conversationId: "$conversationId" },
          pipeline: [
            { $match: { $expr: { $eq: ["$conversationId", "$$conversationId"] } } },
            { $sort: { createdAt: -1 } },
            { $limit: 1 },
            {
              $project: {
                _id: 0,
                name: 1,
                text: 1,
                pic: 1,
                userId: 1,
                createdAt: 1,
                seen: 1,
                iv: 1,
              },
            },
          ],
          as: "lastMessage",
        },
      },
      { $unwind: { path: "$lastMessage", preserveNullAndEmptyArrays: true } },
      { $sort: { "lastMessage.createdAt": -1 } },
      { $project: { conversationId: 1, conversationName: 1, lastMessage: 1 } },
    ]);

    const decryptedChats = chats.map((chat) =>
      chat.lastMessage
        ? { ...chat, lastMessage: decryptMessage(chat.lastMessage) }
        : chat
    );

    return res.status(200).json({
      chatList: decryptedChats,
      message: "fetched message",
    });
  });
};

const conversationDetails = (req, res) => {
  dbHandler(res, async () => {
    const { conversationId, cursor = null } = req.body;
    const { userId } = req.user;

    const conversation = await Conversation.findOne({
      members: userId,
      conversationId,
    });
    if (!conversation) {
      return res.status(400).json({
        message: "You dont have access to this conversation",
      });
    }

    const query = { conversationId };
    if (cursor) {
      query._id = { $lt: cursor };
    }

    const fetchedChats = await Chat.find(query)
      .sort({ _id: -1 })
      .limit(MESSAGES_PAGE_SIZE + 1)
      .lean();

    const hasMore = fetchedChats.length > MESSAGES_PAGE_SIZE;
    const pageChats = fetchedChats.slice(0, MESSAGES_PAGE_SIZE).reverse();
    const nextCursor = hasMore ? pageChats[0]._id : null;
    
    if(cursor===null){
      const { modifiedCount } = await Chat.updateMany(
      { conversationId, userId: { $ne: userId }, seen: false },
      { $set: { seen: true } }
    );
    }
    

    return res.status(200).json({
      conversationDetails: conversation,
      chats: pageChats.map(decryptMessage),
      message: "fetched message",
      cursor: nextCursor,
      hasMore,
    });
  });
};


const getUnseenCount = (req, res) => {
  dbHandler(res, async () => {
    const { userId } = req.user;

    const [result] = await Conversation.aggregate([
      { $match: { members: new mongoose.Types.ObjectId(userId) } },
      {
        $lookup: {
          from: "chats",
          let: { conversationId: "$conversationId" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$conversationId", "$$conversationId"] },
                    { $eq: ["$seen", false] },
                    { $ne: ["$userId", new mongoose.Types.ObjectId(userId)] },
                  ],
                },
              },
            },
            { $project: { _id: 1 } },
          ],
          as: "unseenChats",
        },
      },
      { $group: { 
        _id: null, 
        totalUnseen: { $sum: { $size: "$unseenChats" } } } },
    ]);

    return res.status(200).json({
      message: "Got unseen count",
      unseenCount: result?.totalUnseen ?? 0,
    });
  });
};

const addChat = async (chats) => {
   
  const operations = chats.map((chat) => ({ insertOne: { document: chat } }));
  await Chat.bulkWrite(operations);
};

module.exports = {  conversationDetails, chatList, getUnseenCount, addChat };