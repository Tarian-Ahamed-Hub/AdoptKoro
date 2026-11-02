 
const cookie = require('cookie')
const jwt = require('jsonwebtoken');
const Conversation = require('../Models/Conversation');
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
    const { userId, userName } = socket.user;
 
    console.log(`Client connected: ${clientId} on ${process.pid}`);
    socket.join(`room:${userId}`);

     socket.on("join_room", async ({ roomId } = {}) => {
      try {
        if (typeof roomId !== "string" || roomId === userId) return;

        const isMember = await Conversation.exists({
          conversationId: roomId,
          members: userId,
        });
        if (!isMember) {
          console.log(`${userName} (${userId}) denied room ${roomId}`);
          return;
        }
 
        socket.join(`room:${roomId}`);
      } catch (err) {
        console.log("join_room error:", err.message);
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