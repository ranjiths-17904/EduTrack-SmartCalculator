import React, { useState } from 'react';
import { 
  Calendar, 
  Edit3, 
  Trash2, 
  Eye, 
  BookOpen,
  Award,
  User,
  AlertTriangle,
  CheckCircle,
  X,
  Search,
  Filter
} from 'lucide-react';
import { useData } from '../context/DataContext.jsx';

const SemesterManagement = ({ user: currentUser }) => {
  const { semesters, deleteSemester, updateSemester } = useData();
  const [selectedSemester, setSelectedSemester] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [editingSemester, setEditingSemester] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStudent, setFilterStudent] = useState('all');

  // Safe data processing
  const safeSemesters = Array.isArray(semesters) ? semesters : [];

  // Get unique student names for filter
  const uniqueStudents = [...new Set(safeSemesters.map(sem => sem.studentName || 'Unknown'))];

  // Filter semesters based on search and filter
  const filteredSemesters = safeSemesters.filter(semester => {
    const matchesSearch = !searchTerm || 
      (semester.name && semester.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (semester.studentName && semester.studentName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (semester.year && semester.year.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesFilter = filterStudent === 'all' || semester.studentName === filterStudent;
    
    return matchesSearch && matchesFilter;
  });

  // Group semesters by student name
  const semestersByStudent = filteredSemesters.reduce((acc, semester) => {
    const studentName = semester.studentName || 'Unknown Student';
    if (!acc[studentName]) {
      acc[studentName] = [];
    }
    acc[studentName].push(semester);
    return acc;
  }, {});

  const handleViewDetails = (semester) => {
    setSelectedSemester(semester);
  };

  const handleDeleteSemester = (semesterId) => {
    try {
      deleteSemester(semesterId);
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting semester:', error);
    }
  };

  const handleEditSemester = (semester) => {
    setEditingSemester({ 
      ...semester,
      subjects: Array.isArray(semester.subjects) ? semester.subjects : []
    });
  };

  const handleSaveEdit = () => {
    try {
      if (editingSemester && editingSemester.id) {
        updateSemester(editingSemester.id, editingSemester);
        setEditingSemester(null);
      }
    } catch (error) {
      console.error('Error updating semester:', error);
    }
  };

  const handleSubjectEdit = (subjectId, updatedSubject) => {
    if (!editingSemester || !Array.isArray(editingSemester.subjects)) return;

    const updatedSubjects = editingSemester.subjects.map(subject =>
      subject.id === subjectId ? updatedSubject : subject
    );
    
    // Filter out U and RA grades for calculation
    const validSubjects = updatedSubjects.filter(subject => 
      subject.grade && !['U', 'RA', 'u', 'ra'].includes(subject.grade.toUpperCase())
    );
    
    const totalCredits = validSubjects.reduce((sum, subject) => sum + (subject.credits || 0), 0);
    const totalPoints = validSubjects.reduce((sum, subject) => sum + ((subject.points || 0) * (subject.credits || 0)), 0);
    const sgpa = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : 0;

    setEditingSemester({
      ...editingSemester,
      subjects: updatedSubjects,
      totalCredits,
      totalSubjects: updatedSubjects.length,
      sgpa: parseFloat(sgpa)
    });
  };

  const gradePoints = {
    'O': 10, 'A+': 9, 'A': 8, 'B+': 7, 'B': 6, 'C': 5, 'D': 4, 'F': 0, 'U': 0, 'RA': 0
  };

  if (safeSemesters.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar className="w-24 h-24 text-gray-600 mx-auto mb-6" />
        <h2 className="text-2xl font-bold text-white mb-4">No Semesters Found</h2>
        <p className="text-gray-400 mb-6">Upload your first marksheet to start managing semesters</p>
        <button className="bg-yellow-400 text-gray-900 px-6 py-3 rounded-lg font-medium hover:bg-yellow-300 transition-colors duration-200">
          Upload Marksheet
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filter */}
      <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by semester name, student, or year..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
            </div>
          </div>
          <div className="md:w-64">
            <div className="relative">
              <Filter className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <select
                value={filterStudent}
                onChange={(e) => setFilterStudent(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
              >
                <option value="all">All Students</option>
                {uniqueStudents.map(student => (
                  <option key={student} value={student}>{student}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
        <p className="text-gray-400">
          Showing {filteredSemesters.length} of {safeSemesters.length} semesters
          {filterStudent !== 'all' && ` for ${filterStudent}`}
        </p>
      </div>

      {/* Semesters Grouped by Student */}
      {Object.keys(semestersByStudent).length === 0 ? (
        <div className="text-center py-12">
          <Search className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">No Results Found</h3>
          <p className="text-gray-400">Try adjusting your search or filter criteria</p>
        </div>
      ) : (
        Object.entries(semestersByStudent).map(([studentName, studentSemesters]) => (
          <div key={studentName} className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="bg-yellow-400 p-2 rounded-full">
                <User className="w-5 h-5 text-gray-900" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">{studentName}</h2>
                <p className="text-gray-400">{studentSemesters.length} semester{studentSemesters.length !== 1 ? 's' : ''} • CGPA: {
                  (() => {
                    const totalGradePoints = studentSemesters.reduce((sum, sem) => {
                      const validSubjects = (sem.subjects || []).filter(subject => 
                        subject.grade && !['U', 'RA', 'u', 'ra'].includes(subject.grade.toUpperCase())
                      );
                      return sum + validSubjects.reduce((subSum, subject) => subSum + ((subject.points || 0) * (subject.credits || 0)), 0);
                    }, 0);
                    const totalCredits = studentSemesters.reduce((sum, sem) => {
                      const validSubjects = (sem.subjects || []).filter(subject => 
                        subject.grade && !['U', 'RA', 'u', 'ra'].includes(subject.grade.toUpperCase())
                      );
                      return sum + validSubjects.reduce((credSum, subject) => credSum + (subject.credits || 0), 0);
                    }, 0);
                    return totalCredits > 0 ? (totalGradePoints / totalCredits).toFixed(2) : '0.00';
                  })()
                }</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {studentSemesters.map((semester) => (
                <div key={semester.id} className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-white">{semester.name || `Semester ${semester.semester}`}</h3>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleViewDetails(semester)}
                        className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEditSemester(semester)}
                        className="p-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors duration-200"
                        title="Edit Semester"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(semester.id)}
                        className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200"
                        title="Delete Semester"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Academic Year</span>
                      <span className="text-white font-medium">{semester.year || 'N/A'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">SGPA</span>
                      <span className="text-yellow-400 font-bold text-lg">{semester.sgpa || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Subjects</span>
                      <span className="text-white font-medium">{semester.totalSubjects || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Credits</span>
                      <span className="text-white font-medium">{semester.totalCredits || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Method</span>
                      <span className="text-white font-medium">{semester.uploadMethod === 'upload' ? 'OCR Upload' : 'Manual Entry'}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm">Added on</span>
                      <span className="text-gray-500 text-sm">
                        {semester.uploadDate ? new Date(semester.uploadDate).toLocaleDateString() : 'Unknown'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-2xl p-8 max-w-md w-full mx-4 border border-gray-700">
            <div className="flex items-center space-x-4 mb-6">
              <div className="bg-red-500 p-3 rounded-full">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Delete Semester</h3>
                <p className="text-gray-400">This action cannot be undone.</p>
              </div>
            </div>
            
            <p className="text-gray-300 mb-6">
              Are you sure you want to delete this semester? All associated data will be permanently removed.
            </p>
            
            <div className="flex space-x-4">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 bg-gray-600 text-white py-3 rounded-lg font-medium hover:bg-gray-700 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteSemester(showDeleteConfirm)}
                className="flex-1 bg-red-500 text-white py-3 rounded-lg font-medium hover:bg-red-600 transition-colors duration-200"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {selectedSemester && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-2xl p-8 max-w-4xl w-full mx-4 border border-gray-700 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white">{selectedSemester.name || `Semester ${selectedSemester.semester}`}</h3>
              <button
                onClick={() => setSelectedSemester(null)}
                className="p-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Semester Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-700 rounded-xl p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Award className="w-5 h-5 text-yellow-400" />
                  <span className="text-gray-400">SGPA</span>
                </div>
                <p className="text-2xl font-bold text-yellow-400">{selectedSemester.sgpa || 0}</p>
              </div>
              <div className="bg-gray-700 rounded-xl p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <BookOpen className="w-5 h-5 text-blue-400" />
                  <span className="text-gray-400">Subjects</span>
                </div>
                <p className="text-2xl font-bold text-white">{selectedSemester.totalSubjects || 0}</p>
              </div>
              <div className="bg-gray-700 rounded-xl p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <User className="w-5 h-5 text-green-400" />
                  <span className="text-gray-400">Credits</span>
                </div>
                <p className="text-2xl font-bold text-white">{selectedSemester.totalCredits || 0}</p>
              </div>
              <div className="bg-gray-700 rounded-xl p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Calendar className="w-5 h-5 text-purple-400" />
                  <span className="text-gray-400">Year</span>
                </div>
                <p className="text-2xl font-bold text-white">{selectedSemester.year || 'N/A'}</p>
              </div>
            </div>

            {/* Subjects List */}
            <div className="space-y-3">
              <h4 className="text-lg font-bold text-white">Subjects</h4>
              {selectedSemester.subjects && Array.isArray(selectedSemester.subjects) && selectedSemester.subjects.length > 0 ? (
                selectedSemester.subjects.map((subject) => {
                  const isExcluded = subject.grade && ['U', 'RA', 'u', 'ra'].includes(subject.grade.toUpperCase());
                  return (
                    <div key={subject.id} className={`rounded-xl p-4 ${isExcluded ? 'bg-red-900/20 border border-red-500/30' : 'bg-gray-700'}`}>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-gray-400 text-sm">Subject Code</p>
                          <p className={`font-medium ${isExcluded ? 'text-red-300 line-through' : 'text-white'}`}>
                            {subject.code || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm">Subject Name</p>
                          <p className={`font-medium ${isExcluded ? 'text-red-300 line-through' : 'text-white'}`}>
                            {subject.name || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm">Grade</p>
                          <div className="flex items-center space-x-2">
                            <p className={`font-bold ${isExcluded ? 'text-red-400' : 'text-yellow-400'}`}>
                              {subject.grade || 'N/A'}
                            </p>
                            {isExcluded && (
                              <span className="text-red-400 text-xs bg-red-900/30 px-2 py-1 rounded">
                                Not counted
                              </span>
                            )}
                          </div>
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm">Credits</p>
                          <p className={`font-medium ${isExcluded ? 'text-red-300 line-through' : 'text-white'}`}>
                            {subject.credits || 0}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-gray-400 text-center py-4">No subjects found</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Semester Modal */}
      {editingSemester && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-2xl p-8 max-w-6xl w-full mx-4 border border-gray-700 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white">Edit {editingSemester.name || `Semester ${editingSemester.semester}`}</h3>
              <button
                onClick={() => setEditingSemester(null)}
                className="p-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <input
                type="text"
                value={editingSemester.name || ''}
                onChange={(e) => setEditingSemester({...editingSemester, name: e.target.value})}
                className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                placeholder="Semester Name"
              />
              <input
                type="text"
                value={editingSemester.year || ''}
                onChange={(e) => setEditingSemester({...editingSemester, year: e.target.value})}
                className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                placeholder="Academic Year"
              />
              <div className="bg-gray-700 rounded-lg px-4 py-2 flex items-center">
                <span className="text-gray-400 mr-2">SGPA:</span>
                <span className="text-yellow-400 font-bold">{editingSemester.sgpa || 0}</span>
              </div>
            </div>

            {/* Subjects */}
            <div className="space-y-4">
              <h4 className="text-lg font-bold text-white">Subjects</h4>
              {editingSemester.subjects && Array.isArray(editingSemester.subjects) && editingSemester.subjects.length > 0 ? (
                editingSemester.subjects.map((subject) => {
                  const isExcluded = subject.grade && ['U', 'RA', 'u', 'ra'].includes(subject.grade.toUpperCase());
                  return (
                    <div key={subject.id} className={`rounded-xl p-4 ${isExcluded ? 'bg-red-900/20 border border-red-500/30' : 'bg-gray-700'}`}>
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <input
                          type="text"
                          value={subject.code || ''}
                          onChange={(e) => handleSubjectEdit(subject.id, {...subject, code: e.target.value})}
                          className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                          placeholder="Subject Code"
                        />
                        <input
                          type="text"
                          value={subject.name || ''}
                          onChange={(e) => handleSubjectEdit(subject.id, {...subject, name: e.target.value})}
                          className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                          placeholder="Subject Name"
                        />
                        <select
                          value={subject.grade || 'A'}
                          onChange={(e) => handleSubjectEdit(subject.id, {...subject, grade: e.target.value, points: gradePoints[e.target.value] || 0})}
                          className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                        >
                          {Object.keys(gradePoints).map(grade => (
                            <option key={grade} value={grade}>{grade}</option>
                          ))}
                        </select>
                        <input
                          type="number"
                          value={subject.credits || 0}
                          onChange={(e) => handleSubjectEdit(subject.id, {...subject, credits: parseInt(e.target.value) || 0})}
                          className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                          placeholder="Credits"
                          min="0"
                          max="10"
                        />
                        <div className="flex items-center justify-center">
                          <span className={`font-bold ${isExcluded ? 'text-red-400' : 'text-yellow-400'}`}>
                            {subject.points || 0}
                            {isExcluded && <span className="text-xs ml-1">(Excluded)</span>}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-gray-400 text-center py-4">No subjects found</p>
              )}
            </div>

            {/* Save Button */}
            <div className="flex justify-end space-x-4 mt-6">
              <button
                onClick={() => setEditingSemester(null)}
                className="bg-gray-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-700 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="bg-yellow-400 text-gray-900 px-6 py-3 rounded-lg font-medium hover:bg-yellow-300 transition-colors duration-200 flex items-center space-x-2"
              >
                <CheckCircle className="w-5 h-5" />
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SemesterManagement;