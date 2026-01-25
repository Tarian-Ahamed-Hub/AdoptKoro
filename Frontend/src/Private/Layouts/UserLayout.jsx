

import React from 'react'
import {BrowserRouter as Router,Routes,Route, Navigate} from 'react-router-dom';
import UserProfile from '../Pages/UserProfile';
import ChatList from '../Pages/ChatList';
import Chat from '../Pages/Chat';

export default function UserLayout() {
  return (
    <div className='userPanel'>
      <div>User panel</div>

       <Routes>
              <Route path="/profile" element={<UserProfile />} />
               <Route path="/chatlist" element={<ChatList />} />
               <Route path="/chat/:conversationId" element={<Chat />} />
       </Routes>
       
    </div>
  )
}
