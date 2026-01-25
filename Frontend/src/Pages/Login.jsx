import React from "react";
import { useAuth } from "../Context/AuthProvider";
import {useGoogleLogin} from '@react-oauth/google'
import {BrowserRouter as Router,Route, Navigate} from 'react-router-dom';
import axios from "../Configs/AxiosConfig";
import { socket } from "../Configs/Socket";

export default function Login() {
  const { user, loading,setUser } = useAuth();

  const resGoogle = async(authResult)=>{
      try{
         if(authResult["code"]){
             try{
                const res = await axios.get(`/api/auth/signInWithGoogle?code=${authResult["code"]}`)
                setUser(res.data.user);
                 if (!socket.connected) {
                  socket.connect();
                }
             }
             catch(err){
              console.log("oauth err ",err)
             }
         }
      }
      catch(err){
       console.log("Oauth error ", err)
      }
  }

  const handleGoogleError = (error) => {
   
  alert("Cancelled Signing In");
};
  
  const GoogleLogin = useGoogleLogin({
     onSuccess:resGoogle,
     onError:handleGoogleError,
     flow:'auth-code'
  })

//console.log(user)
  if(loading)
    return (
<div>
    Loading
</div>
   )

  return (
    <div>
      {user === null ? (
        <div>
          <button onClick={(e)=>GoogleLogin()}>Login with google</button>
        </div>
      ):
      (
        <Navigate to="/feed" replace /> 
      )
    }
    </div>
  );
}
