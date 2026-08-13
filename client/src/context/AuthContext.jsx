import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('devtask_token') || null);

  useEffect(() => {
    if (token) {
      localStorage.setItem('devtask_token', token);
      fetchUserProfile();
    } else {
      localStorage.removeItem('devtask_token');
      setUser(null);
      setLoading(false);
    }
  }, [token]);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setUser(data);
      } else {
        // Token might have expired or been deleted
        logout();
      }
    } catch (err) {
      console.error('Error fetching user profile', err);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Login failed');
    }
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const signup = async (name, email, password, title) => {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, title })
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Registration failed');
    }
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const updateProfile = async (profileData) => {
    const response = await fetch('/api/auth/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(profileData)
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Profile update failed');
    }
    setUser(data);
    return data;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('devtask_token');
  };

  const deleteAccount = async () => {
    const response = await fetch('/api/auth/account', {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Account deletion failed');
    }
    logout();
    return data;
  };

  const changePassword = async (currentPassword, newPassword) => {
    const response = await fetch('/api/auth/password', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ currentPassword, newPassword })
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Password change failed');
    }
    return data;
  };

  const updateAvatar = async (file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    const response = await fetch('/api/auth/avatar', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Avatar upload failed');
    }
    setUser(data);
    return data;
  };

  const removeAvatar = async () => {
    const response = await fetch('/api/auth/avatar', {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Avatar removal failed');
    }
    setUser(data);
    return data;
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, signup, logout, updateProfile, deleteAccount, changePassword, updateAvatar, removeAvatar }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
