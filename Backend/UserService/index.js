require("dotenv").config();
const express = require("express");
const cookieParser = require('cookie-parser');


const app = express();
app.use(cookieParser());
app.use(express.json());

const {connect} = require("./Configs/db")
const cors = require('cors');
const { publicRoute } = require("./Routes/PublicRoutes/userRoutes");
const http = require("http")


const {connectRedis,shutdownRedis} = require("./Configs/cacheRedis")
connectRedis();

app.use(cors({
  origin: "http://localhost:5173",  
  credentials: true,                
}));
 
app.use("/",publicRoute)
 
const port= process.env.USER_SERVICE_PORT;

const appServer = http.createServer(app)
appServer.listen(port,()=>{
    console.log("User-service running on port ",port);
})


const shutdownServices = async(signal)=>{
  console.log(`Received ${signal}. Shutting down services`);
   await shutdownRedis();
   process.exit(0);
}

process.on("SIGINT",shutdownServices)
process.on("SIGTERM", shutdownServices);
 