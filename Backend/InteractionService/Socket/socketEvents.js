
const cookie = require('cookie')
const jwt = require('jsonwebtoken');
const Conversation = require('../Models/Conversation');
const { getKafkaProducer } = require('../Kafka/KafkaProducer');
const { encrypt } = require('../HelperFuncs/GlobalHelper');
const { default: mongoose } = require('mongoose');
const { CompressionTypes } = require('kafkajs');
const { getRedisClient } = require('../Configs/cacheRedis');
 



const CONVO_CACHE_TTL = 180 * 60;
const convoKey = (conversationId) => `convo:${conversationId}:meta`;

const loadConversationFromDB = async (conversationId) => {
  const conversation = await Conversation.findOne(
    { conversationId },
    { conversationName: 1, members: 1 }
  ).lean();
  if (!conversation) return null;

  return {
    conversationName: conversation.conversationName,
    members: conversation.members.map(String),
  };
};

const cacheConversation = async (conversationId, meta) => {
  try {
    let redis = getRedisClient();
    await redis.set(
      convoKey(conversationId),
      JSON.stringify(meta),
      "EX",
      CONVO_CACHE_TTL
    );
  } catch (err) {
    console.log("convo cache write failed:", err.message);
  }
};

// Redis first, DB as fallback (cache miss or Redis down)
const getConversationMeta = async (conversationId) => {
  try {
    const cached = await getRedisClient().get(convoKey(conversationId));
    if (cached) return JSON.parse(cached);
  } catch (err) {
    console.log("convo cache read failed:", err.message);
  }

  const meta = await loadConversationFromDB(conversationId);
  if (meta) await cacheConversation(conversationId, meta);
  return meta;
};

const MAX_TEXT_LENGTH = 2000;

const reply = (ack, payload) => {
  if (typeof ack === "function") ack(payload);
};


const socketMiddleware = (socket, next) => {
  try {
    let token = socket.handshake.auth?.token;

    if (!token) return next(new Error("NO_SESSION"));

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded;

    next();
  } catch (err) {
    next(new Error("INVALID_SESSION"));
  }
};

function setupSocketEvents(io) {

  io.use(socketMiddleware);

  console.log('Setting up Socket.IO event handlers...');

  io.on('connection', (socket) => {
    const clientId = socket.id;
    const { userId, userName, pic } = socket.user;
   

    console.log(`Client connected: ${clientId} on ${process.pid}`);
    socket.join(`room:${userId}`);


    socket.on("join_room", async (payload, ack) => {
      try {
        const roomId = payload?.roomId;
        if (typeof roomId !== "string" || roomId === userId) {
          return reply(ack, { ok: false });
        }

        const meta = await loadConversationFromDB(roomId);
        if (!meta || !meta.members.includes(userId)) {
          return reply(ack, { ok: false });
        }

        await cacheConversation(roomId, meta);
        socket.join(`room:${roomId}`);
        reply(ack, { ok: true });
      } catch (err) {
        console.log("join_room error:", err.message);
        reply(ack, { ok: false });
      }
    });

    socket.on("send_text", async (payload, ack) => {
      try {
        const conversationId = payload?.conversationId;
        const text = typeof payload?.text === "string" ? payload.text.trim() : "";

        if (!text || text.length > MAX_TEXT_LENGTH) {
          return reply(ack, { ok: false, message: "Invalid message" });
        }

        if (!socket.rooms.has(`room:${conversationId}`)) {
          return reply(ack, { ok: false, message: "Join the conversation first" });
        }

        const meta = await getConversationMeta(conversationId);
        if (!meta || !meta.members.includes(userId)) {
          return reply(ack, { ok: false, message: "Join the conversation first" });
        }

        const { conversationName, members } = meta;
        const createdAt = new Date();

        const chatData = {
          _id: new mongoose.Types.ObjectId().toString(),
          conversationId,
          conversationName,
          userId,
          name: userName,
          pic,
          text,
          createdAt,
          seen: false,
        };

        const { iv, encryptedContent } = encrypt(text);
        await getKafkaProducer().send({
          topic: "chat",
          compression: CompressionTypes.GZIP,
          messages: [
            {
              key: "key",
              value: JSON.stringify({ ...chatData, iv, text: encryptedContent }),
            },
          ],
        });

        const chatListUpdate = {
          conversationId,
          conversationName,
          lastMessage: { userId, name: userName, pic, text, createdAt, seen: false },
        };

        members.forEach((memberId) => {
          io.to(`room:${memberId}`).emit("receive_text", chatListUpdate);
        });
        io.to(`room:${conversationId}`).emit("receive_text_convo", chatData);

        reply(ack, { ok: true });
      } catch (err) {
        console.log("send_text error:", err.message);
        reply(ack, { ok: false, message: "Failed to send message" });
      }
    });

    socket.on("leave_room", (roomId) => {
      socket.leave(`room:${roomId}`);
      console.log(`${socket.id} left ${roomId}`);
    });

    socket.on("disconnect", () => {
      console.log("user left : ", socket.id);

    });

  });

  console.log('Socket.IO event handlers ready');
}

module.exports = { setupSocketEvents };
//[prod]