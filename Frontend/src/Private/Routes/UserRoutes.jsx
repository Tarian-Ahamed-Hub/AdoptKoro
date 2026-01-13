import React, { useEffect, useState } from 'react'
import UserLayout from '../Layouts/UserLayout';
import {BrowserRouter as Router,Route,Navigate , useLocation} from 'react-router-dom';
import { useAuth } from '../../Context/AuthProvider';
import axios from '../../Configs/AxiosConfig'; 

export default function UserRoutes({children }) {
   const location = useLocation();
  const [loading,setLoading] = useState(true);
  const [Authenticated, setAuthenticated] = useState(false);
  const {authenticate} = useAuth();
//i have the function already - replace
  const authenticateUser = async()=>{
     
    try{
        const res = await axios.post("/api/auth/authenticate",{
            roles:["user"]
        })
        if(res.status===200){
         setAuthenticated(true)
   
         console.log(res.data)
        }
    }
    catch(err){
        console.log("LOGGED ERROR ",err.message);
    }
    finally{
        setLoading(false)
    }

  }

  useEffect(()=>{
    authenticateUser();
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
         children 
     ):
     (
         <Navigate to="/" replace /> 
     )

     }
     </>
  )
}
