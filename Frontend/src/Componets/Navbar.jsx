import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../Context/AuthProvider';
import { useEffect } from 'react';
import { useFilters } from '../Context/FilterContext';
import messenger from "../images/messenger.png"
import nearby from "../images/nearby.png"
import pet from "../images/pet.png"
import account from "../images/account.png"
export default function Navbar() {
  const {user,unreadMessageCount} = useAuth();
  const {currentDistrict,currentCategory} = useFilters()
  // useEffect(()=>{
    
  // })

  return (
    <nav className="navbar">
      <div className="nav-container">
        <div className="nav-item">
          <Link to={`/feed/posts/nearest`}><img style={{width:"32px"}} src={nearby}/></Link>
        </div>
        <div className="nav-divider"></div>
        <div className="nav-item">
          <Link to={`/feed/latest/${currentCategory.name}/${currentDistrict.district}`}><img style={{width:"32px"}} src={pet}/></Link>
        </div>

         
        
         {user &&
         <>
         <div className="nav-divider"></div>

          <div className="nav-item" style={{ position: "relative" }}>
            <Link to={"/user/chatList"}>
              <img style={{ width: "32px" }} src={messenger} />

              {unreadMessageCount > 0 && (
                <div className="unread-badge">
                  {unreadMessageCount > 99 ? "99+" : unreadMessageCount}
                </div>
              )}
            </Link>
          </div>
          </>
          }
        <div className="nav-divider"></div>
        <div className="nav-item">
        
             {user?
             (
                 <Link to={"/user/profile"}>
             <img src={(() => {
                 if(user?.pic && user.pic!=="")
                  return user.pic
                else{
                  return account;
                }
                })() } 
                style={{width:"30px",border:"0px solid black",borderRadius:"50%"}}
                
             >
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