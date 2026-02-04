import React, { useState, useEffect, useRef } from 'react';
import { socket } from '../../Configs/Socket';
import axios from '../../Configs/AxiosConfig';
import { useAuth } from '../../Context/AuthProvider';
import { toast } from 'react-toastify';
import { useParams } from 'react-router-dom';
 import account from "../../images/account.png"

const Chat = () => {
  const [inputValue, setInputValue] = useState('');
  const [conversationDetails, setConversationDetails] = useState(null);
  const [conversation, setConversation] = useState([]);
  const { user,setUnreadMessageCount } = useAuth();
  const { conversationId } = useParams();
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation]);

  useEffect(() => {
    if (!user) return;

    socket.emit("join_room", { roomId: conversationId });

    socket.on("receive_text_convo", (data) => {
      if (data.userId === user.userId) {
        data.userId = "current";
      }

      console.log(data);
      setConversation((prev) => {
        return [...prev, data];
      });
    });

    // Fetch conversation details
    const fetchConversation = async () => {
      try {
        const response = await axios.post('/api/interaction/message/getText', {
          conversationId
        });
        setConversationDetails(response.data.conversationDetails);
        setConversation(response.data.chats);
        setUnreadMessageCount(prev=>prev-response.data.seenCount)
        
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
  }, [user, conversationId]);

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const data = {
      conversationId,
      receiverId: null,
      postId: conversationDetails?.postId || null,
      text: inputValue
    };

    try {
      const response = await axios.post("/api/interaction/message/sendText", data);
      setInputValue('');
    } catch (err) {
      console.log(err.message);
      toast.error('Failed to send message');
    }
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <div className="chat-header-avatar-placeholder">
          {getInitials(conversationDetails?.conversationName)}
        </div>
        <div className="chat-header-info">
          <h3>{conversationDetails?.conversationName || 'Loading...'}</h3>
          <span className="chat-online-status">
            <span className="chat-status-dot"></span>
            Online
          </span>
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
                <>
                  {item.pic ? (
                    <img
                      src={item.pic}
                      alt={item.name}
                      className="chat-message-avatar"
                      onError={(e) => {
                         e.currentTarget.src = account;
                       }}
                    />
                  ) : (
                    <div className="chat-message-avatar chat-message-avatar-placeholder">
                      {getInitials(item.name)}
                    </div>
                  )}
                </>
              )}
              <div className="chat-message-content">
                {!isCurrentUser && (
                  <span className="chat-message-sender-name">{item.name}</span>
                )}
                <div className={`chat-message-bubble ${isCurrentUser ? 'sent-bubble' : 'received-bubble'}`}>
                  <p className="chat-message-text">{item.text}</p>
                  <span className="chat-message-time">{formatTime(item.createdAt)}</span>
                </div>
                <div className="chat-message-meta">
                  {isCurrentUser && (
                    <span className={`chat-message-status ${item.seen ? 'seen' : ''}`}>
                      {item.seen ? '✓✓' : '✓'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
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
        <button className="chat-send-button" onClick={() => handleSend()}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default Chat;