import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../Configs/AxiosConfig';
import { toast } from 'react-toastify';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateEmail = () => {
    const newErrors = {};

    if (!email || email.trim().length === 0) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Invalid email format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateEmail()) {
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('/api/auth/forgot-password-initiate', {
        email: email.trim().toLowerCase()
      });

      toast.success('OTP sent to your email');
      navigate(`/otp?token=${response.data.token}&intent=${response.data.intent}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setEmail(e.target.value);
    if (errors.email) {
      setErrors({});
    }
  };

  return (
    <div className="forgot-pass-container">
      <div className="forgot-pass-card">
        <div className="forgot-pass-header">
          <h1>Reset Password</h1>
          <p>Enter your email to reset your password</p>
        </div>

        <form onSubmit={handleSubmit} className="forgot-pass-form">
          <div className="forgot-pass-form-group">
            <label htmlFor="email">Email Address <span className="forgot-pass-required">*</span></label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={handleInputChange}
              placeholder="Enter your email"
              className={errors.email ? 'forgot-pass-input-error' : ''}
              disabled={loading}
            />
            {errors.email && <span className="forgot-pass-error-message">{errors.email}</span>}
          </div>

          <button type="submit" className="forgot-pass-btn-submit" disabled={loading}>
            {loading ? 'Sending OTP...' : 'Send OTP'}
          </button>
        </form>

        <div className="forgot-pass-divider">
          <span>Remember your password?</span>
        </div>

        <button
          className="forgot-pass-btn-switch"
          onClick={() => navigate('/login')}
          disabled={loading}
        >
          Sign In
        </button>

        <div className="forgot-pass-footer">
          <a href="/">Back to Home</a>
        </div>
      </div>
    </div>
  );
}