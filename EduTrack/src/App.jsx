import React, { useState, useEffect } from 'react';
import AuthSystem from './components/AuthSystem.jsx';
import Dashboard from './components/Dashboard.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { DataProvider } from './context/DataContext.jsx';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-yellow-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <p className="text-yellow-400 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthProvider>
      <DataProvider>
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-yellow-900">
          {user ? (
            <Dashboard user={user} onLogout={() => setUser(null)} />
          ) : (
            <AuthSystem onLogin={setUser} />
          )}
        </div>
      </DataProvider>
    </AuthProvider>
  );
}

export default App;