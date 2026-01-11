require("dotenv").config();
const express = require("express");

const app = express();

const {connect} = require("./Configs/db")
const cors = require('cors');
const { publicRoute } = require("./Routes/PublicRoutes/userRoutes");
const http = require("http")


app.use(cors({
  origin: "http://localhost:5173",  
  credentials: true,                
}));
 
app.use("/auth",publicRoute)
 
const port= process.env.USER_SERVICE_PORT;

const appServer = http.createServer(app)
appServer.listen(port,()=>{
    console.log("User-service running on port ",port);
})


 