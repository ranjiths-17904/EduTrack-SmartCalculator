import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const DataContext = createContext();

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

export const DataProvider = ({ children }) => {
  const { user } = useAuth();
  const [semesters, setSemesters] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      // Clear any existing data first to ensure fresh start
      setSemesters([]);
      loadUserData();
    } else {
      // Clear data when no user is logged in
      setSemesters([]);
    }
  }, [user]);

  const getUserDataKey = () => {
    return user ? `semesterData_${user.id}` : null;
  };

  const loadUserData = () => {
    const dataKey = getUserDataKey();
    if (!dataKey) return;

    try {
      const savedData = localStorage.getItem(dataKey);
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        // Ensure data belongs to current user only
        const userSemesters = Array.isArray(parsedData) ? parsedData.filter(sem => 
          sem.userId === user.id
        ) : [];
        setSemesters(userSemesters);
      } else {
        setSemesters([]);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      setSemesters([]);
    }
  };

  const saveUserData = (data) => {
    const dataKey = getUserDataKey();
    if (!dataKey) return;

    try {
      // Ensure all semesters belong to current user
      const userSpecificData = data.map(sem => ({
        ...sem,
        userId: user.id,
        ownerName: user.name
      }));
      
      setSemesters(userSpecificData);
      localStorage.setItem(dataKey, JSON.stringify(userSpecificData));
    } catch (error) {
      console.error('Error saving user data:', error);
    }
  };

  const addSemester = (semesterData) => {
    if (!user) return;

    // Ensure semester belongs to current user
    const newSemesterData = {
      ...semesterData,
      userId: user.id,
      ownerName: user.name,
      id: `${user.id}_${Date.now()}`,
      createdAt: new Date().toISOString()
    };

    const newSemesters = [...semesters, newSemesterData];
    saveUserData(newSemesters);
  };

  const updateSemester = (semesterId, semesterData) => {
    if (!user) return;

    const updatedSemesters = semesters.map(sem => 
      sem.id === semesterId ? { 
        ...sem, 
        ...semesterData, 
        userId: user.id,
        ownerName: user.name 
      } : sem
    );
    saveUserData(updatedSemesters);
  };

  const deleteSemester = (semesterId) => {
    if (!user) return;

    const filteredSemesters = semesters.filter(sem => 
      sem.id !== semesterId || sem.userId === user.id
    );
    saveUserData(filteredSemesters);
  };

  const calculateCGPA = () => {
    if (!user || !Array.isArray(semesters) || semesters.length === 0) return 0;
    
    // Double-check: Only calculate CGPA for current user's semesters
    const userSemesters = semesters.filter(sem => 
      sem.userId === user.id
    );

    if (userSemesters.length === 0) return 0;

    // Calculate CGPA: Total grade points / Total credits across all user's semesters
    const totalGradePoints = userSemesters.reduce((sum, sem) => {
      if (!sem.subjects || !Array.isArray(sem.subjects)) return sum;
      
      // Filter out U and RA grades
      const validSubjects = sem.subjects.filter(subject => 
        subject.grade && !['U', 'RA', 'u', 'ra'].includes(subject.grade.toUpperCase())
      );
      
      return sum + validSubjects.reduce((subSum, subject) => 
        subSum + ((subject.points || 0) * (subject.credits || 0)), 0
      );
    }, 0);

    const totalCredits = userSemesters.reduce((sum, sem) => {
      if (!sem.subjects || !Array.isArray(sem.subjects)) return sum;
      
      // Filter out U and RA grades
      const validSubjects = sem.subjects.filter(subject => 
        subject.grade && !['U', 'RA', 'u', 'ra'].includes(subject.grade.toUpperCase())
      );
      
      return sum + validSubjects.reduce((credSum, subject) => 
        credSum + (subject.credits || 0), 0
      );
    }, 0);
    
    return totalCredits > 0 ? (totalGradePoints / totalCredits).toFixed(2) : 0;
  };

  const getUserSemesters = () => {
    if (!user) return [];
    // Ensure only current user's semesters are returned
    return Array.isArray(semesters) ? semesters.filter(sem => 
      sem.userId === user.id
    ) : [];
  };

  const clearUserData = () => {
    setSemesters([]);
    const dataKey = getUserDataKey();
    if (dataKey) {
      localStorage.removeItem(dataKey);
    }
  };

  const switchUser = (newUser) => {
    // Clear current data before switching
    setSemesters([]);
    // Load new user's data will happen in useEffect
  };

  const ensureDataIntegrity = () => {
    if (!user || !Array.isArray(semesters)) return;
    
    // Remove any semesters that don't belong to current user
    const validSemesters = semesters.filter(sem => sem.userId === user.id);
    if (validSemesters.length !== semesters.length) {
      setSemesters(validSemesters);
      saveUserData(validSemesters);
    }
  };

  // Run data integrity check when user or semesters change
  useEffect(() => {
    ensureDataIntegrity();
  }, [user, semesters]);

  const debugUserData = () => {
    console.log('Current User:', user);
    console.log('Current Semesters:', semesters);
    console.log('LocalStorage Keys:', Object.keys(localStorage).filter(k => k.startsWith('semester')));
  };

  // Debug function (remove in production)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      window.debugUserData = debugUserData;
    }
  }, [user, semesters]);

  const value = {
    semesters: getUserSemesters(),
    loading,
    addSemester,
    updateSemester,
    deleteSemester,
    calculateCGPA,
    clearUserData,
    switchUser
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};