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
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const { user,setUnreadMessageCount } = useAuth();
  const { conversationId } = useParams();
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const loadMoreRef = useRef(null);
  
 

  const getCount = async()=>{
        const messageCount = await axios.get("/api/interaction/message/messageCount")
        setUnreadMessageCount(messageCount.data.unseenCount);
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Only scroll to bottom on initial load, NOT on load more or socket events
  useEffect(() => {
    // Only scroll on very first load
    if (isInitialLoad && conversation.length > 0) {
      scrollToBottom();
    }
  }, [isInitialLoad]);

  // Scroll to bottom when new messages arrive via socket (only if at bottom)
  useEffect(() => {
    if (!isLoadingMore && conversation.length > 0 && !isInitialLoad) {
      const container = messagesContainerRef.current;
      if (!container) return;
      
      const isAtBottom = 
        container.scrollHeight - container.scrollTop - container.clientHeight < 100;
      
      // Only auto-scroll if user is already at bottom
      if (isAtBottom) {
        setTimeout(() => {
          scrollToBottom();
        }, 0);
      }
    }
  }, [conversation, isLoadingMore, isInitialLoad]);

  // Handle scroll to detect when user scrolls near top and bottom
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    let scrollTimeout;

    const handleScroll = () => {
      // Show load more button if scrolled near top and there are more messages
      if (container.scrollTop < 100 && hasMore && !isLoadingMore && loadMoreRef.current) {
        loadMoreRef.current.style.display = 'block';
      } else if (loadMoreRef.current) {
        loadMoreRef.current.style.display = 'none';
      }

      // Only update scroll button during user scroll, not during programmatic updates
      if (scrollTimeout) clearTimeout(scrollTimeout);
      
      scrollTimeout = setTimeout(() => {
        // Check if user is at bottom
        const isAtBottom = 
          container.scrollHeight - container.scrollTop - container.clientHeight < 50;
        
        // Show scroll down button if NOT at bottom (user manually scrolled up)
        setShowScrollButton(!isAtBottom && !isLoadingMore);
      }, 100);
    };

    container.addEventListener('scroll', handleScroll);
    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (scrollTimeout) clearTimeout(scrollTimeout);
    };
  }, [hasMore, isLoadingMore]);

  const handleScrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (!user) return;

    socket.emit("join_room", { roomId: conversationId });
    
    let isFirstSocketMessage = false;

    const handleMessage = (data) => {
    if (data.userId === user.userId) {
      data.userId = "current";
    }

    setConversation((prev) => [...prev, data]);

    if (!isLoadingMore) {
      setTimeout(() => {
        scrollToBottom();
      }, 0);
    }
  };

    socket.on("receive_text_convo",handleMessage);

    // Fetch conversation details (initial load, no cursor)
    const fetchConversation = async () => {
      try {
        const response = await axios.post('/api/interaction/message/getText', {
          conversationId
          // cursor is not sent on first load, backend uses default null
        });
        setConversationDetails(response.data.conversationDetails);
        setConversation(response.data.chats);
        setCursor(response.data.cursor);
        setHasMore(response.data.hasMore);
       
        setIsInitialLoad(false); // Mark initial load as complete
        
        console.log('Conversation loaded:', response.data);
      } catch (err) {
        console.error('Error fetching conversation:', err.message);
        toast.error('Failed to load conversation');
        setIsInitialLoad(false);
      }
    };

    fetchConversation();
    getCount()

    return () => {
      socket.emit("leave_room", conversationId);
      socket.off("receive_text_convo", handleMessage);
    };
  }, [user, conversationId]);

  const handleLoadMore = async () => {
    if (!hasMore || isLoadingMore || !cursor) return;

    setIsLoadingMore(true);
    setShowScrollButton(false);
    
    try {
      const response = await axios.post('/api/interaction/message/getText', {
        conversationId,
        cursor
      });

      // Prepend new messages - NO SCROLL, just update state
      setConversation((prev) => [...response.data.chats, ...prev]);
      setCursor(response.data.cursor);
      setHasMore(response.data.hasMore);

      console.log('More messages loaded:', response.data);
    } catch (err) {
      console.error('Error loading more messages:', err.message);
      toast.error('Failed to load more messages');
    } finally {
      setIsLoadingMore(false);
    }
  };

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

      <div className="chat-messages-container" ref={messagesContainerRef}>
        {/* Load More Button - appears when scrolling up if hasMore is true */}
        {hasMore && (
          <button
            ref={loadMoreRef}
            onClick={handleLoadMore}
            disabled={isLoadingMore}
            className="chat-load-more-button"
            style={{
              display: 'none',
            }}
          >
            {isLoadingMore ? 'Loading...' : 'Load More'}
          </button>
        )}

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
                  
                </div>
                <span className="chat-message-time">{formatTime(item.createdAt)}</span>
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

      {/* Scroll to Bottom Button */}
      {showScrollButton && (
        <button
          onClick={handleScrollToBottom}
          className="chat-scroll-down-button"
          title="Scroll to latest messages"
        >
          <svg 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path 
              d="M12 5V19M12 19L7 14M12 19L17 14" 
              stroke="white" 
              strokeWidth="2.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          </svg>
        </button>
      )}

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