 
const cookie = require('cookie')
const jwt = require('jsonwebtoken')
const socketMiddleware = (socket, next) => {
  try {
    const cookieHeader = socket.handshake.headers.cookie;
    if (!cookieHeader) return next(new Error("NO_COOKIE"));

    const cookies = cookie.parse(cookieHeader);
    const token = cookies.sessionToken;

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
 
    console.log(`Client connected: ${clientId}`);

    socket.on("join_room",(data)=>{
       socket.join(`room:${data.roomId}`)
       console.log(socket.user.userName,`(${socket.user.userId})`," joined room ",data.roomId)
    })
    
  });
  
  console.log('Socket.IO event handlers ready');
}

module.exports = { setupSocketEvents };