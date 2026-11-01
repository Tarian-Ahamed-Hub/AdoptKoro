import { useEffect, useState } from 'react'
 
import './App.css'
import {BrowserRouter,Route,Routes,Navigate} from 'react-router-dom'
import Login from './Pages/Login'
import OTPVerification from './Pages/OTPVerification'
import ForgotPassword from './Pages/ForgotPassword'
import ResetPassword from './Pages/ResetPassword'
import Register from './Pages/Register'
 
import AuthProvider from './Context/AuthProvider'
import PageNotFound from './Pages/PageNotFound'
import { GoogleOAuthProvider } from '@react-oauth/google'
import UserRoutes from './Private/Routes/UserRoutes'
 
 
import Navbar from './Componets/Navbar'
import FilterProvider from './Context/FilterContext'
import { socket } from './Configs/Socket'
 
import NearestPosts from './Pages/NearestPosts'

function App() {


   useEffect(() => {

    return () => {
      if(socket.connected)
      socket.disconnect();
    };
  }, []);

  
  const GoogleAuthWrapper = ()=>{
    const clientId = import.meta.env.VITE_OAUTH_CLIENT_ID;
  
    return(
 
       <GoogleOAuthProvider clientId={clientId}>
        <Login/>
       </GoogleOAuthProvider>  
    )
   
  }
  return (
    <BrowserRouter>
       <AuthProvider>
           <FilterProvider>
          <Navbar></Navbar>
          <div className='ContentContainer'>
            
          <Routes>
             <Route path="/" element={<Navigate to="/feed/posts/nearest" replace />} />
            <Route path='/feed/posts/nearest' element={<NearestPosts/> }/> 
          
            <Route path='/login' element={<GoogleAuthWrapper/> }/> 
             <Route path='/register' element={<Register/> }/> 
            <Route path='/otp' element={<OTPVerification/> }/> 
            <Route path='/forgot-password' element={<ForgotPassword/> }/> 
            <Route path='/reset-password' element={<ResetPassword/> }/> 

             <Route
            path="/user/*"
            element={
              <UserRoutes/>
            }
          />

           

            <Route path='*' element={<PageNotFound/> }/> 
          </Routes>
         </div>
         </FilterProvider>
      </AuthProvider>
    
    </BrowserRouter>
  )
}

export default App
