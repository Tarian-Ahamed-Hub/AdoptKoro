import { useState } from 'react'
 
import './App.css'
import {BrowserRouter,Route,Routes,Navigate} from 'react-router-dom'
import Login from './Pages/Login'
import Home from './Pages/Home'
import AuthProvider from './Context/AuthProvider'
import PageNotFound from './Pages/PageNotFound'
import { GoogleOAuthProvider } from '@react-oauth/google'
import UserRoutes from './Private/Routes/UserRoutes'
import { toast, ToastContainer } from 'react-toastify';
import UserLayout from './Private/Layouts/UserLayout'

function App() {
  
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
           
          
          <Routes>
            <Route path='/' element={<Home/> }/> 
          
            <Route path='/login' element={<GoogleAuthWrapper/> }/> 

             <Route
            path="/user/*"
            element={
              <UserRoutes>
                <UserLayout />
              </UserRoutes>
            }
          />

           

            <Route path='*' element={<PageNotFound/> }/> 
          </Routes>

      </AuthProvider>
    
    </BrowserRouter>
  )
}

export default App
