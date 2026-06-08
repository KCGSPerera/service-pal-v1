'use client';

import React, { createContext, useState, useEffect, useContext } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load token from localStorage on mount
    const savedToken = localStorage.getItem('service-pal-token');
    if (savedToken) {
      setToken(savedToken);
      fetchUserProfile(savedToken);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUserProfile = async (authToken) => {
    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        // Token expired or invalid
        logout();
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (usernameOrEmail, password) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usernameOrEmail, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.is_verified === false) {
          const err = new Error(data.message);
          err.is_verified = false;
          err.email = data.email;
          throw err;
        }
        throw new Error(data.message || 'Login failed');
      }

      localStorage.setItem('service-pal-token', data.token);
      setToken(data.token);
      setUser(data.user);
      return data;
    } catch (error) {
      if (error.is_verified !== false) {
        console.error('Login error:', error);
      }
      throw error;
    }
  };

  const loginWithGoogle = async (credential) => {
    try {
      const response = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Google Login failed');
      }
      localStorage.setItem('service-pal-token', data.token);
      setToken(data.token);
      setUser(data.user);
      return data;
    } catch (error) {
      console.error('Google login error:', error);
      throw error;
    }
  };

  const completeProfile = async (username, phone) => {
    try {
      const response = await fetch('/api/auth/complete-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ username, phone }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to complete profile');
      }
      setUser(data.user);
      return data;
    } catch (error) {
      console.error('Complete Profile error:', error);
      throw error;
    }
  };

  const updateUserProfile = async (profileData) => {
    try {
      const response = await fetch('/api/users/profile/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(profileData),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update profile');
      }
      setUser(data.user);
      return data;
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  };

  const register = async (registerData) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      return data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const verifyOtp = async (email, otp) => {
    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Verification failed');
      }

      return data;
    } catch (error) {
      console.error('OTP Verification error:', error);
      throw error;
    }
  };

  const resendOtp = async (email) => {
    try {
      const response = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Resend failed');
      }

      return data;
    } catch (error) {
      console.error('Resend OTP error:', error);
      throw error;
    }
  };

  const forgotPassword = async (email) => {
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Forgot password request failed');
      }

      return data;
    } catch (error) {
      console.error('Forgot password error:', error);
      throw error;
    }
  };

  const resetPassword = async (email, otp, newPassword) => {
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Reset password failed');
      }

      return data;
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('service-pal-token');
    setToken(null);
    setUser(null);
    setLoading(false);
  };

  const refreshUser = () => {
    if (token) {
      fetchUserProfile(token);
    }
  };

  return (
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || 'dummy'}>
      <AuthContext.Provider
        value={{
          user,
          token,
          loading,
          login,
          loginWithGoogle,
          register,
          completeProfile,
          updateUserProfile,
          verifyOtp,
          resendOtp,
          forgotPassword,
          resetPassword,
          logout,
          refreshUser,
        }}
      >
        {children}
      </AuthContext.Provider>
    </GoogleOAuthProvider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
