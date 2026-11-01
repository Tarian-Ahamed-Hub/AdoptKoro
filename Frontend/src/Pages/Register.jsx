import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../Configs/AxiosConfig';
import { toast } from 'react-toastify';

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name || formData.name.trim().length === 0) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email || formData.email.trim().length === 0) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
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

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('/api/auth/register-initiate', {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        confirmPassword: formData.confirmPassword
      });

      toast.success('OTP sent to your email');
      navigate(`/otp?token=${response.data.token}&intent=${response.data.intent}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-card">
        <div className="register-header">
          <h1>Create Account</h1>
          <p>Join us today</p>
        </div>

        <form onSubmit={handleSubmit} className="register-form">
          <div className="register-form-group">
            <label htmlFor="name">Full Name <span className="register-required">*</span></label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter your full name"
              className={errors.name ? 'register-input-error' : ''}
              disabled={loading}
            />
            {errors.name && <span className="register-error-message">{errors.name}</span>}
          </div>

          <div className="register-form-group">
            <label htmlFor="email">Email Address <span className="register-required">*</span></label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Enter your email"
              className={errors.email ? 'register-input-error' : ''}
              disabled={loading}
            />
            {errors.email && <span className="register-error-message">{errors.email}</span>}
          </div>

          <div className="register-form-group">
            <label htmlFor="password">Password <span className="register-required">*</span></label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="At least 6 characters"
              className={errors.password ? 'register-input-error' : ''}
              disabled={loading}
            />
            {errors.password && <span className="register-error-message">{errors.password}</span>}
          </div>

          <div className="register-form-group">
            <label htmlFor="confirmPassword">Confirm Password <span className="register-required">*</span></label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              placeholder="Confirm your password"
              className={errors.confirmPassword ? 'register-input-error' : ''}
              disabled={loading}
            />
            {errors.confirmPassword && <span className="register-error-message">{errors.confirmPassword}</span>}
          </div>

          <button type="submit" className="register-btn-submit" disabled={loading}>
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="register-divider">
          <span>Already have an account?</span>
        </div>

        <button
          className="register-btn-switch"
          onClick={() => navigate('/login')}
          disabled={loading}
        >
          Sign In
        </button>

        <div className="register-footer">
          <a href="/">Back to Home</a>
        </div>
      </div>
    </div>
  );
}