// server.js (or your main entry point)
require("dotenv").config();
const express = require("express");
const http = require("http");
const cookieParser = require('cookie-parser');
const cors = require('cors');
const { connect } = require("./Configs/db");
const { connectRedis, shutdownRedis } = require("./Configs/cacheRedis");
const { getKafkaProducer, connectKafkaProducer } = require("./Kafka/KafkaProducer");
const { connectKafkaRegistrationSubscriber } = require("./Kafka/KafkaRegistrationConsumer");
const { connectKafkaChatSubscriber } = require("./Kafka/KafkaChatConsumer");
const { initSocketIO } = require("./Socket/initSocket");
const userMiddleware = require("./Middlewares/userMiddlewares");
const { messageRoutes } = require("./Routes/PrivateRoutes/messageRoutes");

const app = express();
const port = process.env.INTERACTION_SERVICE_PORT || 3000;

// Middleware
app.use(cors({
  origin: [process.env.FRONTEND_URL, process.env.GATEWAY_SERVICE_URL],
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
}));
app.use(cookieParser());
app.use(express.json());


app.use("/message", userMiddleware, messageRoutes);


app.get("/test", async (req, res) => {
  
  return res.status(200).json({
    message: "Interaction service running",
    pod: process.env.HOSTNAME || "local" + process.pid,

  });
});


const httpServer = http.createServer(app);


const startServer = async () => {
  try {
  
    const io = await initSocketIO(httpServer);
    

    await connect();
    connectRedis();
    await connectKafkaProducer();
    await connectKafkaRegistrationSubscriber();
    await connectKafkaChatSubscriber();
    
    httpServer.listen(port, () => {
      console.log(`Server running on port ${port}`);
      console.log(`Pod: ${process.env.HOSTNAME || "local"}`);
      console.log(`Socket.IO ready with Redis adapter`);
    });
    
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

// Graceful shutdown
const shutdownServices = async () => {
  console.log("Shutting down gracefully...");
  
 
  if (httpServer) {
    httpServer.close(() => {
      console.log("HTTP server closed");
    });
  }
  
  // Disconnect Kafka
  try {
    await getKafkaProducer().disconnect();
    console.log("Kafka disconnected");
  } catch (err) {
    console.error("Error disconnecting Kafka:", err);
  }
  
 
  try {
    await shutdownRedis();
    console.log("Redis disconnected");
  } catch (err) {
    console.error("Error disconnecting Redis:", err);
  }
  
  process.exit(0);
};

process.on("SIGINT", shutdownServices);
process.on("SIGTERM", shutdownServices);

// Start the server
startServer();