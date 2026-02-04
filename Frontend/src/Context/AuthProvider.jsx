import { createContext, useContext, useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import axios from "../Configs/AxiosConfig";
import { toast, ToastContainer } from "react-toastify";
import { socket } from "../Configs/Socket";

const AuthContext = createContext(null);


export default function AuthProvider({children}) {

 const [user,setUser] = useState(null);
 const [loading,setLoading] = useState(true);
 const [unreadMessageCount,setUnreadMessageCount] = useState(0)

 const navigate = useNavigate();

 const authenticate = async()=>{
    const data = {
     roles:["user"]
    }
    try{
        const res =  await axios.post( "/api/auth/authenticate",data);
        setUser(res.data.user);
        console.log(res.data.user)
          if (!socket.connected) {
            socket.connect();
             function joinRoom(roomId) {
            const data = { roomId };
            console.log("join_room", data);
            socket.emit("join_room", data);
          }
          console.log("Authenticate:Trying to join room ")
        joinRoom(res.data.user.userId);

          }
         
    

        return res.data;
    }
    catch(err){

      setUser(null);
      navigate("/login");
      return null;
    }
    finally{
        setLoading(false)
    }
 }

useEffect(() => {
  if (!user?.userId) return;
  const getCount = async()=>{
        const messageCount = await axios.get("/api/interaction/message/messageCount")
        setUnreadMessageCount(messageCount.data.unseenCount);
  }
   getCount()
  
  const handleReceiveText = (data) => {
    if(data.lastMessage.userId!==user.userId)
    setUnreadMessageCount(prev=>prev+1);
  };
  socket.on("receive_text", handleReceiveText);

 
  return () => {
    socket.off("receive_text", handleReceiveText);
  };
}, [user?.userId]);



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
     if(socket.connected)
     socket.disconnect();
       
    } catch (err) {
      console.error(err);
    } finally {
      setUser(null);
      navigate("/feed");
    }
  };


  useEffect(() => {
  const interceptorId = axios.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response) {
        const status = error.response.status;

        if (error.config?.skipAuthInterceptor) {
          return Promise.reject(error);
        }

        if (status === 401) {
          logout();
        } else if (status === 403) {
          toast.error("Not Authorised");
        }
      }

      return Promise.reject(error);
    }
  );

  return () => {
    axios.interceptors.response.eject(interceptorId);
  };
}, []);

 

  return (
    <AuthContext.Provider value={{user,setUser,logout,authenticate,loading,authenticateRoles,setUnreadMessageCount,unreadMessageCount}}>
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
