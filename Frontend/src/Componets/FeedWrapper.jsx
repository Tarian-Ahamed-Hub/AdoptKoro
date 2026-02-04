import React from 'react'
import Home from '../Pages/Home'
import { Route, Routes } from 'react-router-dom'

export default function FeedWrapper() {
  return (
     <Routes>
         <Route path={"latest/:category/:location"} element={<Home/>}/> 

     </Routes>
  )
}
