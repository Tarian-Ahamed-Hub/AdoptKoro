import React, { useEffect, useState } from 'react'
import UserLayout from '../Layouts/UserLayout';
import {BrowserRouter as Router,Route,Navigate , useLocation} from 'react-router-dom';
import { useAuth } from '../../Context/AuthProvider';
import axios from '../../Configs/AxiosConfig'; 

export default function UserRoutes({children }) {
   const location = useLocation();
  const [loading,setLoading] = useState(true);
  const [Authenticated, setAuthenticated] = useState(false);
  const {authenticateRoles} = useAuth();
  

  useEffect(()=>{
    const auth = async()=>{
        const valid = await authenticateRoles(["user"]);
        if(valid)
            setAuthenticated(true)
        setLoading(false)
    }

     auth();

    



  },[location]) 

  if(loading){
    return (
        <div>
            Loading...
        </div>
    )
  }
  return (
    <>
     {Authenticated ===true? (
         <UserLayout /> 
     ):
     (
         <Navigate to="/feed" replace /> 
     )

     }
     </>
  )
}
