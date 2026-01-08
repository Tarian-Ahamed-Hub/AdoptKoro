require("dotenv").config();
const express = require("express");

const app = express();

const {connect} = require("./Configs/db")
const cors = require('cors');
const { publicRoute } = require("./Routes/PublicRoutes/userRoutes");


app.use(cors({
  origin: "http://localhost:5173",  
  credentials: true,                
}));

app.use("/auth",publicRoute)
 

app.listen(process.env.USER_SERVICE_PORT,()=>{
    console.log("User service running on port ",process.env.USER_SERVICE_PORT);
})