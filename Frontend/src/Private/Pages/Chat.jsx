import React, { useState, useEffect } from 'react';
import { socket } from '../../Configs/Socket';
import axios from '../../Configs/AxiosConfig';
import { useAuth } from '../../Context/AuthProvider';
import { toast } from 'react-toastify';
import { useParams } from 'react-router-dom';

const Chat = () => {
  
   
  const [inputValue, setInputValue] = useState('');
  const [conversationDetails, setConversationDetails] = useState(null);
  const {user} = useAuth();
   const { conversationId } = useParams();

  useEffect(() => {
   
    if (!user) return;

    socket.emit("join_room",{roomId:conversationId})

    socket.on("receive_text_convo",(data)=>{
      if(data.userId===user.userId){

       // console.log("You sent text")
         data.userId = "current"
      }
        
      console.log(data)
      setConversation((prev)=>{
        return [...prev, data];
      })
    })

    // Fetch conversation details
    const fetchConversation = async () => {
      try {
        const response = await axios.post('/api/interaction/message/getText', {
          conversationId
        });
        setConversationDetails(response.data.conversationDetails);
        setConversation(response.data.chats);
        console.log('Conversation loaded:', response.data);
      } catch (err) {
        console.error('Error fetching conversation:', err.message);
        toast.error('Failed to load conversation');
      }
    };

    fetchConversation();

     return () => {
        socket.emit("leave_room", conversationId);
      };

  }, [user]);

  const [conversation,setConversation] = useState( [])

  // {
  //   
  //         
  //         userId: 'current',
  //         name: 'You',
  //         pic: 'https://api.dicebear.com/7.x/avataaars/svg?seed=You'
  // 
  //       text: 'Sure, how about 3 PM?',
  //       createdAt: new Date('2026-01-25T10:33:00'),
  //       seen: false
  //   
  //   }
  
 

  const handleSend = async() => {
     const data = {
       conversationId,
       receiverId: null,
       postId: conversationDetails?.postId || null,
       text: inputValue
      }
     try{
     const response = await axios.post("/api/interaction/message/sendText",data)
   //  toast.success(response.data.message)
     setInputValue('');
    }
      catch(err){
        console.log(err.message)
        toast.error('Failed to send message');
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
          <h3>{conversationDetails?.conversationName || 'Loading...'}</h3>
          <span className="chat-online-status">Online</span>
        </div>
      </div>
      
      <div className="chat-messages-container">
        {conversation.map((item, index) => {
          const isCurrentUser = item.userId === user?.userId || item.userId === 'current';
          return (
            <div
              key={index}
              className={`chat-message-wrapper ${isCurrentUser ? 'sent' : 'received'}`}
            >
              {!isCurrentUser && (
                <img
                  src={item.pic}
                  alt={item.name}
                  className="chat-message-avatar"
                />
              )}
              <div className="chat-message-content">
                <div className={`chat-message-bubble ${isCurrentUser ? 'sent-bubble' : 'received-bubble'}`}>
                  <p className="chat-message-text">{item.text}</p>
                </div>
                <div className="chat-message-meta">
                  {isCurrentUser && (
                    <span className="chat-message-status">{item.seen ? '✓✓' : '✓'}</span>
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