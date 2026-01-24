require("dotenv").config();
const express = require("express");
const cookieParser = require('cookie-parser');


const app = express();


const {connect} = require("./Configs/db")
const cors = require('cors');
 
const http = require("http")


const {connectRedis,shutdownRedis} = require("./Configs/cacheRedis");
const { privateRoutes } = require("./Routes/PrivateRoutes/privateRoutes");
const { getKafkaProducer, connectKafkaProducer } = require("./Kafka/KafkaProducer");
const userMiddleware = require("./Middlewares/userMiddlewares");
const { connectKafkaRegistrationSubscriber } = require("./Kafka/KafkaRegistrationConsumer");
const { publicRoutes } = require("./Routes/PublicRoutes/publicRoutes");
const { connectKafkaPostSubscriber } = require("./Kafka/KafkaPostConsumer");
 
connectRedis();
connectKafkaProducer();
connectKafkaRegistrationSubscriber()
connectKafkaPostSubscriber()

const corsOptions = {
  origin: [
    "http://localhost:5173",
    "http://localhost:8000",
    "http://localhost:8002"
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With"
  ],
};

app.use(cors(corsOptions));

app.use(cookieParser());
app.use(express.json());
 
app.use("/private",userMiddleware,privateRoutes)

app.use("/public",publicRoutes)
 
const port= process.env.POST_SERVICE_PORT;

const appServer = http.createServer(app)
appServer.listen(port,()=>{
    console.log("Post-service running on port ",port);
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
 