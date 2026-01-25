import React from 'react'
import { useAuth } from '../Context/AuthProvider'
import {Routes,Route,Link} from "react-router-dom"
import PostList from '../Componets/PostList';

export default function Home() {
 const {user,loading} = useAuth();
 console.log(user)
 if(loading){
  return (
    <>Loading..</>
  )
 }
  return (
    <div>
      <PostList/>
     
        
        
    </div>
  )
}
