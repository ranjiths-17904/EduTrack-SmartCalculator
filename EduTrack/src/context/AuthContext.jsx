import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState('home');

  useEffect(() => {
    // Check localStorage for saved user and view state on app start
    try {
      const savedUser = localStorage.getItem('currentUser');
      const savedView = localStorage.getItem('currentView');
      
      if (savedUser) {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        
        // Restore the last active view
        if (savedView) {
          setCurrentView(savedView);
        }
      }
    } catch (error) {
      console.error('Error loading saved user:', error);
      // Clear corrupted data
      localStorage.removeItem('currentUser');
      localStorage.removeItem('currentView');
      localStorage.removeItem('semesterData');
    }
    setLoading(false);
  }, []);

  const login = (userData) => {
    try {
      // Clear ALL user data before login (including other users' data)
      clearAllUserData();
      
      // Set new user
      setUser(userData);
      setCurrentView('home');
      
      // Save to localStorage
      localStorage.setItem('currentUser', JSON.stringify(userData));
      localStorage.setItem('currentView', 'home');
    } catch (error) {
      console.error('Error during login:', error);
    }
  };

  const updateUser = (updatedUserData) => {
    try {
      setUser(updatedUserData);
      localStorage.setItem('currentUser', JSON.stringify(updatedUserData));
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  const logout = () => {
    try {
      setUser(null);
      setCurrentView('home');
      clearAllUserData();
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const clearAllUserData = () => {
    try {
      // Clear current user data
      localStorage.removeItem('currentUser');
      localStorage.removeItem('currentView');
      
      // Clear ALL semester data for ALL users
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('semesterData_')) {
          localStorage.removeItem(key);
        }
      });
      
      // Also clear old format data
      localStorage.removeItem('semesterData');
    } catch (error) {
      console.error('Error clearing user data:', error);
    }
  };

  const updateCurrentView = (view) => {
    setCurrentView(view);
    try {
      localStorage.setItem('currentView', view);
    } catch (error) {
      console.error('Error saving current view:', error);
    }
  };

  const value = {
    user,
    login,
    updateUser,
    logout,
    loading,
    currentView,
    updateCurrentView
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};