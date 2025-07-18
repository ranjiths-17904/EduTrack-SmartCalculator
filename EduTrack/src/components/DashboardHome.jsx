import React from 'react';
import { 
  TrendingUp, 
  BookOpen, 
  Award, 
  Calendar,
  Upload,
  BarChart3,
  Users,
  Star
} from 'lucide-react';
import { useData } from '../context/DataContext.jsx';

const DashboardHome = ({ user: currentUser }) => {
  const { semesters, calculateCGPA } = useData();

  // Get the most recent semester's student name or use current user
  const displayName = currentUser?.name || 'User';
  const isViewingOwnData = true; // Always viewing own data now due to proper isolation

  const totalCredits = semesters.reduce((sum, sem) => sum + sem.totalCredits, 0);
  const totalSemesters = semesters.length;
  const currentCGPA = calculateCGPA();
  const averageSGPA = semesters.length > 0 
    ? (semesters.reduce((sum, sem) => sum + sem.sgpa, 0) / semesters.length).toFixed(2)
    : 0;

  const recentSemesters = semesters.slice(-3).reverse();

  const stats = [
    {
      title: 'Current CGPA',
      value: currentCGPA,
      icon: Award,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-400/10'
    },
    {
      title: 'Total Semesters',
      value: totalSemesters,
      icon: Calendar,
      color: 'text-blue-400',
      bgColor: 'bg-blue-400/10'
    },
    {
      title: 'Total Credits',
      value: totalCredits,
      icon: BookOpen,
      color: 'text-green-400',
      bgColor: 'bg-green-400/10'
    },
    {
      title: 'Average SGPA',
      value: averageSGPA,
      icon: TrendingUp,
      color: 'text-purple-400',
      bgColor: 'bg-purple-400/10'
    }
  ];

  const quickActions = [
    {
      title: 'Upload Marksheet',
      description: 'Add a new semester marksheet',
      icon: Upload,
      color: 'bg-yellow-400',
      textColor: 'text-gray-900'
    },
    {
      title: 'View Analytics',
      description: 'Check your performance trends',
      icon: BarChart3,
      color: 'bg-blue-500',
      textColor: 'text-white'
    },
    {
      title: 'Manage Semesters',
      description: 'Edit or delete semester data',
      icon: Users,
      color: 'bg-green-500',
      textColor: 'text-white'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-2xl p-6 text-gray-900">
        <div className="flex items-center space-x-4">
          <div className="bg-white p-3 rounded-full">
            <Star className="w-8 h-8 text-yellow-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">
              {isViewingOwnData ? `Welcome back, ${displayName}! 👋` : `Viewing ${displayName}'s Performance 📊`}
            </h1>
            <p className="text-gray-700 mt-1">
              {isViewingOwnData 
                ? "Ready to track your academic progress? Let's see how you're doing!" 
                : `Here's ${displayName}'s academic performance overview`}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-full ${stat.bgColor}`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-gray-400 text-sm">{stat.title}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
        <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <div key={index} className="bg-gray-700 rounded-xl p-4 hover:bg-gray-600 transition-colors duration-200 cursor-pointer">
                <div className={`p-3 rounded-full ${action.color} w-fit mb-3`}>
                  <Icon className={`w-6 h-6 ${action.textColor}`} />
                </div>
                <h3 className="text-white font-medium mb-1">{action.title}</h3>
                <p className="text-gray-400 text-sm">{action.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Semesters */}
      <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
        <h2 className="text-xl font-bold text-white mb-4">Recent Semesters</h2>
        {recentSemesters.length > 0 ? (
          <div className="space-y-3">
            {recentSemesters.map((semester, index) => (
              <div key={semester.id} className="bg-gray-700 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-medium">{semester.name}</h3>
                    <p className="text-gray-400 text-sm">{semester.totalSubjects} subjects • {semester.totalCredits} credits</p>
                  </div>
                  <div className="text-right">
                    <p className="text-yellow-400 font-bold text-lg">{semester.sgpa}</p>
                    <p className="text-gray-400 text-sm">SGPA</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <BookOpen className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No semesters added yet</p>
            <p className="text-gray-500 text-sm mt-1">Upload your first marksheet to get started!</p>
          </div>
        )}
      </div>

      {/* Performance Insight */}
      {totalSemesters > 0 && (
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 text-white">
          <h2 className="text-xl font-bold mb-4">Performance Insight</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-blue-100 mb-2">Your CGPA Trend</p>
              <p className="text-2xl font-bold">{currentCGPA}</p>
              <p className="text-blue-200 text-sm">
                {currentCGPA >= 9 ? 'Excellent performance! 🌟' : 
                 currentCGPA >= 8 ? 'Great work! Keep it up! 💪' : 
                 currentCGPA >= 7 ? 'Good progress! 📈' : 
                 'There\'s room for improvement! 🎯'}
              </p>
            </div>
            <div>
              <p className="text-blue-100 mb-2">Academic Journey</p>
              <p className="text-2xl font-bold">{totalSemesters} Semesters</p>
              <p className="text-blue-200 text-sm">
                {totalCredits} total credits completed
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardHome;