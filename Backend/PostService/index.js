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
const { Post } = require("./Models/Post");
const rateLimiter = require("./Configs/rateLimitMiddleware");
 


connectRedis();
connectKafkaProducer();
connectKafkaRegistrationSubscriber()
connectKafkaPostSubscriber()

const frontend_url = process.env.FRONTEND_URL;
const gateway_url = process.env.GATEWAY_SERVICE_URL;
 
const corsOptions = {
  origin:  [frontend_url,gateway_url],
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With"
  ],
};


app.use(cookieParser());
app.use(express.json());


app.use(cors(corsOptions));


const sanitizeData = (obj) => {
  if (typeof obj !== 'object' || obj === null) return obj;

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeData(item));
  }

  return Object.entries(obj).reduce((acc, [key, value]) => {
    // ←←← REJECT instead of just cleaning
    if (/[\$\.]/.test(key)) {
      throw new Error(`Suspicious key detected: ${key}`);
    }

    const sanitizedKey = key; // no need to replace anymore

    if (typeof value === 'object' && value !== null) {
      acc[sanitizedKey] = sanitizeData(value);
    } else {
      acc[sanitizedKey] = value;
    }
    return acc;
  }, {});
};

// Middleware
app.use((req, res, next) => {
  try {
    if (req.query && Object.keys(req.query).length > 0) {
      req.query = sanitizeData(req.query);
    }
    if (req.params && Object.keys(req.params).length > 0) {
      req.params = sanitizeData(req.params);
    }
    if (req.body && typeof req.body === 'object') {
      req.body = sanitizeData(req.body);
    }
    next();
  } catch (err) {
    return res.status(400).json({ 
      success: false, 
      message: 'Invalid characters in request ($ or . not allowed in keys)' 
    });
  }
});

app.use(rateLimiter({capacity:3,refillRate:1}))
 
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




 
 