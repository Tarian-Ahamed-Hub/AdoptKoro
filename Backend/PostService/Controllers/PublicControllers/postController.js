const axios = require("axios");
 
 
const  mongoose = require("mongoose");
const { getKafkaProducer } = require("../../Kafka/KafkaProducer");
const { CompressionTypes } = require("kafkajs");
const { Category } = require("../../Models/Category");
const District = require("../../Models/District");


const createPost = async(req,res)=>{

  let {district,category,title,content} = req.body;
    district = JSON.parse(district);

     const images = req.files?.map(file => file.path) || [];
    
    const postObject = {
      title,
      content,
      location:{
        type:"Point",
        coordinates:district.coordinate
      },
      category,
      district:district.district,
      userId:req.user.userId,
      pics:images

    }

   

   const producer = getKafkaProducer();
   await producer.send({
     topic:"posts",
     compression:CompressionTypes.GZIP,
     messages:[
        {
          key:"id",
          value:JSON.stringify(postObject)
        }
     ]
   })
   console.log("post sent to kafka");

  return res.status(200).json({
      message: "Your Post is being Posted",
    });
   
}


module.exports = { createPost};
