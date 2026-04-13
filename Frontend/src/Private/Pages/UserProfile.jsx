import React, { useState, useEffect } from 'react';
import { useAuth } from '../../Context/AuthProvider';
import NewPostForm from '../../Componets/NewPostForm';
import PostList from '../../Componets/PostList';
import axios from '../../Configs/AxiosConfig';
import account from "../../images/account.png"

export default function UserProfile() {
 const {user,loading,logout} = useAuth();
 //console.log(user)

 const [posts, setPosts] = useState([]);
    const [postLoading, setPostLoading] = useState(true);


    useEffect(() => {
    const fetchPosts = async () => {
        
      try {
        const response = await axios.get(
          '/api/post/private/getUserPosts' 
        );
        setPosts(response.data.posts);
        
        setPostLoading(false);
      } catch (err) {
      
        setPostLoading(false);
      }
    };

    fetchPosts();
  }, [user]);

 
 if(loading){
    return (
        <div>Loading...</div>
    )
 }
  return (
    <>
   <div className="profile-container">
      <div className="profile-card">
        <div className="profile-header">
          <img className="profile-pic" src={(() => {
                           if(user?.pic && user.pic!=="")
                            return user.pic
                          else{
                            return account;
                          }
                          })()} alt="user profile pic" />
          <div className="profile-info">
            <h2 className="profile-name">{user?.name}</h2>
           
          </div>
        </div>
        
        <div className="divider"></div>
        
        <button className="logout-btn" onClick={(e) => logout()}>
          <svg className="logout-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Log Out
        </button>
      </div>
 
    </div>

    <NewPostForm></NewPostForm>

    <PostList posts = {posts} loading={postLoading} setPosts={setPosts}></PostList>
    </>
  )
}


