import React, { useState } from 'react';
import { socket } from '../Configs/Socket';
import axios from '../Configs/AxiosConfig';
import { toast } from 'react-toastify';
 

const Post = ({ post }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [inputValue, setInputValue] = useState('');

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

  const handleSend = async(post) => {
     
      const data = {
       receiverId:post.user.userId,
       postId:post._id,
       postTitle:"This is chat",
       text:inputValue
      }
      //  console.log(data)
      // return
      try{
     const response = await axios.post("/api/interaction/message/sendText",data)
     toast.success(response.data.message)
    }
      catch(err){
        console.log(err.message)
      }
     
      
    };

  return (
    <div className="post-card">
      <div className="post-header">
        <img 
          src={post.user.pic} 
          alt={post.user.name}
          className="post-user-pic"
        />
        <div className="post-user-info">
          <h3 className="post-user-name">{post.user.name}</h3>
          <p className="post-date">
            {new Date(post.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      <div className="post-image-container">
        <img 
          src={post.pics[currentImageIndex]} 
          alt={post.title}
          className="post-image"
        />
        {post.pics.length > 1 && (
          <>
            <button 
              className="post-arrow post-arrow-left" 
              onClick={prevImage}
            >
              ‹
            </button>
            <button 
              className="post-arrow post-arrow-right" 
              onClick={nextImage}
            >
              ›
            </button>
            <div className="post-image-indicator">
              {currentImageIndex + 1} / {post.pics.length}
            </div>
          </>
        )}
      </div>

      <div className="post-content">
        <h2 className="post-title">{post.title}</h2>
        <p className="post-text" >{post.content}</p>
        <div className="post-meta">
          <span className="post-category">{post.category}</span>
          <span className="post-district">{post.district}</span>
        </div>
      </div>

      <div className="post-action">
        <input
          type="text"
          className="post-input"
          placeholder="Type your message..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
        />
        <button className="post-send-btn" onClick={(e)=>handleSend(post)}>
          Send
        </button>
      </div>
    </div>
  );
};

export default Post;