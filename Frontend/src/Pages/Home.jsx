import React from 'react'
import { useAuth } from '../Context/AuthProvider'
import {Routes,Route,Link} from "react-router-dom"

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
      <div>This is Feed</div>
     
        
        
    </div>
  )
}
