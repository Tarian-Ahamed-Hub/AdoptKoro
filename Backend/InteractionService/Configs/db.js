const mongoose = require("mongoose");
const db_url = process.env.DB_URL;

const connect = async()=>{
    try{
         await mongoose.connect(process.env.DB_URL,{
        
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            family: 4
         })
        
   

    }
    catch(err){
        console.error(`DB Connection Error:`, err.message);
    }
}

connect();


mongoose.connection.on("connected", () => {
    console.log(`Database connected`);
});

mongoose.connection.on("error", (err) => {
    console.error(`Mongoose error:`);
});

mongoose.connection.on("disconnected", () => {
    console.warn(`Mongoose disconnected`);
});

module.exports = {connect}
