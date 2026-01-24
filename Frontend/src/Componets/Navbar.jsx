import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../Context/AuthProvider';
import { useEffect } from 'react';

export default function Navbar() {
  const {user} = useAuth();
  
  useEffect(()=>{
    
  })

  return (
    <nav className="navbar">
      <div className="nav-container">
        <div className="nav-item">
          <Link to={"/feed"}>Feed</Link>
        </div>
        <div className="nav-divider"></div>
        <div className="nav-item">
            <Link to={"/notification"}>Notification</Link>
     
        </div>
        <div className="nav-divider"></div>
        <div className="nav-item">
        
             {user?.pic?
             (
                 <Link to={"/user/profile"}>
             <img src={user?.pic} style={{width:"30px",border:"0px solid black",borderRadius:"50%"}}>
             </img>
              </Link>
             ):
             (
              <Link to={"/login"}>Login</Link>
             )

             }
          
    
        </div>
      </div>
    
    </nav>
  );
}