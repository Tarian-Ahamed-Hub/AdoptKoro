

import React from 'react'
import {BrowserRouter as Router,Routes,Route, Navigate} from 'react-router-dom';
import UserProfile from '../Pages/UserProfile';

export default function UserLayout() {
  return (
    <div className='userPanel'>
      <div>User panel</div>

       <Routes>
              <Route path="/profile" element={<UserProfile />} />
       </Routes>
       
    </div>
  )
}
