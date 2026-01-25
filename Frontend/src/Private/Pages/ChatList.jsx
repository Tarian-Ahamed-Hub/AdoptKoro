import React, { useEffect, useState } from 'react';
import { useAuth } from '../../Context/AuthProvider';
import { socket } from '../../Configs/Socket';

const ChatList = () => {

     const {user} = useAuth();
 

   useEffect(() => {
  if (!user) return;

  function joinRoom(roomId) {
    const data = { roomId };
    console.log("join_room", data);
    socket.emit("join_room", data);
  }
  console.log("Trying to join room ",user)
 joinRoom(user.userId);

 socket.on("receive_text",(data)=>{
     setChats((prev)=>[data,...prev]);
     console.log("message received" , data)
 })


}, [user]); 

//  {
//       conversationId: '1',
//       conversationName: 'Team Discussion',
//       lastMessage: {
//         sender: {
//           userId: 'u1',
//           name: 'John Doe',
//           pic: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John'
//         },
//         text: 'Hey, how are you doing today?',
//         timestamp: new Date('2026-01-25T10:30:00'),
//         seen: false
//       }
//     },
 
  const [chats,setChats] = useState([ ] )
  

  const truncateMessage = (text, maxLength = 50) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  const handleChatClick = (conversationId) => {
    window.location.href = `/user/chat/${conversationId}`;
  };

  return (
    <div className="chatlist-container">
      <div className="chatlist-header">
        <h2>Messages</h2>
      </div>
      <div className="chatlist-list">
        {chats.map((chat) => (
          <div
            key={chat.conversationId}
            className={`chatlist-item ${!chat.lastMessage.seen ? 'unread' : ''}`}
            onClick={() => handleChatClick(chat.conversationId)}
          >
            <img
              src={chat.lastMessage.sender.pic}
              alt={chat.conversationName}
              className="chatlist-avatar"
            />
            <div className="chatlist-info">
              <div className="chatlist-header-row">
                <h3 className="chatlist-name">{chat.conversationName}</h3>
              </div>
              <div className="chatlist-message-row">
                <p className={`chatlist-message ${!chat.lastMessage.seen ? 'unread-message' : ''}`}>
                  {!chat.lastMessage.seen && <span className="chatlist-new-indicator">New: </span>}
                  {truncateMessage(chat.lastMessage.text)}
                </p>
                {!chat.lastMessage.seen && <span className="chatlist-unread-badge"></span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChatList;