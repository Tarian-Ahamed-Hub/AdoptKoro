import React from 'react'
import Home from '../Pages/Home'
import { Route, Routes } from 'react-router-dom'
import NearestPosts from '../Pages/NearestPosts'

export default function FeedWrapper() {
  return (
     <Routes>
         <Route path={"latest/:category/:location"} element={<Home/>}/> 
         <Route path={"posts/nearest"} element={<NearestPosts/>}/> 

     </Routes>
  )
}
