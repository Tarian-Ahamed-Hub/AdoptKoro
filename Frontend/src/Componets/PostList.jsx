import React from 'react';
import Post from './Post';

const PostList = ({ posts, loading, error, setPosts }) => {
  if (loading) {
    return (
      <div className="pl-container">
        <div className="pl-loading">
          <div className="pl-spinner"></div>
          <p>Loading posts...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pl-container">
        <div className="pl-error">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <p>Error: {error}</p>
        </div>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="pl-container">
        <div className="pl-empty">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="9" y1="9" x2="15" y2="15"></line>
            <line x1="15" y1="9" x2="9" y2="15"></line>
          </svg>
          <h3>No Posts Found</h3>
          <p>Be the first to create a post!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pl-container">
      <div className="pl-grid">
        {posts.map((post) => (
          <Post key={post._id} post={post} setPosts={setPosts} />
        ))}
      </div>
    </div>
  );
};

export default PostList;