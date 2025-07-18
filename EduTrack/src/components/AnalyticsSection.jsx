import React, { useState } from 'react';
import { 
  TrendingUp, 
  BarChart3, 
  PieChart, 
  Award,
  BookOpen,
  Calendar,
  Target,
  Star,
  User
} from 'lucide-react';
import { useData } from '../context/DataContext.jsx';

const AnalyticsSection = ({ user: currentUser }) => {
  const { semesters, calculateCGPA } = useData();
  const [selectedView, setSelectedView] = useState('overview');

  // Safe data processing
  const safeSemesters = Array.isArray(semesters) ? semesters : [];
  
  // Get the student name from the most recent semester
  const displayName = safeSemesters.length > 0 ? safeSemesters[safeSemesters.length - 1].studentName : currentUser?.name || 'Unknown';
  const isViewingOwnData = safeSemesters.length === 0 || safeSemesters[safeSemesters.length - 1].studentName === currentUser?.name;

  const currentCGPA = calculateCGPA();
  const totalCredits = safeSemesters.reduce((sum, sem) => {
    const validSubjects = (sem.subjects || []).filter(subject => 
      subject.grade && !['U', 'RA', 'u', 'ra'].includes(subject.grade.toUpperCase())
    );
    return sum + validSubjects.reduce((credSum, subject) => credSum + (subject.credits || 0), 0);
  }, 0);
  
  const totalSubjects = safeSemesters.reduce((sum, sem) => sum + (sem.totalSubjects || 0), 0);

  // Calculate grade distribution safely
  const gradeDistribution = {};
  safeSemesters.forEach(sem => {
    if (sem.subjects && Array.isArray(sem.subjects)) {
      sem.subjects.forEach(subject => {
        if (subject.grade && !['U', 'RA', 'u', 'ra'].includes(subject.grade.toUpperCase())) {
          const grade = subject.grade.toUpperCase();
          gradeDistribution[grade] = (gradeDistribution[grade] || 0) + 1;
        }
      });
    }
  });

  // Calculate best and worst performing subjects safely
  const allSubjects = safeSemesters.flatMap(sem => (sem.subjects || []).filter(subject => 
    subject.grade && !['U', 'RA', 'u', 'ra'].includes(subject.grade.toUpperCase())
  ));
  
  const subjectPerformance = allSubjects.reduce((acc, subject) => {
    if (subject.name && subject.points !== undefined) {
      if (!acc[subject.name]) {
        acc[subject.name] = { total: 0, count: 0, grades: [] };
      }
      acc[subject.name].total += subject.points;
      acc[subject.name].count += 1;
      acc[subject.name].grades.push(subject.grade);
    }
    return acc;
  }, {});

  const bestSubjects = Object.entries(subjectPerformance)
    .map(([name, data]) => ({
      name,
      avgPoints: data.total / data.count,
      grades: data.grades
    }))
    .sort((a, b) => b.avgPoints - a.avgPoints)
    .slice(0, 5);

  const worstSubjects = Object.entries(subjectPerformance)
    .map(([name, data]) => ({
      name,
      avgPoints: data.total / data.count,
      grades: data.grades
    }))
    .sort((a, b) => a.avgPoints - b.avgPoints)
    .slice(0, 5);

  // Calculate semester trends safely
  const semesterTrends = safeSemesters.map(sem => ({
    name: sem.name || `Semester ${sem.semester || 'Unknown'}`,
    sgpa: sem.sgpa || 0,
    credits: sem.totalCredits || 0
  }));

  const viewTabs = [
    { id: 'overview', name: 'Overview', icon: BarChart3 },
    { id: 'trends', name: 'Trends', icon: TrendingUp },
    { id: 'subjects', name: 'Subjects', icon: BookOpen },
    { id: 'grades', name: 'Grades', icon: Award }
  ];

  if (safeSemesters.length === 0) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="w-24 h-24 text-gray-600 mx-auto mb-6" />
        <h2 className="text-2xl font-bold text-white mb-4">No Academic Data Available</h2>
        <p className="text-gray-400 mb-6">Upload your first marksheet to see analytics</p>
        <button className="bg-yellow-400 text-gray-900 px-6 py-3 rounded-lg font-medium hover:bg-yellow-300 transition-colors duration-200">
          Upload Marksheet
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Student Info Header */}
      {!isViewingOwnData && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
          <div className="flex items-center space-x-2">
            <User className="w-5 h-5 text-blue-400" />
            <p className="text-blue-400 font-medium">Currently viewing analytics for: {displayName}</p>
          </div>
        </div>
      )}

      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-2xl p-6 text-gray-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-700 font-medium">Current CGPA</p>
              <p className="text-3xl font-bold">{currentCGPA}</p>
              <p className="text-gray-600 text-sm">{displayName}</p>
            </div>
            <Award className="w-12 h-12 text-gray-700" />
          </div>
        </div>
        <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 font-medium">Total Semesters</p>
              <p className="text-2xl font-bold text-white">{safeSemesters.length}</p>
            </div>
            <Calendar className="w-10 h-10 text-blue-400" />
          </div>
        </div>
        <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 font-medium">Valid Credits</p>
              <p className="text-2xl font-bold text-white">{totalCredits}</p>
            </div>
            <BookOpen className="w-10 h-10 text-green-400" />
          </div>
        </div>
        <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 font-medium">Total Subjects</p>
              <p className="text-2xl font-bold text-white">{totalSubjects}</p>
            </div>
            <Target className="w-10 h-10 text-purple-400" />
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-gray-800 rounded-2xl p-2 border border-gray-700">
        <div className="flex space-x-2">
          {viewTabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedView(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                  selectedView === tab.id
                    ? 'bg-yellow-400 text-gray-900 font-medium'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content based on selected view */}
      {selectedView === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* SGPA Trend Chart */}
          <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-4">SGPA Trend</h3>
            <div className="space-y-4">
              {semesterTrends.length > 0 ? semesterTrends.map((sem, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-700 rounded-lg p-3">
                  <div>
                    <p className="text-white font-medium">{sem.name}</p>
                    <p className="text-gray-400 text-sm">{sem.credits} credits</p>
                  </div>
                  <div className="text-right">
                    <p className="text-yellow-400 font-bold text-lg">{sem.sgpa}</p>
                    <div className="flex items-center space-x-1">
                      {index > 0 && (
                        <span className={`text-xs ${
                          sem.sgpa > semesterTrends[index - 1].sgpa 
                            ? 'text-green-400' 
                            : sem.sgpa < semesterTrends[index - 1].sgpa 
                              ? 'text-red-400' 
                              : 'text-gray-400'
                        }`}>
                          {sem.sgpa > semesterTrends[index - 1].sgpa ? '↑' : 
                           sem.sgpa < semesterTrends[index - 1].sgpa ? '↓' : '→'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )) : (
                <p className="text-gray-400 text-center py-4">No semester data available</p>
              )}
            </div>
          </div>

          {/* Grade Distribution */}
          <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-4">Grade Distribution</h3>
            <div className="space-y-3">
              {Object.keys(gradeDistribution).length > 0 ? Object.entries(gradeDistribution)
                .sort(([,a], [,b]) => b - a)
                .map(([grade, count]) => {
                  const validSubjectCount = allSubjects.length;
                  const percentage = validSubjectCount > 0 ? (count / validSubjectCount) * 100 : 0;
                  return (
                    <div key={grade} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
                          <span className="text-gray-900 font-bold text-sm">{grade}</span>
                        </div>
                        <span className="text-white font-medium">Grade {grade}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-yellow-400 h-2 rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-gray-400 text-sm">{count}</span>
                      </div>
                    </div>
                  );
                }) : (
                <p className="text-gray-400 text-center py-4">No grade data available</p>
              )}
            </div>
          </div>
        </div>
      )}

      {selectedView === 'subjects' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Best Performing Subjects */}
          <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
              <Star className="w-6 h-6 text-yellow-400" />
              <span>Top Performing Subjects</span>
            </h3>
            <div className="space-y-3">
              {bestSubjects.length > 0 ? bestSubjects.map((subject, index) => (
                <div key={index} className="bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">{subject.name}</p>
                      <p className="text-gray-400 text-sm">
                        Grades: {subject.grades.join(', ')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-yellow-400 font-bold">{subject.avgPoints.toFixed(1)}</p>
                      <p className="text-gray-400 text-sm">Avg Points</p>
                    </div>
                  </div>
                </div>
              )) : (
                <p className="text-gray-400 text-center py-4">No subject data available</p>
              )}
            </div>
          </div>

          {/* Improvement Areas */}
          <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
              <Target className="w-6 h-6 text-red-400" />
              <span>Improvement Areas</span>
            </h3>
            <div className="space-y-3">
              {worstSubjects.length > 0 ? worstSubjects.map((subject, index) => (
                <div key={index} className="bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">{subject.name}</p>
                      <p className="text-gray-400 text-sm">
                        Grades: {subject.grades.join(', ')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-red-400 font-bold">{subject.avgPoints.toFixed(1)}</p>
                      <p className="text-gray-400 text-sm">Avg Points</p>
                    </div>
                  </div>
                </div>
              )) : (
                <p className="text-gray-400 text-center py-4">No subject data available</p>
              )}
            </div>
          </div>
        </div>
      )}

      {selectedView === 'trends' && (
        <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
          <h3 className="text-xl font-bold text-white mb-6">Academic Progress Timeline</h3>
          <div className="space-y-6">
            {safeSemesters.length > 0 ? safeSemesters.map((sem, index) => (
              <div key={sem.id} className="relative">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center">
                      <span className="text-gray-900 font-bold">{index + 1}</span>
                    </div>
                  </div>
                  <div className="flex-1 bg-gray-700 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-white font-medium">{sem.name || `Semester ${sem.semester}`}</h4>
                        <p className="text-gray-400 text-sm">{sem.year}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-yellow-400 font-bold text-xl">{sem.sgpa || 0}</p>
                        <p className="text-gray-400 text-sm">SGPA</p>
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-gray-800 rounded-lg p-3">
                        <p className="text-gray-400 text-sm">Subjects</p>
                        <p className="text-white font-medium">{sem.totalSubjects || 0}</p>
                      </div>
                      <div className="bg-gray-800 rounded-lg p-3">
                        <p className="text-gray-400 text-sm">Credits</p>
                        <p className="text-white font-medium">{sem.totalCredits || 0}</p>
                      </div>
                      <div className="bg-gray-800 rounded-lg p-3">
                        <p className="text-gray-400 text-sm">Status</p>
                        <p className={`font-medium ${(sem.sgpa || 0) >= 8 ? 'text-green-400' : (sem.sgpa || 0) >= 6 ? 'text-yellow-400' : 'text-red-400'}`}>
                          {(sem.sgpa || 0) >= 8 ? 'Excellent' : (sem.sgpa || 0) >= 6 ? 'Good' : 'Needs Improvement'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                {index < safeSemesters.length - 1 && (
                  <div className="ml-6 mt-2 w-0.5 h-8 bg-gray-700"></div>
                )}
              </div>
            )) : (
              <p className="text-gray-400 text-center py-8">No semester data available</p>
            )}
          </div>
        </div>
      )}

      {selectedView === 'grades' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Detailed Grade Analysis */}
          <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-4">Grade Analysis</h3>
            <div className="space-y-4">
              {Object.keys(gradeDistribution).length > 0 ? Object.entries(gradeDistribution)
                .sort(([,a], [,b]) => b - a)
                .map(([grade, count]) => {
                  const validSubjectCount = allSubjects.length;
                  const percentage = validSubjectCount > 0 ? ((count / validSubjectCount) * 100).toFixed(1) : '0.0';
                  return (
                    <div key={grade} className="bg-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center">
                            <span className="text-gray-900 font-bold">{grade}</span>
                          </div>
                          <div>
                            <p className="text-white font-medium">Grade {grade}</p>
                            <p className="text-gray-400 text-sm">{count} subjects</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-yellow-400 font-bold">{percentage}%</p>
                        </div>
                      </div>
                      <div className="w-full bg-gray-600 rounded-full h-2">
                        <div 
                          className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                }) : (
                <p className="text-gray-400 text-center py-4">No grade data available</p>
              )}
            </div>
          </div>

          {/* Performance Insights */}
          <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-4">Performance Insights</h3>
            <div className="space-y-4">
              <div className="bg-gray-700 rounded-lg p-4">
                <h4 className="text-yellow-400 font-medium mb-2">Overall Performance</h4>
                <p className="text-white">
                  Your current CGPA of {currentCGPA} places you in the{' '}
                  <span className="font-bold text-yellow-400">
                    {currentCGPA >= 9 ? 'Excellent' : 
                     currentCGPA >= 8 ? 'Very Good' : 
                     currentCGPA >= 7 ? 'Good' : 
                     currentCGPA >= 6 ? 'Average' : 'Below Average'}
                  </span>{' '}
                  category.
                </p>
              </div>
              
              <div className="bg-gray-700 rounded-lg p-4">
                <h4 className="text-green-400 font-medium mb-2">Strengths</h4>
                <ul className="text-white space-y-1">
                  {Object.entries(gradeDistribution)
                    .filter(([grade]) => ['O', 'A+', 'A'].includes(grade))
                    .map(([grade, count]) => (
                      <li key={grade}>• {count} subjects with {grade} grade</li>
                    ))}
                  {Object.keys(gradeDistribution).filter(grade => ['O', 'A+', 'A'].includes(grade)).length === 0 && (
                    <li className="text-gray-400">• No high-grade subjects yet</li>
                  )}
                </ul>
              </div>
              
              <div className="bg-gray-700 rounded-lg p-4">
                <h4 className="text-red-400 font-medium mb-2">Areas for Improvement</h4>
                <ul className="text-white space-y-1">
                  {Object.entries(gradeDistribution)
                    .filter(([grade]) => ['C', 'D', 'F'].includes(grade))
                    .map(([grade, count]) => (
                      <li key={grade}>• {count} subjects with {grade} grade</li>
                    ))}
                  {Object.keys(gradeDistribution).filter(grade => ['C', 'D', 'F'].includes(grade)).length === 0 && (
                    <li className="text-gray-400">• No low-grade subjects - Great job!</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsSection;