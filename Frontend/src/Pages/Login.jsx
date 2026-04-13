import React from "react";
import { useAuth } from "../Context/AuthProvider";
import { useGoogleLogin } from '@react-oauth/google';
import { Navigate } from 'react-router-dom';
import axios from "../Configs/AxiosConfig";
import { socket } from "../Configs/Socket";

export default function Login() {
  const { user, loading, setUser } = useAuth();

  const resGoogle = async (authResult) => {
    try {
      if (authResult["code"]) {
        try {
          const res = await axios.get(`/api/auth/signInWithGoogle?code=${authResult["code"]}`);
          setUser(res.data.user);
          localStorage.setItem("token", res.data.token);
          
          if (!socket.connected) {
            socket.connect();
            function joinRoom(roomId) {
              const data = { roomId };
              console.log("join_room", data);
              socket.emit("join_room", data);
            }
            console.log("Login:Trying to join room ");
            joinRoom(res.data.user.userId);
          }
        } catch (err) {
          console.log("oauth err ", err);
        }
      }
    } catch (err) {
      console.log("Oauth error ", err);
    }
  };

  const handleGoogleError = (error) => {
    alert("Cancelled Signing In");
  };

  const GoogleLogin = useGoogleLogin({
    onSuccess: resGoogle,
    onError: handleGoogleError,
    flow: 'auth-code'
  });

  if (loading) {
    return (
      <div className="login-loading">
        <div className="login-loading-content">
          <div className="login-spinner"></div>
          <p className="login-loading-text">Connecting you to the pack...</p>
          <p className="login-loading-subtext">Finding your perfect pet match</p>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      {user === null ? (
        <div className="login-wrapper">
          {/* Visual / Hero Section */}
          <div className="login-visual">
            <div className="login-visual-overlay"></div>
            <div className="login-visual-content">
              <div className="login-brand">
                {/* Paw SVG Icon (replaces emoji) */}
                <svg 
                  className="login-logo" 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="48" 
                  height="48" 
                  viewBox="0 0 24 24" 
                  fill="white"
                >
                  <path d="M12 2C9.24 2 7 4.24 7 7V8.5C7 10.43 5.43 12 3.5 12C1.57 12 0 10.43 0 8.5V7C0 3.13 3.13 0 7 0C10.87 0 14 3.13 14 7V8.5C14 10.43 12.43 12 10.5 12C8.57 12 7 10.43 7 8.5V7C7 5.34 8.34 4 10 4C11.66 4 13 5.34 13 7V8.5C13 9.33 13.67 10 14.5 10C15.33 10 16 9.33 16 8.5V7C16 4.24 13.76 2 11 2Z" />
                  <path d="M5 19a2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2" />
                  <path d="M19 19a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2" />
                  <circle cx="7" cy="14" r="2" />
                  <circle cx="17" cy="14" r="2" />
                </svg>
                <h1 className="login-brand-name">Adoptkoro</h1>
              </div>

              <div className="login-visual-hero">
                <h2 className="login-visual-title">
                  Your forever friend<br />is waiting for you
                </h2>
                <p className="login-visual-subtitle">
                  Post your own adoption listing or browse thousands of pets ready for their forever home.<br />
                 
                </p>

                {/* <div className="login-stats">
                  <div className="login-stat">
                    <span className="login-stat-number">10K+</span>
                    <span className="login-stat-label">Pets adopted</span>
                  </div>
                  <div className="login-stat-divider"></div>
                  <div className="login-stat">
                    <span className="login-stat-number">98%</span>
                    <span className="login-stat-label">Happy families</span>
                  </div>
                </div> */}
              </div>
            </div>
          </div>

          {/* Login Card / Form Section */}
          <div className="login-form-section">
            <div className="login-card">
              <div className="login-card-header">
                <h2 className="login-card-title">Welcome to Adoptkoro</h2>
                <p className="login-card-subtitle">
                  Sign in with Google to start your adoption journey
                </p>
              </div>

             <button 
                className="login-google-btn" 
                onClick={() => GoogleLogin()}
              >
                <svg 
                  className="login-google-icon" 
                  viewBox="0 0 48 48" 
                  width="24" 
                  height="24"
                >
                  <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
                  <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
                  <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
                  <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
                </svg>
                <span className="login-google-text">Continue with Google</span>
              </button>

              <div className="login-card-footer">
                <p className="login-trust-text">
                  🔒 Secure login • Powered by Google
                </p>
                <p className="login-policy-text">
                  By continuing, you agree to our{' '}
                  <a href="#" className="login-link">Terms of Service</a> and{' '}
                  <a href="#" className="login-link">Privacy Policy</a>
                </p>
              </div>

              {/* Support badge with SVG heart (no emoji) */}
              {/* <div className="login-pet-badge">
                <svg 
                  width="16" 
                  height="16" 
                  viewBox="0 0 24 24" 
                  fill="currentColor" 
                  xmlns="http://www.w3.org/2000/svg"
                  style={{ marginRight: "6px" }}
                >
                  <path d="M12 21.35L10.55 20.03C5.4 15.36 2 12.28 2 8.5C2 5.42 4.42 3 7.5 3C9.24 3 10.91 3.81 12 5.09C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.42 22 8.5C22 12.28 18.6 15.36 13.45 20.03L12 21.35Z" />
                </svg>
                100% of proceeds support animal shelters
              </div> */}
            </div>
          </div>
        </div>
      ) : (
        <Navigate to="/" replace />
      )}
    </div>
  );
}