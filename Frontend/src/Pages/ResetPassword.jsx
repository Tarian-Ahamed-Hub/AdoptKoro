import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from '../Configs/AxiosConfig';
import { toast } from 'react-toastify';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      toast.error('Invalid session');
      navigate('/forgot-password');
    }
  }, [token, navigate]);

  const validatePasswords = () => {
    const newErrors = {};

    if (!passwordData.newPassword) {
      newErrors.newPassword = 'Password is required';
    } else if (passwordData.newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters';
    }

    if (!passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validatePasswords()) {
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('/api/auth/reset-password', {
        token,
        newPassword: passwordData.newPassword,
        confirmPassword: passwordData.confirmPassword
      });
      localStorage.setItem("token", response.data.token);
      toast.success(response.data.message);
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Password reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reset-pass-container">
      <div className="reset-pass-card">
        <div className="reset-pass-header">
          <h1>Reset Password</h1>
          <p>Enter your new password</p>
        </div>

        <form onSubmit={handleSubmit} className="reset-pass-form">
          <div className="reset-pass-form-group">
            <label htmlFor="newPassword">New Password <span className="reset-pass-required">*</span></label>
            <input
              type="password"
              id="newPassword"
              name="newPassword"
              value={passwordData.newPassword}
              onChange={handleInputChange}
              placeholder="At least 6 characters"
              className={errors.newPassword ? 'reset-pass-input-error' : ''}
              disabled={loading}
            />
            {errors.newPassword && <span className="reset-pass-error-message">{errors.newPassword}</span>}
          </div>

          <div className="reset-pass-form-group">
            <label htmlFor="confirmPassword">Confirm Password <span className="reset-pass-required">*</span></label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={passwordData.confirmPassword}
              onChange={handleInputChange}
              placeholder="Confirm your password"
              className={errors.confirmPassword ? 'reset-pass-input-error' : ''}
              disabled={loading}
            />
            {errors.confirmPassword && <span className="reset-pass-error-message">{errors.confirmPassword}</span>}
          </div>

          <button type="submit" className="reset-pass-btn-submit" disabled={loading}>
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>

        <div className="reset-pass-divider">
          <span>Remember your password?</span>
        </div>

        <button
          className="reset-pass-btn-switch"
          onClick={() => navigate('/login')}
          disabled={loading}
        >
          Sign In
        </button>

        <div className="reset-pass-footer">
          <a href="/">Back to Home</a>
        </div>
      </div>
    </div>
  );
}