import React, { useEffect, useState } from 'react';
import { useAuth } from '../../Context/AuthProvider';
import { socket } from '../../Configs/Socket';
import { toast } from 'react-toastify';
import axios from '../../Configs/AxiosConfig';
import { useNavigate } from 'react-router-dom';
import account from "../../images/account.png"
 

const ChatList = () => {
  const { user } = useAuth();
  const [chats, setChats] = useState([]);
  const navigate = useNavigate();
  useEffect(() => {
    if (!user) return;

    const fetchConversation = async () => {
      try {
        const response = await axios.get('/api/interaction/message/chatList');
        setChats(response.data.chatList);
      } catch (err) {
        toast.error('Failed to load conversation');
      }
    };

    fetchConversation();
    const handle_recieve = (data)=>{
       setChats((prev) => {
        let newArr = prev.filter((chat) => {
          if (chat.conversationId !== data.conversationId)
            return true;
          return false;
        });
        return [data, ...newArr];
      });
      console.log("message received", data);

    }
    socket.on("receive_text", handle_recieve);
    return ()=>{
       socket.off("receive_text", handle_recieve);
    }
  }, [user]);
  console.log("In Chatlist ",user)
  const truncateMessage = (text, maxLength = 50) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };


  const handleChatClick = (conversationId) => {
    navigate(`/user/chat/${conversationId}`);
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="chatlist-container">
      <div className="chatlist-header">
        <h2>Messages</h2>
      </div>
      <div className="chatlist-list">
        {chats?.length === 0 ? (
          <div className="chatlist-empty">
            <div className="chatlist-empty-icon">💬</div>
            <p className="chatlist-empty-text">No conversations yet</p>
          </div>
        ) : (
          chats?.map((chat) => {
            if(chat.lastMessage)
            return(
              <div
              key={chat.conversationId}
              className={`chatlist-item ${!chat.lastMessage.seen ? 'unread' : ''}`}
              onClick={() => handleChatClick(chat.conversationId)}
            >
              {chat.lastMessage.pic ? (
               <img
                  src={chat.lastMessage.pic}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  className="chatlist-avatar"
                  onError={(e) => {
                    e.currentTarget.src = account;
                  }}
                />
              ) : (
                <div className="chatlist-avatar chatlist-avatar-placeholder">
                  {getInitials(chat.conversationName)}
                </div>
              )}
              <div className="chatlist-info">
                <div className="chatlist-header-row">
                  <h3 className="chatlist-name">{chat.conversationName}</h3>
                </div>
                <div className="chatlist-message-row">
                  <p className={`chatlist-message ${!chat.lastMessage.seen ? 'unread-message' : ''}`}>
                    {(!chat.lastMessage.seen && chat.lastMessage.userId!==user.userId) && <span className="chatlist-new-indicator">New: </span>}
                    {truncateMessage(chat.lastMessage.text)}
                  </p>
                  {(!chat.lastMessage.seen && chat.lastMessage.userId!==user.userId) && <span className="chatlist-unread-badge"></span>}
                </div>
              </div>
            </div>
            ) 
            
})
        )}
      </div>
    </div>
  );
};

export default ChatList;