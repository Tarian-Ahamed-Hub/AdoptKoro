// initSocket.js
const { Server } = require('socket.io');
const { setupSocketEvents } = require('./socketEvents');

let io;

const initSocketIO = async (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ["websocket"],
  });

  const redisUrl = process.env.REDIS_SOCKET_URL;

  if (redisUrl) {
    try {
      const { Redis } = require("ioredis");
      const { createAdapter } = require("@socket.io/redis-adapter");

      const pubClient = new Redis(redisUrl);
      const subClient = pubClient.duplicate();
      
      // await Promise.all([pubClient.connect(), subClient.connect()]);

      // Only Redis adapter needed for cross-pod communication
      io.adapter(createAdapter(pubClient, subClient));

      console.log(
      "Redis adapter active:",
      typeof io.of("/").adapter?.constructor?.name
    );
    } catch (err) {
      console.error(`Redis adapter failed: ${err.message}`);
      // Don't exit - fallback to single pod mode
      console.warn("Running without Redis adapter - cross-pod communication disabled");
    }
  } else {
    console.log("Socket.IO: Running without Redis adapter (single pod mode)");
  }

  setupSocketEvents(io);
  return io;
};

const getSocketIo = () => io;

module.exports = { initSocketIO, getSocketIo };