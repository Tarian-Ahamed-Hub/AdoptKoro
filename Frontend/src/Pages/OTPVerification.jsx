import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from '../Configs/AxiosConfig';
import { toast } from 'react-toastify';
import { useAuth } from "../Context/AuthProvider";

export default function OTPVerification() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [timer, setTimer] = useState(300);
  const [showResend, setShowResend] = useState(false);
  const { authenticate } = useAuth();
  const token = searchParams.get('token');
  const intent = searchParams.get('intent');

  useEffect(() => {
    if (!token || !intent) {
      toast.error('Invalid session');
      navigate('/login');
      return;
    }

    const interval = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          setShowResend(true);
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [token, intent, navigate]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const validateOTP = () => {
    const newErrors = {};

    if (!otp || otp.trim().length === 0) {
      newErrors.otp = 'OTP is required';
    } else if (!/^\d{6}$/.test(otp)) {
      newErrors.otp = 'OTP must be 6 digits';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleVerify = async (e) => {
    e.preventDefault();

    if (!validateOTP()) {
      return;
    }

    setLoading(true);
    try {
      let endpoint = '';

      if (intent === 'registration') {
        endpoint = '/api/auth/register-verify';
      } else if (intent === 'login') {
        endpoint = '/api/auth/login-verify';
      } else if (intent === 'forgot_password') {
        endpoint = '/api/auth/forgot-password-verify-otp';
      }

      const response = await axios.post(endpoint, { otp, token });
      
      toast.success(response.data.message);

      if (intent === 'forgot_password') {
        navigate(`/reset-password?token=${response.data.token}`);
      } else {
         
        localStorage.setItem("token", response.data.token);
        await authenticate();
        navigate('/user/profile');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      if (intent === 'registration') {
        toast.info('Please re-enter your registration details');
        navigate('/register');
        return;
      } else if (intent === 'login') {
        toast.info('Please re-enter your login credentials');
        navigate('/login');
        return;
      } else if (intent === 'forgot_password') {
        toast.info('Please enter your email again');
        navigate('/forgot-password');
        return;
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to resend OTP');
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtp(value);
    if (errors.otp) {
      setErrors({});
    }
  };

  return (
    <div className="new-otp-container">
      <div className="new-otp-card">
        <div className="new-otp-header">
          <h1>Verify OTP</h1>
          <p>Enter the 6-digit code sent to your email</p>
        </div>

        <form onSubmit={handleVerify} className="new-otp-form">
          <div className="new-otp-form-group">
            <label htmlFor="otp">One Time Password <span className="new-otp-required">*</span></label>
            <input
              type="text"
              id="otp"
              value={otp}
              onChange={handleInputChange}
              placeholder="000000"
              maxLength="6"
              className={`new-otp-input ${errors.otp ? 'new-otp-input-error' : ''}`}
              disabled={loading}
            />
            {errors.otp && <span className="new-otp-error-message">{errors.otp}</span>}
          </div>

          <div className="new-otp-timer-box">
            {!showResend ? (
              <p>OTP expires in <strong>{formatTime(timer)}</strong></p>
            ) : (
              <p className="new-otp-expired">OTP has expired</p>
            )}
          </div>

          <button
            type="submit"
            className="new-otp-btn-submit"
            disabled={loading || showResend}
          >
            {loading ? 'Verifying...' : 'Verify OTP'}
          </button>
        </form>

        {showResend && (
          <button
            className="new-otp-btn-resend"
            onClick={handleResend}
          >
            Resend OTP
          </button>
        )}

        <div className="new-otp-footer">
          <button
            className="new-otp-btn-back"
            onClick={() => {
              if (intent === 'registration') {
                navigate('/register');
              } else if (intent === 'forgot_password') {
                navigate('/forgot-password');
              } else {
                navigate('/login');
              }
            }}
          >
            ← Back
          </button>
        </div>
      </div>
    </div>
  );
}