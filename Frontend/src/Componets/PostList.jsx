import axios from '../Configs/AxiosConfig';
import React, { useState, useEffect } from 'react';
import Post from './Post';

 
 
 

const PostList = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

const [currentCacheCursor, setCurrentCacheCursor] = useState("+inf");
const [currentDbCursor, setCurrentDbCursor] = useState(null);

  useEffect(() => {
    const fetchPosts = async () => {
        const data = {
            currentCacheCursor,
            currentDbCursor
        }
      try {
        const response = await axios.post(
          '/api/post/public/getlatestpostsbycategory/Cat',data

        );
        setPosts(response.data.posts);
        setCurrentCacheCursor(response.data.currentCacheCursor)
        setCurrentDbCursor(response.data.currentDbCursor)
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  if (loading) {
    return <div className="postlist-loading">Loading posts...</div>;
  }

  if (error) {
    return <div className="postlist-error">Error: {error}</div>;
  }

  return (
    <div className="postlist-container">
      <h1 className="postlist-title">Cat Posts</h1>
      <div className="postlist-grid">
        {posts.map((post) => (
          <Post key={post._id} post={post} />
        ))}
      </div>
    </div>
  );
};

export default PostList;