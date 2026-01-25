  const { createAdapter } = require('@socket.io/redis-adapter');
const { Redis } = require('ioredis');
const { Server } = require('socket.io');
const { setupSocketEvents } = require('./socketEvents');

let io;

const initSocketIO = async (httpServer) => {
 

  const socketRedisUrl = process.env.REDIS_SOCKET_URL;

  if (socketRedisUrl) {
    try {
      const pubClient = new Redis(socketRedisUrl);
      const subClient = new Redis(socketRedisUrl);
      await Promise.all([pubClient.ping(), subClient.ping()]);
      io = new Server(httpServer, { cors: { origin: "*", methods: ["GET", "POST"],credentials: true, }, adapter: createAdapter(pubClient, subClient) });
      console.log(`Socket connected with Redis}`);
      setupSocketEvents(io);
   
    } catch (err) {
      console.warn('Socket.IO No Redis', err.message);
      io = new Server(httpServer, { cors: { origin: "*", methods: ["GET", "POST"] } });
    }
  } else {
    console.log('Socket.IO No Redis');
    io = new Server(httpServer, { cors: { origin: "*", methods: ["GET", "POST"] } });
  }
  

};

const getSocketIo = ()=>{
    return io;
}

module.exports = { initSocketIO,getSocketIo };