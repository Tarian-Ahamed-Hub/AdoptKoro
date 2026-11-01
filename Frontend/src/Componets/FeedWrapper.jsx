import React from 'react'
 
import { Route, Routes } from 'react-router-dom'
import NearestPosts from '../Pages/NearestPosts'

export default function FeedWrapper() {
  return (
     <Routes>
         
         <Route path={"posts/nearest"} element={<NearestPosts/>}/> 

     </Routes>
  )
}
