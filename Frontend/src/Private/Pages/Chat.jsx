import React, { useState, useEffect } from 'react';
import { socket } from '../../Configs/Socket';
import axios from '../../Configs/AxiosConfig';
import { useAuth } from '../../Context/AuthProvider';
import { toast } from 'react-toastify';

const Chat = () => {
  const [message, setMessage] = useState('');
  const [conversationId, setConversationId] = useState('');
  const [inputValue, setInputValue] = useState('');
  const {user} = useAuth();

  useEffect(() => {
   
    if (!user) return;

    const pathParts = window.location.pathname.split('/');
    const id = pathParts[pathParts.length - 1];
    setConversationId(id);
    console.log(id);

    socket.emit("join_room",{roomId:id})

    socket.on("receive_text_convo",(data)=>{
      if(data.message.sender.userId===user.userId){
       // console.log("You sent text")
         data.message.sender.userId = "current"
      }
        
      console.log(data)
      setConversation((prev)=>{
        return [...prev, data];
      })
    })

  }, [user]);

  const [conversation,setConversation] = useState( [])

  // {
  //     message: {
  //       sender: {
  //         userId: 'current',
  //         name: 'You',
  //         pic: 'https://api.dicebear.com/7.x/avataaars/svg?seed=You'
  //       },
  //       text: 'Sure, how about 3 PM?',
  //       timestamp: new Date('2026-01-25T10:33:00'),
  //       seen: false
  //     }
  //   }
  
 

  const handleSend = async() => {
     const extractDetails =(id)=>{
      const arr = id.split("-");
      const postId = arr[0];
      const receiverId = arr[1]===user.userId?arr[2]:arr[1];
      return {postId,receiverId}

     }
     const {postId,receiverId} = extractDetails(conversationId)

     const data = {
       receiverId:receiverId,
       postId:postId,
       postTitle:"This is chat",
       text:inputValue
      }
     try{
     const response = await axios.post("/api/interaction/message/sendText",data)
     toast.success(response.data.message)
    }
      catch(err){
        console.log(err.message)
      }

  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <img
          src="https://api.dicebear.com/7.x/avataaars/svg?seed=John"
          alt="Chat user"
          className="chat-header-avatar"
        />
        <div className="chat-header-info">
          <h3>John Doe</h3>
          <span className="chat-online-status">Online</span>
        </div>
      </div>
      
      <div className="chat-messages-container">
        {conversation.map((item, index) => {
          const isCurrentUser = item.message.sender.userId === 'current';
          return (
            <div
              key={index}
              className={`chat-message-wrapper ${isCurrentUser ? 'sent' : 'received'}`}
            >
              {!isCurrentUser && (
                <img
                  src={item.message.sender.pic}
                  alt={item.message.sender.name}
                  className="chat-message-avatar"
                />
              )}
              <div className="chat-message-content">
                <div className={`chat-message-bubble ${isCurrentUser ? 'sent-bubble' : 'received-bubble'}`}>
                  <p className="chat-message-text">{item.message.text}</p>
                </div>
                <div className="chat-message-meta">
                  {isCurrentUser && (
                    <span className="chat-message-status">{item.message.seen ? '✓✓' : '✓'}</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="chat-input-container">
        <input
          type="text"
          className="chat-input"
          placeholder="Type a message..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
        />
        <button className="chat-send-button" onClick={()=>handleSend()}>
          Send
        </button>
      </div>
    </div>
  );
};

export default Chat;