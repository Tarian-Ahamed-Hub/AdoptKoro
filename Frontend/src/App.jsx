import { useEffect, useState } from 'react'
 
import './App.css'
import {BrowserRouter,Route,Routes,Navigate} from 'react-router-dom'
import Login from './Pages/Login'
 
import AuthProvider from './Context/AuthProvider'
import PageNotFound from './Pages/PageNotFound'
import { GoogleOAuthProvider } from '@react-oauth/google'
import UserRoutes from './Private/Routes/UserRoutes'
 
 
import Navbar from './Componets/Navbar'
import FilterProvider from './Context/FilterContext'
import { socket } from './Configs/Socket'
import FeedWrapper from './Componets/FeedWrapper'

function App() {


   useEffect(() => {

    return () => {
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
             <Route path="/" element={<Navigate to="/feed/latest/Cat/Dhaka" replace />} />
            <Route path='/feed/*' element={<FeedWrapper/> }/> 
          
            <Route path='/login' element={<GoogleAuthWrapper/> }/> 

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
