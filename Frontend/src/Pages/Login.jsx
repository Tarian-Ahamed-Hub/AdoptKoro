import React from "react";
import { useAuth } from "../Context/AuthProvider";
import {useGoogleLogin} from '@react-oauth/google'
import axios from "../Configs/AxiosConfig";

export default function Login() {
  const { user, loading } = useAuth();

  const resGoogle = async(authResult)=>{
      try{
         if(authResult["code"]){
             try{
                const res = axios.get(`/api/user/auth/signInWithGoogle?code=${authResult["code"]}`)
                console.log(res.data)
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

console.log(user)
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
          <button onClick={GoogleLogin}>Login with google</button>
        </div>
      ):
      (
        <div>
            {user.name}
            {user.role}
            {user.email}
          
        </div>
      )
    }
    </div>
  );
}
