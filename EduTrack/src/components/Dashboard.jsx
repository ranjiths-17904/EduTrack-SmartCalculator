import React, { useState, useEffect } from 'react';
import { 
  Home, 
  Upload, 
  BarChart3, 
  FileText, 
  User, 
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import DashboardHome from './DashboardHome.jsx';
import UploadSection from './UploadSection.jsx';
import AnalyticsSection from './AnalyticsSection.jsx';
import SemesterManagement from './SemesterManagement.jsx';
import ProfileSection from './ProfileSection.jsx';
import FilesSection from './FilesSection.jsx';
import Logo from './Logo.jsx';

const Dashboard = () => {
  const { user, logout, currentView, updateCurrentView } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Set initial view from auth context
  const [activeTab, setActiveTab] = useState(currentView || 'home');

  useEffect(() => {
    setActiveTab(currentView || 'home');
  }, [currentView]);

  const navigation = [
    { id: 'home', name: 'Dashboard', icon: Home },
    { id: 'upload', name: 'Upload Marksheet', icon: Upload },
    { id: 'analytics', name: 'Analytics', icon: BarChart3 },
    { id: 'semesters', name: 'Manage Semesters', icon: FileText },
    { id: 'files', name: 'Files', icon: FileText },
    { id: 'profile', name: 'Profile', icon: User },
  ];

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    updateCurrentView(tabId);
    setSidebarOpen(false);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <DashboardHome user={user} />;
      case 'upload':
        return <UploadSection />;
      case 'analytics':
        return <AnalyticsSection />;
      case 'semesters':
        return <SemesterManagement />;
      case 'files':
        return <FilesSection />;
      case 'profile':
        return <ProfileSection user={user} />;
      default:
        return <DashboardHome />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-yellow-900">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-800 transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <Logo size="small" />
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-400 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="mt-6">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                className={`w-full flex items-center px-6 py-3 text-left transition-colors duration-200 ${
                  activeTab === item.id
                    ? 'bg-yellow-400 text-gray-900 font-medium'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5 mr-3" />
                {item.name}
              </button>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="flex items-center space-x-3 mb-4">
            <div className="bg-yellow-400 p-2 rounded-full">
              <User className="w-5 h-5 text-gray-900" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-white font-medium truncate">{user?.name}</p>
              <p className="text-gray-400 text-sm truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:ml-64">
        {/* Header */}
        <header className="bg-gray-800 shadow-lg">
          <div className="flex items-center justify-between px-4 sm:px-6 py-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-400 hover:text-white"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              {navigation.find(nav => nav.id === activeTab)?.name}
            </h2>
            <div className="hidden sm:flex items-center space-x-4">
              <span className="text-gray-300">Welcome back, {user?.name}! 👋</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="p-4 sm:p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;