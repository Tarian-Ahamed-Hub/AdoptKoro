const { getSocketIo } = require("../../Socket/initSocket")
const buildGroupId = (receiverId,postId,senderId)=>{
   const user1 = receiverId < senderId ? receiverId : senderId;
const user2 = receiverId < senderId ? senderId : receiverId;

     return `${postId}-${user1}-${user2}`

}
const sendText = async(req,res)=>{

  try{
      const {receiverId,postId,postTitle,text} = req.body;
      const sender = req.user;

      
      const io = getSocketIo();
      const data = {
      conversationId: buildGroupId(receiverId,postId,sender.userId),
      conversationName: postTitle,
      lastMessage: {
        sender: {
          userId: sender.userId,
          name: sender.userName,
          pic: sender.pic
        },
        text: text,
        timestamp: new Date('2026-01-23T09:15:00'),
        seen: false
      }
    }
      console.log("message sent to ",`room:${receiverId}`)

      const chatData = {
        message: {
          sender: {
            userId: sender.userId,
            name: sender.userName,
            pic: sender.pic
          },
          text: text,
          timestamp: new Date('2026-01-23T09:15:00'),
          seen: false
       }
    }
      

      io.to(`room:${receiverId}`).emit("receive_text",data);
      io.to(`room:${sender.userId}`).emit("receive_text",data);

      io.to(`room:${buildGroupId(receiverId,postId,sender.userId)}`).emit("receive_text_convo",chatData);


      return res.status(200).json({
        message:"message sent"
    })


  }
  catch(err){
    return res.status(400).json({
        message:err.message
    })
  }

    
}
module.exports = {sendText}