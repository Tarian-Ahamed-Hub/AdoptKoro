const Conversation = require("../../Models/Conversation");
const { getSocketIo } = require("../../Socket/initSocket");
const { v4: uuidv4 } = require("uuid");
const axios = require('axios');
const Chat = require("../../Models/Chat");
const { default: mongoose } = require("mongoose");
const { dbHandler } = require("../../../PostService/HelperFuncs/dbHelper");

const chatList = async(req,res)=>{

    dbHandler(res,async()=>{

       const user = req.user;
      
     const chatlist = await Conversation.aggregate([
         {
           $match:{
            members: new mongoose.Types.ObjectId(user.userId)
           }
         },
         {
          $lookup:{
            localField:"conversationId",
            from:"chats",
            foreignField:"conversationId",
            as:"messages"
          }
         },
        {
          $addFields: {
            lastMessage: { $arrayElemAt: ["$messages", -1] }  
          }
        },
        
        {
          $project: {
            conversationId: 1,
            conversationName: 1,
            lastMessage: {
              name:1,
              text: 1,
              pic:1,
              userId: 1,
              createdAt: 1,
              seen:1
            }
          }
        }

     ])
        return res.status(200).json({
            chatList:chatlist,
            message: "fetched message",
        });


    })
    

 

 }


 const conversationDetails = async(req,res)=>{

     const {conversationId} = req.body;
     const sender = req.user;
      const existingConvo = await Conversation.findOne({ members: sender.userId,conversationId});
      if(!existingConvo){
        return res.status(400).json({
            message: "You dont have access to this conversation",
        });
      }
      const chatData = await Chat.find({conversationId})
      return res.status(200).json({
            conversationDetails:existingConvo,
            chats:chatData,
            message: "fetched message",
        });

 }

const sendText = async (req, res) => {
  try {
    const { receiverId, postId, text } = req.body; 
    const sender = req.user;
    let temp_rec = [];

    if(receiverId)
    temp_rec.push(receiverId)

    let rec_set = new Set([...temp_rec,sender.userId]);
     
  
      let url = process.env.GATEWAY_SERVICE_URL
       const response = await axios.post(`${url}/api/post/public/getPost`,
      {
        postId
      },
      {
        headers:{
          "Content-Type": "application/json"
        }
      }
    )
    
    let post = response.data.post;
    
let chatData = {
      conversationName:post.title,
      userId: sender.userId,
      name: sender.userName,
      pic: sender.pic,
      text: text,
      createdAt:new Date(),
      seen: false,
    };
    
    if (!Object.hasOwn(req.body, "conversationId")) {//create convo
       const existingConvo = await Conversation.findOne({postId, members: sender.userId});
       if(!existingConvo){
        if(post.userId===receiverId){
              console.log("Creating convo")
            const groupId = uuidv4();
          chatData.conversationId = groupId;
          
          await Conversation.insertOne(
                {
                postId:post._id,
                conversationId:groupId,
                members:[...rec_set],
                conversationName:post.title
                }
          )
        }
        else{
           return res.status(404).json({
           message:"post doesnt exist"
        })
        }

       }
       else{
        console.log("Convo exists sending text to convo")
         chatData.conversationId = existingConvo.conversationId;
         rec_set = new Set(existingConvo.members)
       }
       
    } 
    else{
      //check if convo valid then populate chatdata.conversationId
      
      
      const existingConvo = await Conversation.findOne({ members: sender.userId,conversationId:req.body.conversationId});
      if(!existingConvo){
        console.log("user do not have access to the convo")
        return res.status(400).json({
          message: "You dont have access to this conversation",
       });
      }
      else{
        console.log("sending to existing convo")
         chatData.conversationId = existingConvo.conversationId;
         rec_set = new Set(existingConvo.members)
      }

    }
     
     await Chat.create(chatData);

    const io = getSocketIo();
    const data = {
      conversationId: chatData.conversationId,
      conversationName: post.title,
      lastMessage: {
          userId: sender.userId,
          name: sender.userName,
          pic: sender.pic,
          text: text,
          createdAt: new Date(),
          seen: false,  
      },
    };
  

    
  
    
      rec_set.forEach(rec => {
        io.to(`room:${rec}`).emit("receive_text", data);
      });
     

    io.to(`room:${chatData.conversationId}`).emit(
      "receive_text_convo",
      chatData,
    );

    return res.status(200).json({
      message: "message sent",
    });
  } catch (err) {
    if(err.response?.status===404){
        return res.status(404).json({
        message: "Post not found",
      });

    }
    return res.status(400).json({
      message: err.message,
    });
  }
};
module.exports = { sendText ,conversationDetails,chatList};
