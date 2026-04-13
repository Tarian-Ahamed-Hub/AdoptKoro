import PostList from '../Componets/PostList';
import axios from '../Configs/AxiosConfig';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../Context/AuthProvider';
import { useParams } from 'react-router-dom';
import FeedFilters from '../Componets/Filters';
import { useFilters } from '../Context/FilterContext';

export default function NearestPosts() {
 
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { category, location } = useParams();
  const [currentCursor, setCurrentCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const {currentDistrict, currentCategory} = useFilters();
  
  // Reference for the observer
  const observerRef = useRef();
  const lastPostRef = useRef();
  const isLoadingRef = useRef(false); // Prevent concurrent requests

  // Initial fetch
  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      setError(null);
      
      // First request - cursor is null
      const data = {
        lat: currentDistrict.latitude.toString(),
        lon: currentDistrict.longitude.toString(),
        category: currentCategory.name,
        cursor: null
      };

      try {
        const response = await axios.post(
          `/api/post/public/getNearestPosts`,
          data
        );
        
        if (response.data?.posts && response.data.posts.length > 0) {
          setPosts(response.data.posts);
          
          // Create cursor from the last post's distance
          const lastPost = response.data.posts[response.data.posts.length - 1];
          const newCursor = {
            _id: lastPost._id,
            distance: lastPost.distance
          };
          
          setCurrentCursor(newCursor);
          setHasMore(response.data.hasMore);
        } else {
          setPosts([]);
          setCurrentCursor(null);
          setHasMore(false);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching posts:', err);
        setError(err.response?.data?.message || err.message);
        setLoading(false);
      }
    };

    // Reset state when category or location changes
    setPosts([]);
    setCurrentCursor(null);
    setHasMore(true);
    isLoadingRef.current = false;
    
    fetchPosts();
  }, [currentCategory, currentDistrict]);

  // Fetch more posts
  const fetchMorePosts = useCallback(async () => {
    // Guard conditions to prevent concurrent requests
    if (isLoadingRef.current || loadingMore || !hasMore || !currentCursor) return;

    isLoadingRef.current = true;
    setLoadingMore(true);

    // Subsequent requests - cursor is the object with _id and distance
    const data = {
      lat: currentDistrict.latitude.toString(),
      lon: currentDistrict.longitude.toString(),
      category: currentCategory.name,
      cursor: currentCursor  // { _id: "...", distance: 0 }
    };

    try {
      const response = await axios.post(
        `/api/post/public/getNearestPosts`,
        data
      );

      if (response.data?.posts && response.data.posts.length > 0) {
        // Prevent duplicate posts
        setPosts(prev => {
          const existingIds = new Set(prev.map(p => p._id));
          const uniqueNewPosts = response.data.posts.filter(p => !existingIds.has(p._id));
          return [...prev, ...uniqueNewPosts];
        });

        // Create cursor from the last post's distance
        const lastPost = response.data.posts[response.data.posts.length - 1];
        const newCursor = {
          _id: lastPost._id,
          distance: lastPost.distance
        };

        setCurrentCursor(newCursor);
        setHasMore(response.data.hasMore);
      } else {
        setHasMore(false);
      }

      setLoadingMore(false);
      isLoadingRef.current = false;
    } catch (err) {
      console.error('Error fetching more posts:', err);
      setError(err.response?.data?.message || err.message);
      setLoadingMore(false);
      isLoadingRef.current = false;
    }
  }, [currentDistrict, currentCategory, currentCursor, loadingMore, hasMore]);

  // Intersection Observer callback
  useEffect(() => {
    if (loading) return;

    if (observerRef.current) observerRef.current.disconnect();

    const options = {
      root: null,
      rootMargin: '200px', // Trigger earlier to load posts smoothly
      threshold: 0.1
    };

    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loadingMore && !isLoadingRef.current) {
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

  return (
    <div>
        <header style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '20px 0',      // Vertical spacing (top/bottom)
   borderBottom: '1px solid #b3b3b3' // Subtle line to define the header
}}>
    <h1 style={{
        fontSize: '1.5rem',
        fontWeight: '600',
        margin: 0,           // Removes default browser spacing
        fontFamily: 'sans-serif',
        color: '#adadad'
    }}>
        Nearest Posts First
    </h1>
</header>
      <FeedFilters />
      
      {/* PostList handles all rendering */}
      <PostList posts={posts} loading={loading} error={error} setPosts={setPosts} />
      
      {/* Loading indicator for loading MORE posts (append only) */}
      {loadingMore && (
        <div className="pl-loading" style={{ padding: '40px 20px' }}>
          <div className="pl-spinner"></div>
          <p>Loading more posts...</p>
        </div>
      )}
      
      {/* Observer target - placed near the end of posts to trigger fetch more */}
      {hasMore && posts.length > 0 && (
        <div ref={lastPostRef} style={{ height: '20px', marginTop: '20px' }} />
      )}
      
      {/* No more posts message - only show after initial load */}
      {!hasMore && posts.length > 0 && (
        <div style={{
          textAlign: 'center',
          padding: '40px 20px',
          color: 'rgba(245, 245, 245, 0.6)',
          fontSize: '14px'
        }}>
          No more posts available
        </div>
      )}
    </div>
  );
}