import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../Configs/AxiosConfig";

const AuthContext = createContext(null);


export default function AuthProvider({children}) {

 const [user,setUser] = useState(null);
 const [loading,setLoading] = useState(true);

 const navigate = useNavigate();

 const authenticate = async()=>{

    try{
        const res =  await axios.get( "/api/user/auth/authenticate");
        setUser(res.data);
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

   useEffect(() => {
    authenticate();
  }, []);


  const logout = async () => {
    try {
      await axios.post("/api/user/auth/logout");
    } catch (err) {
      console.error(err);
    } finally {
      setUser(null);
      navigate("/");
    }
  };


  return (
    <AuthContext.Provider value={{user,setUser,logout,authenticate,loading}}>
        {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext);
