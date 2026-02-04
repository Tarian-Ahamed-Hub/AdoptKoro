import PostList from '../Componets/PostList';
import axios from '../Configs/AxiosConfig';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../Context/AuthProvider';
import { useParams } from 'react-router-dom';
import FeedFilters from '../Componets/Filters';

export default function Home() {
  const { user, userLoading } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { category, location } = useParams();
  const [currentCacheCursor, setCurrentCacheCursor] = useState("+inf");
  const [currentDbCursor, setCurrentDbCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  
  // Reference for the observer
  const observerRef = useRef();
  const lastPostRef = useRef();

  // Initial fetch
  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      setError(null);
      
      const data = {
        currentCacheCursor: "+inf",
        currentDbCursor: null
      };

      try {
        const response = await axios.post(
          `/api/post/public/getlatestpostsbycategory/${category}/${location}`,
          data
        );
        
        setPosts(response.data.posts);
        setCurrentCacheCursor(response.data.currentCacheCursor);
        setCurrentDbCursor(response.data.currentDbCursor);
        
        // Check if there are more posts
        if (!response.data.currentCacheCursor && !response.data.currentDbCursor) {
          setHasMore(false);
        }
        
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    // Reset state when category or location changes
    setPosts([]);
    setCurrentCacheCursor("+inf");
    setCurrentDbCursor(null);
    setHasMore(true);
    
    fetchPosts();
  }, [category, location]);

  // Fetch more posts
  const fetchMorePosts = useCallback(async () => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);

    const data = {
      currentCacheCursor,
      currentDbCursor
    };

    try {
      const response = await axios.post(
        `/api/post/public/getlatestpostsbycategory/${category}/${location}`,
        data
      );

      // Append new posts
      setPosts(prev => [...prev, ...response.data.posts]);
      setCurrentCacheCursor(response.data.currentCacheCursor);
      setCurrentDbCursor(response.data.currentDbCursor);

      // Check if there are more posts
      if (!response.data.currentCacheCursor && !response.data.currentDbCursor) {
        setHasMore(false);
      }

      setLoadingMore(false);
    } catch (err) {
      setError(err.message);
      setLoadingMore(false);
    }
  }, [currentCacheCursor, currentDbCursor, category, location, loadingMore, hasMore]);

  // Intersection Observer callback
  useEffect(() => {
    if (loading) return;

    if (observerRef.current) observerRef.current.disconnect();

    const options = {
      root: null,
      rootMargin: '200px', // Increased margin to trigger earlier on mobile
      threshold: 0.1 // Trigger when 10% visible
    };

    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loadingMore) {
        fetchMorePosts();
      }
    }, options);

    if (lastPostRef.current) {
      observerRef.current.observe(lastPostRef.current);
    }

    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [loading, hasMore, loadingMore, fetchMorePosts]);

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <p className="text-gray-600">Loading posts...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center p-8">
        <p className="text-red-500">Error: {error}</p>
      </div>
    );
  }

  return (
   <div>
    <FeedFilters />
    <PostList posts={posts} />
    
    {/* Loading indicator for infinite scroll */}
    {loadingMore && (
      <div className="loading-more-container">
        <p className="loading-more-text">Loading more posts...</p>
      </div>
    )}
    
    {/* Observer target - placed near the end of posts */}
    {hasMore && posts.length > 0 && (
      <div ref={lastPostRef} className="observer-target" />
    )}
    
    {/* No more posts message */}
    {!hasMore && posts.length > 0 && (
      <div className="no-more-posts-container">
        <p className="no-more-posts-text">No more posts available</p>
      </div>
    )}
    
    {/* No posts at all */}
    {!loading && posts.length === 0 && (
      <div className="no-posts-container">
        <p className="no-posts-text">No posts found</p>
      </div>
    )}
  </div>
  );
}