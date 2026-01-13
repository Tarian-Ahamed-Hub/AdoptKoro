import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../Configs/AxiosConfig";
import { toast, ToastContainer } from "react-toastify";

const AuthContext = createContext(null);


export default function AuthProvider({children}) {

 const [user,setUser] = useState(null);
 const [loading,setLoading] = useState(true);

 const navigate = useNavigate();

 const authenticate = async()=>{
    const data = {
     roles:["user"]
    }
    try{
        const res =  await axios.post( "/api/auth/authenticate",data);
        setUser(res.data.user);
        console.log(res.data.user)
        return res.data;
    }
    catch(err){
      setUser(null);
      return null;
    }
    finally{
        setLoading(false)
    }
 }



 const authenticateRoles = async(roles)=>{
 const data = {
     roles:roles
    }
    try{
        const res =  await axios.post( "/api/auth/authenticate",data);
        if(res.status ===200)
           return true;
    }
    catch(err){
      return false;
    }
   
 }

   useEffect(() => {
    authenticate();
  }, []);


  const logout = async () => {
    try {
     await axios.get("/api/auth/logout", { skipAuthInterceptor: true });
       
    } catch (err) {
      console.error(err);
    } finally {
      setUser(null);
      navigate("/");
    }
  };


  axios.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
  
    if (error.response) {
    
      const status = error.response.status;

       if (error.config && error.config.skipAuthInterceptor) {
        return Promise.reject(error);
      }

      if (status === 401) {
       logout();
      } else if (status === 403) {
       toast.error("Not Authorised")
      }
    }

    return Promise.reject(error);
  }
);


  return (
    <AuthContext.Provider value={{user,setUser,logout,authenticate,loading}}>
       <ToastContainer
              position="top-left"
              autoClose={900}
              hideProgressBar={false}
              newestOnTop={false}
              closeOnClick
              pauseOnHover
              draggable
              theme="light"
            />

        {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext);
