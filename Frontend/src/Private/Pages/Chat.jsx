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
  const { user, setUnreadMessageCount } = useAuth();
  const { conversationId } = useParams();
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const loadMoreRef = useRef(null);
  const didInitialScroll = useRef(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Jump to bottom once, after the first batch of messages renders
  useEffect(() => {
    if (!isInitialLoad && conversation.length > 0 && !didInitialScroll.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
      didInitialScroll.current = true;
    }
  }, [isInitialLoad, conversation]);

  // Scroll to bottom when new messages arrive (only if already at bottom)
  useEffect(() => {
    if (!isLoadingMore && conversation.length > 0 && !isInitialLoad) {
      const container = messagesContainerRef.current;
      if (!container) return;

      const isAtBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight < 100;

      if (isAtBottom) {
        setTimeout(() => {
          scrollToBottom();
        }, 0);
      }
    }
  }, [conversation, isLoadingMore, isInitialLoad]);

  // Show/hide the "load more" and "scroll down" buttons based on scroll position
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    let scrollTimeout;

    const handleScroll = () => {
      if (container.scrollTop < 100 && hasMore && !isLoadingMore && loadMoreRef.current) {
        loadMoreRef.current.style.display = 'block';
      } else if (loadMoreRef.current) {
        loadMoreRef.current.style.display = 'none';
      }

      if (scrollTimeout) clearTimeout(scrollTimeout);

      scrollTimeout = setTimeout(() => {
        const isAtBottom =
          container.scrollHeight - container.scrollTop - container.clientHeight < 50;

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

    didInitialScroll.current = false;
    setIsInitialLoad(true);

    const joinRoom = () => socket.emit("join_room", { roomId: conversationId });
    joinRoom();
    socket.on("connect", joinRoom);

    const handleMessage = (data) => {
      setConversation((prev) => [...prev, data]);

      if (!isLoadingMore) {
        setTimeout(() => {
          scrollToBottom();
        }, 0);
      }
    };

    socket.on("receive_text_convo", handleMessage);

    const fetchConversation = async () => {
      try {
        const response = await axios.post('/api/interaction/message/getText', {
          conversationId,
        });
        setConversationDetails(response.data.conversationDetails);
        setConversation(response.data.chats);
        setCursor(response.data.cursor);
        setHasMore(response.data.hasMore);
        setIsInitialLoad(false);

        const messageCount = await axios.get("/api/interaction/message/messageCount");
        setUnreadMessageCount(messageCount.data.unseenCount);
      } catch (err) {
        console.error('Error fetching conversation:', err.message);
        toast.error('Failed to load conversation');
        setIsInitialLoad(false);
      }
    };

    fetchConversation();

    return () => {
      socket.emit("leave_room", conversationId);
      socket.off("connect", joinRoom);
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
        cursor,
      });

      setConversation((prev) => [...response.data.chats, ...prev]);
      setCursor(response.data.cursor);
      setHasMore(response.data.hasMore);
    } catch (err) {
      console.error('Error loading more messages:', err.message);
      toast.error('Failed to load more messages');
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleSend = () => {
    const text = inputValue.trim();
    if (!text) return;

    socket
      .timeout(5000)
      .emit("send_text", { conversationId, text }, (err, res) => {
        if (err || !res?.ok) {
          toast.error(res?.message || "Failed to send message");
          return;
        }
        setInputValue('');
      });
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
        {hasMore && (
          <button
            ref={loadMoreRef}
            onClick={handleLoadMore}
            disabled={isLoadingMore}
            className="chat-load-more-button"
            style={{ display: 'none' }}
          >
            {isLoadingMore ? 'Loading...' : 'Load More'}
          </button>
        )}

        {conversation.map((item, index) => {
          const isCurrentUser = item.userId === user?.userId;

          return (
            <div
              key={item._id ?? index}
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
        <button className="chat-send-button" onClick={handleSend}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default Chat;