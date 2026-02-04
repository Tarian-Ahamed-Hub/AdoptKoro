require("dotenv").config();
const express = require("express");
const cookieParser = require('cookie-parser');


const app = express();


const {connect} = require("./Configs/db")
const cors = require('cors');
 
const http = require("http")


const {connectRedis,shutdownRedis} = require("./Configs/cacheRedis");
 
const { getKafkaProducer, connectKafkaProducer } = require("./Kafka/KafkaProducer");
 
const { connectKafkaRegistrationSubscriber } = require("./Kafka/KafkaRegistrationConsumer");
const { initSocketIO } = require("./Socket/initSocket");
const userMiddleware = require("./Middlewares/userMiddlewares");
const { messageRoutes } = require("./Routes/PrivateRoutes/messageRoutes");
 
 
connectRedis();
connectKafkaProducer();
connectKafkaRegistrationSubscriber()
// connectKafkaPostSubscriber()
const frontend_url = process.env.FRONTEND_URL;
const gateway_url = process.env.GATEWAY_SERVICE_URL;
const corsOptions = {
  origin: [frontend_url,gateway_url ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With"
  ],
};

app.use(cors(corsOptions))
app.use(cookieParser());
app.use(express.json());
 
app.use("/message",userMiddleware,messageRoutes)

app.get("/test",async(req,res)=>{
  return res.status(200).json({
    message:"Interaction sevice running"
  })
})


 
const port= process.env.INTERACTION_SERVICE_PORT;

const appServer = http.createServer(app);
initSocketIO(appServer)

appServer.listen(port,()=>{
    console.log("Interactin-service running on port ",port);
})


const shutdownServices = async(signal)=>{
  console.log(`Received ${signal}. Shutting down services`);
  const kafkaproducer = getKafkaProducer();
  await kafkaproducer.disconnect()
  console.log("Producer disconnected")
  await shutdownRedis();
  console.log("Redis disconnected")
   process.exit(0);
}

process.on("SIGINT",shutdownServices)
process.on("SIGTERM", shutdownServices);
 