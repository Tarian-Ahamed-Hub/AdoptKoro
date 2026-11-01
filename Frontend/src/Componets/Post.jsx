import React, { useState, useEffect } from 'react';
import axios from '../Configs/AxiosConfig';
import { toast } from 'react-toastify';
import { useAuth } from '../Context/AuthProvider';
import { useLocation } from 'react-router-dom';
import account from "../images/account.png"

const Post = ({ post, setPosts }) => {
  const { user } = useAuth();
  const location = useLocation();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

 
  const isUserProfile = location.pathname === '/user/profile';

 
  useEffect(() => {
    if (showImageViewer) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showImageViewer]);

  const nextImage = () => {
    setCurrentImageIndex((prev) => 
      prev === post.pics.length - 1 ? 0 : prev + 1
    );
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => 
      prev === 0 ? post.pics.length - 1 : prev - 1
    );
  };

  const openImageViewer = () => {
    setShowImageViewer(true);
    setZoomLevel(1);
  };

  const closeImageViewer = () => {
    setShowImageViewer(false);
    setZoomLevel(1);
  };

  const zoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.5, 5));
  };

  const zoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.5, 1));
  };

  const handleSend = async(post) => {
    const data = {
      receiverId: post.user.userId,
      postId: post._id,
      text: inputValue
    };
    
    try {
      const response = await axios.post("/api/interaction/message/sendText", data);
      toast.success(response.data.message);
      setInputValue('');
    } catch(err) {
      console.log(err.message);
    }
  };

  const markAdopted = async(post) => {
    const data = {
      post,
      active: !post.active
    };
    
    try {
      const response = await axios.post("/api/post/private/updatePost", data);
      setPosts((prev) => {
        return prev.map((each_post) => {
          if(each_post._id === post._id) {
            return {...each_post, active: response.data.post.active};
          }
          return each_post;
        });
      });
      toast.success(response.data.message);
    } catch(err) {
      console.log(err.message);
    }
  };

  return (
    <>
      <div className="pc-card">
       

        {/* Image Container - Fixed Height */}
        <div className="pc-image-wrapper">
          <div className="pc-image-container" onClick={openImageViewer}>
            <img 
              src={post.pics[currentImageIndex]} 
              alt={post.title}
              className="pc-image"
            />
            {post.pics.length > 1 && (
              <>
                <button 
                  className="pc-nav-btn pc-nav-left" 
                  onClick={(e) => {
                    e.stopPropagation();
                    prevImage();
                  }}
                  aria-label="Previous image"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="15 18 9 12 15 6"></polyline>
                  </svg>
                </button>
                <button 
                  className="pc-nav-btn pc-nav-right" 
                  onClick={(e) => {
                    e.stopPropagation();
                    nextImage();
                  }}
                  aria-label="Next image"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </button>
                <div className="pc-indicator">
                  {currentImageIndex + 1} / {post.pics.length}
                </div>
              </>
            )}
          </div>
        </div>

         {/* Header */}
        <div className="pc-header">
        
          <div className="pc-user-info">
            <h3 className="pc-username">{post.user.name}</h3>
            <p className="pc-timestamp">
              {new Date(post.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </p>
          </div>
          {user?.userId === post.user?.userId && (
            <div className="pc-status-badge">
              {post.active ? (
                <span className="pc-badge pc-badge-available">Available</span>
              ) : (
                <span className="pc-badge pc-badge-adopted">Adopted</span>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="pc-content">
          <h2 className="pc-title">About</h2>
          <h2 className="pc-title">{post.title}</h2>
          <p className="pc-description">{post.content}</p>
          
          <div className="pc-meta">
            <span className="pc-tag pc-tag-category">{post.category}</span>
            <span className="pc-tag pc-tag-district">{post.district}</span>
          </div>
        </div>

        {/* Action Footer */}
        {user ? (
          user?.userId !== post.user?.userId ? (
            <div className="pc-action">
              <input
                type="text"
                className="pc-input"
                placeholder="Send a message to adopt..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && inputValue.trim() && handleSend(post)}
              />
              <button 
                className="pc-send-btn" 
                onClick={() => handleSend(post)}
                disabled={!inputValue.trim()}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
              </button>
            </div>
          ) : (
            <div className="pc-action">
              {isUserProfile ? (
                <button 
                  className={`pc-toggle-btn ${post.active ? 'pc-toggle-active' : 'pc-toggle-inactive'}`}
                  onClick={() => markAdopted(post)}
                >
                  {post.active ? (
                    <>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                      Mark as Adopted
                    </>
                  ) : (
                    <>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="16"></line>
                        <line x1="8" y1="12" x2="16" y2="12"></line>
                      </svg>
                      Mark as Available
                    </>
                  )}
                </button>
              ) : (
                <div className="pc-login-prompt">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
                  </svg>
                  Your Post
                </div>
              )}
            </div>
          )
        ) : (
          <div className="pc-action">
            <div className="pc-login-prompt">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                <polyline points="10 17 15 12 10 7"></polyline>
                <line x1="15" y1="12" x2="3" y2="12"></line>
              </svg>
              Login to contact
            </div>
          </div>
        )}
      </div>

      {/* Image Viewer Modal */}
      {showImageViewer && (
        <div className="pc-viewer-overlay" onClick={closeImageViewer}>
          <div className="pc-viewer-container" onClick={(e) => e.stopPropagation()}>
            <div className="pc-viewer-header">
            
              <button className="pc-viewer-close" onClick={closeImageViewer}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div className="pc-viewer-scroll-container">
              <img 
                src={post.pics[currentImageIndex]} 
                alt={post.title}
                className="pc-viewer-zoom-image"
                style={{ 
                  width: `${100 * zoomLevel}%`,
                  height: 'auto'
                }}
              />
            </div>
            {post.pics.length > 1 && (
              <div className="pc-viewer-nav">
                <button className="pc-viewer-nav-btn" onClick={prevImage}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="15 18 9 12 15 6"></polyline>
                  </svg>
                </button>
                <span className="pc-viewer-indicator">
                  {currentImageIndex + 1} / {post.pics.length}
                </span>
                <button className="pc-viewer-nav-btn" onClick={nextImage}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Post;