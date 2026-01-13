import React from 'react'
import { useAuth } from '../../Context/AuthProvider';

export default function UserProfile() {
 const {user,loading,logout} = useAuth();
 console.log(user)
 
 if(loading){
    return (
        <div>Loading...</div>
    )
 }
  return (
    <div>
        <div>{`User name - ${user?.name}`}</div>
        <img style={{width:"100px"}} src={user?.pic} alt='user profile pic'></img>
        <button onClick={(e)=>logout()}>Logout</button>
    </div>
  )
}


