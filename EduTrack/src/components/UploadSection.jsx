import React, { useState, useEffect } from 'react';
import { 
  Upload, 
  Camera, 
  FileText, 
  AlertCircle, 
  CheckCircle,
  Eye,
  Edit3,
  Save,
  X,
  Plus,
  User,
  Calendar,
  Download,
  Trash2,
  File,
  HardDrive
} from 'lucide-react';
import { useData } from '../context/DataContext.jsx';
import { FileStorage } from '../utils/FileStorage.js';

const UploadSection = () => {
  const [step, setStep] = useState(1);
  const [selectedFile, setSelectedFile] = useState(null);
  const [extractedData, setExtractedData] = useState([]);
  const [semesterInfo, setSemesterInfo] = useState({
    studentName: '',
    name: '',
    year: '',
    semester: '',
    rollNumber: '',
    institution: ''
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [uploadMethod, setUploadMethod] = useState('upload');
  const [fileError, setFileError] = useState('');
  const [savedFileId, setSavedFileId] = useState(null);
  const [showFilesList, setShowFilesList] = useState(false);
  const [userFiles, setUserFiles] = useState([]);

  const { addSemester } = useData();
  const fileStorage = new FileStorage();

  // Mock user ID - in a real app, this would come from authentication
  const userId = 'user_123';

  useEffect(() => {
    // Load user files on component mount
    loadUserFiles();
  }, []);

  const loadUserFiles = () => {
    const files = fileStorage.getFiles(userId);
    setUserFiles(files);
  };

  const gradePoints = {
    'O': 10, 'A+': 9, 'A': 8, 'B+': 7, 'B': 6, 'C': 5, 'D': 4, 'F': 0
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setFileError('');
      fileStorage.validateFile(file);
      setSelectedFile(file);
      setStep(2);
    } catch (error) {
      setFileError(error.message);
      setSelectedFile(null);
    }
  };

  const simulateAdvancedOCR = async () => {
    setIsProcessing(true);
    
    try {
      // Save file to storage
      const semesterId = `${semesterInfo.semester}_${semesterInfo.year}`;
      const fileId = await fileStorage.saveFile(selectedFile, userId, semesterId);
      setSavedFileId(fileId);
      
      // Simulate OCR processing delay
      await new Promise(resolve => setTimeout(resolve, 4000));
      
      // Enhanced mock data with more realistic extraction
      const mockData = [
        { id: 1, code: 'CS201', name: 'Data Structures and Algorithms', grade: 'A+', credits: 4, points: 9 },
        { id: 2, code: 'CS202', name: 'Computer Organization', grade: 'A', credits: 3, points: 8 },
        { id: 3, code: 'CS203', name: 'Database Management Systems', grade: 'O', credits: 4, points: 10 },
        { id: 4, code: 'MA201', name: 'Discrete Mathematics', grade: 'A', credits: 4, points: 8 },
        { id: 5, code: 'CS204', name: 'Operating Systems', grade: 'A+', credits: 4, points: 9 },
        { id: 6, code: 'CS205', name: 'Software Engineering', grade: 'A', credits: 3, points: 8 },
        { id: 7, code: 'CS206', name: 'Computer Networks', grade: 'B+', credits: 3, points: 7 },
        { id: 8, code: 'CS207', name: 'Web Technologies Lab', grade: 'O', credits: 2, points: 10 },
        { id: 9, code: 'CS208', name: 'DBMS Lab', grade: 'A+', credits: 2, points: 9 }
      ];
      
      setExtractedData(mockData);
      setIsProcessing(false);
      setStep(3);
      
      // Reload user files
      loadUserFiles();
    } catch (error) {
      setFileError(error.message);
      setIsProcessing(false);
    }
  };

  const handleManualEntry = () => {
    setUploadMethod('manual');
    setStep(3);
    setExtractedData([]);
  };

  const handleEditSubject = (subject) => {
    setEditingSubject({ ...subject });
  };

  const handleSaveEdit = () => {
    const updatedData = extractedData.map(item => 
      item.id === editingSubject.id ? {
        ...editingSubject,
        points: gradePoints[editingSubject.grade] || 0
      } : item
    );
    setExtractedData(updatedData);
    setEditingSubject(null);
  };

  const handleAddSubject = () => {
    const newSubject = {
      id: Date.now(),
      code: '',
      name: '',
      grade: 'A',
      credits: 3,
      points: 8
    };
    setExtractedData([...extractedData, newSubject]);
    setEditingSubject(newSubject);
  };

  const handleRemoveSubject = (id) => {
    setExtractedData(extractedData.filter(item => item.id !== id));
  };

  const calculateSGPA = () => {
    const totalCredits = extractedData.reduce((sum, item) => sum + item.credits, 0);
    const totalPoints = extractedData.reduce((sum, item) => sum + (item.points * item.credits), 0);
    return totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : 0;
  };

  const handleFinalSubmit = () => {
    const totalCredits = extractedData.reduce((sum, item) => sum + item.credits, 0);
    const sgpa = calculateSGPA();

    const semesterData = {
      id: Date.now().toString(),
      studentName: semesterInfo.studentName,
      name: semesterInfo.name,
      year: semesterInfo.year,
      semester: semesterInfo.semester,
      rollNumber: semesterInfo.rollNumber,
      institution: semesterInfo.institution,
      subjects: extractedData,
      totalCredits,
      totalSubjects: extractedData.length,
      sgpa: parseFloat(sgpa),
      uploadDate: new Date().toISOString(),
      uploadMethod: uploadMethod,
      marksheetFile: selectedFile?.name || 'manual_entry',
      fileId: savedFileId
    };

    addSemester(semesterData);
    
    // Reset form
    setStep(1);
    setSelectedFile(null);
    setExtractedData([]);
    setSemesterInfo({ studentName: '', name: '', year: '', semester: '', rollNumber: '', institution: '' });
    setUploadMethod('upload');
    setSavedFileId(null);
    setFileError('');
  };

  const handleDownloadFile = (fileId) => {
    try {
      fileStorage.downloadFile(userId, fileId);
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Error downloading file: ' + error.message);
    }
  };

  const handleDeleteFile = (fileId) => {
    if (window.confirm('Are you sure you want to delete this file?')) {
      try {
        fileStorage.deleteFile(userId, fileId);
        loadUserFiles();
      } catch (error) {
        console.error('Error deleting file:', error);
        alert('Error deleting file: ' + error.message);
      }
    }
  };

  const StorageMeter = () => {
    const totalSize = fileStorage.getUserStorageSize(userId);
    const maxSize = 50 * 1024 * 1024; // 50MB limit
    const percentUsed = (totalSize / maxSize) * 100;

    return (
      <div className="bg-gray-700 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <HardDrive className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-300">Storage Used</span>
          </div>
          <span className="text-sm text-gray-400">
            {fileStorage.formatFileSize(totalSize)} / {fileStorage.formatFileSize(maxSize)}
          </span>
        </div>
        <div className="w-full bg-gray-600 rounded-full h-2">
          <div 
            className={`h-2 rounded-full ${percentUsed > 80 ? 'bg-red-500' : percentUsed > 60 ? 'bg-yellow-500' : 'bg-green-500'}`}
            style={{ width: `${Math.min(percentUsed, 100)}%` }}
          />
        </div>
      </div>
    );
  };

  const FilesList = () => (
    <div className="bg-gray-700 rounded-xl p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Your Uploaded Files</h3>
        <button
          onClick={() => setShowFilesList(!showFilesList)}
          className="text-yellow-400 hover:text-yellow-300"
        >
          {showFilesList ? 'Hide' : 'Show'} Files
        </button>
      </div>
      
      <StorageMeter />
      
      {showFilesList && (
        <div className="space-y-3 max-h-60 overflow-y-auto">
          {userFiles.length === 0 ? (
            <p className="text-gray-400 text-center py-4">No files uploaded yet</p>
          ) : (
            userFiles.map(file => (
              <div key={file.id} className="flex items-center justify-between bg-gray-600 rounded-lg p-3">
                <div className="flex items-center space-x-3">
                  <File className="w-5 h-5 text-blue-400" />
                  <div>
                    <p className="text-white font-medium">{file.name}</p>
                    <p className="text-gray-400 text-sm">
                      {fileStorage.formatFileSize(file.size)} • {new Date(file.uploadDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleDownloadFile(file.id)}
                    className="text-green-400 hover:text-green-300 p-1"
                    title="Download"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteFile(file.id)}
                    className="text-red-400 hover:text-red-300 p-1"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {[1, 2, 3, 4].map((stepNum) => (
            <div key={stepNum} className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                step >= stepNum ? 'bg-yellow-400 text-gray-900' : 'bg-gray-700 text-gray-400'
              }`}>
                {stepNum}
              </div>
              {stepNum < 4 && (
                <div className={`w-16 h-1 mx-2 ${
                  step > stepNum ? 'bg-yellow-400' : 'bg-gray-700'
                }`} />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-sm">
          <span className={step >= 1 ? 'text-yellow-400' : 'text-gray-400'}>Choose Method</span>
          <span className={step >= 2 ? 'text-yellow-400' : 'text-gray-400'}>Process/Enter</span>
          <span className={step >= 3 ? 'text-yellow-400' : 'text-gray-400'}>Review & Edit</span>
          <span className={step >= 4 ? 'text-yellow-400' : 'text-gray-400'}>Complete</span>
        </div>
      </div>

      {/* Files List */}
      {userFiles.length > 0 && <FilesList />}

      {/* Step 1: Choose Upload Method */}
      {step === 1 && (
        <div className="space-y-6">
          {/* Student Information Form */}
          <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center space-x-2">
              <User className="w-6 h-6 text-yellow-400" />
              <span>Student Information</span>
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Student Name *</label>
                <input
                  type="text"
                  value={semesterInfo.studentName}
                  onChange={(e) => setSemesterInfo({...semesterInfo, studentName: e.target.value})}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  placeholder="Enter student's full name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Roll Number</label>
                <input
                  type="text"
                  value={semesterInfo.rollNumber}
                  onChange={(e) => setSemesterInfo({...semesterInfo, rollNumber: e.target.value})}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  placeholder="Enter roll number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Institution</label>
                <input
                  type="text"
                  value={semesterInfo.institution}
                  onChange={(e) => setSemesterInfo({...semesterInfo, institution: e.target.value})}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  placeholder="College/University name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Academic Year *</label>
                <input
                  type="text"
                  value={semesterInfo.year}
                  onChange={(e) => setSemesterInfo({...semesterInfo, year: e.target.value})}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  placeholder="e.g., 2023-24"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Semester *</label>
                <select
                  value={semesterInfo.semester}
                  onChange={(e) => setSemesterInfo({...semesterInfo, semester: e.target.value})}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  required
                >
                  <option value="">Select Semester</option>
                  <option value="1">Semester 1</option>
                  <option value="2">Semester 2</option>
                  <option value="3">Semester 3</option>
                  <option value="4">Semester 4</option>
                  <option value="5">Semester 5</option>
                  <option value="6">Semester 6</option>
                  <option value="7">Semester 7</option>
                  <option value="8">Semester 8</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Semester Name</label>
                <input
                  type="text"
                  value={semesterInfo.name}
                  onChange={(e) => setSemesterInfo({...semesterInfo, name: e.target.value})}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  placeholder="e.g., Semester 3 - Computer Science"
                />
              </div>
            </div>
          </div>

          {/* Upload Method Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Upload Marksheet Option */}
            <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700">
              <h3 className="text-xl font-bold text-white mb-4">Upload Marksheet</h3>
              <p className="text-gray-400 mb-6">Upload a scanned copy of your marksheet for automatic data extraction</p>
              
              <div className="border-2 border-dashed border-gray-600 rounded-xl p-6 text-center hover:border-yellow-400 transition-colors duration-200 mb-4">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-400 mb-3">Supports PDF, JPG, PNG files up to 10MB</p>
                
                <label className="bg-yellow-400 text-gray-900 px-6 py-3 rounded-lg font-medium hover:bg-yellow-300 transition-colors duration-200 cursor-pointer inline-flex items-center space-x-2">
                  <Camera className="w-5 h-5" />
                  <span>Select File</span>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {fileError && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-5 h-5 text-red-400" />
                    <p className="text-red-400 text-sm">{fileError}</p>
                  </div>
                </div>
              )}

              <div className="space-y-2 text-sm text-gray-400">
                <p>✓ Automatic data extraction</p>
                <p>✓ OCR technology</p>
                <p>✓ Secure file storage</p>
                <p>✓ Editable results</p>
              </div>
            </div>

            {/* Manual Entry Option */}
            <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700">
              <h3 className="text-xl font-bold text-white mb-4">Manual Entry</h3>
              <p className="text-gray-400 mb-6">Enter your marks manually for complete control over your data</p>
              
              <div className="border-2 border-dashed border-gray-600 rounded-xl p-6 text-center hover:border-yellow-400 transition-colors duration-200 mb-4">
                <Edit3 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-400 mb-3">Add subjects, grades, and credits manually</p>
                
                <button
                  onClick={handleManualEntry}
                  disabled={!semesterInfo.studentName || !semesterInfo.year || !semesterInfo.semester}
                  className="bg-blue-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center space-x-2"
                >
                  <Plus className="w-5 h-5" />
                  <span>Start Manual Entry</span>
                </button>
              </div>

              <div className="space-y-2 text-sm text-gray-400">
                <p>✓ Complete control</p>
                <p>✓ No file required</p>
                <p>✓ Instant entry</p>
              </div>
            </div>
          </div>

          {(!semesterInfo.studentName || !semesterInfo.year || !semesterInfo.semester) && (
            <div className="bg-yellow-400/10 border border-yellow-400/30 rounded-xl p-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-yellow-400" />
                <p className="text-yellow-400 font-medium">Please fill in the required student information fields before proceeding.</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 2: Processing */}
      {step === 2 && uploadMethod === 'upload' && (
        <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-6">Processing Marksheet</h2>
          
          <div className="text-center mb-6">
            <div className="bg-gray-700 rounded-xl p-6 mb-4">
              <FileText className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
              <p className="text-white font-medium">{selectedFile?.name}</p>
              <p className="text-gray-400 text-sm">
                {selectedFile && fileStorage.formatFileSize(selectedFile.size)}
              </p>
            </div>
            
            <button
              onClick={simulateAdvancedOCR}
              disabled={isProcessing}
              className="bg-yellow-400 text-gray-900 px-8 py-3 rounded-lg font-medium hover:bg-yellow-300 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 mx-auto"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900"></div>
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Eye className="w-5 h-5" />
                  <span>Extract Data with Advanced OCR</span>
                </>
              )}
            </button>
          </div>

          {isProcessing && (
            <div className="bg-gray-700 rounded-xl p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-400"></div>
                <span className="text-white font-medium">Advanced OCR Analysis in Progress...</span>
              </div>
              <div className="space-y-2 text-sm text-gray-400">
                <p>✓ File uploaded and stored securely</p>
                <p>✓ Image preprocessing complete</p>
                <p>✓ Enhanced OCR scanning initiated</p>
                <p>🔄 Detecting subject codes and names...</p>
                <p>🔄 Extracting grades and credit information...</p>
                <p>🔄 Validating extracted data...</p>
                <p>⏳ Preparing results for review...</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 3: Review and Edit */}
      {step === 3 && (
        <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">
              {uploadMethod === 'upload' ? 'Review Extracted Data' : 'Manual Entry'}
            </h2>
            <button
              onClick={handleAddSubject}
              className="bg-yellow-400 text-gray-900 px-4 py-2 rounded-lg font-medium hover:bg-yellow-300 transition-colors duration-200 flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Subject</span>
            </button>
          </div>

          {/* Student Info Display */}
          <div className="bg-gray-700 rounded-xl p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Student: </span>
                <span className="text-white font-medium">{semesterInfo.studentName}</span>
              </div>
              <div>
                <span className="text-gray-400">Semester: </span>
                <span className="text-white font-medium">{semesterInfo.semester} ({semesterInfo.year})</span>
              </div>
              <div>
                <span className="text-gray-400">Roll: </span>
                <span className="text-white font-medium">{semesterInfo.rollNumber || 'Not provided'}</span>
              </div>
            </div>
            {savedFileId && (
              <div className="mt-2 text-sm">
                <span className="text-gray-400">File: </span>
                <span className="text-green-400 font-medium">✓ Stored securely</span>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {extractedData.length === 0 && uploadMethod === 'manual' && (
              <div className="text-center py-8">
                <Plus className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 mb-4">No subjects added yet</p>
                <button
                  onClick={handleAddSubject}
                  className="bg-yellow-400 text-gray-900 px-6 py-3 rounded-lg font-medium hover:bg-yellow-300 transition-colors duration-200"
                >
                  Add Your First Subject
                </button>
              </div>
            )}

            {extractedData.map((subject) => (
              <div key={subject.id} className="bg-gray-700 rounded-xl p-4">
                {editingSubject?.id === subject.id ? (
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                    <input
                      type="text"
                      value={editingSubject.code}
                      onChange={(e) => setEditingSubject({...editingSubject, code: e.target.value})}
                      className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                      placeholder="Subject Code"
                    />
                    <input
                      type="text"
                      value={editingSubject.name}
                      onChange={(e) => setEditingSubject({...editingSubject, name: e.target.value})}
                      className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 md:col-span-2"
                      placeholder="Subject Name"
                    />
                    <select
                      value={editingSubject.grade}
                      onChange={(e) => setEditingSubject({...editingSubject, grade: e.target.value})}
                      className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    >
                      {Object.keys(gradePoints).map(grade => (
                        <option key={grade} value={grade}>{grade} ({gradePoints[grade]} points)</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      value={editingSubject.credits}
                      onChange={(e) => setEditingSubject({...editingSubject, credits: parseInt(e.target.value) || 0})}
                      className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                      placeholder="Credits"
                      min="1"
                      max="10"
                    />
                    <div className="flex space-x-2">
                      <button
                        onClick={handleSaveEdit}
                        className="bg-green-500 text-white px-3 py-2 rounded-lg hover:bg-green-600 transition-colors duration-200"
                      >
                        <Save className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditingSubject(null)}
                        className="bg-gray-500 text-white px-3 py-2 rounded-lg hover:bg-gray-600 transition-colors duration-200"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 flex-1">
                      <div>
                        <p className="text-gray-400 text-sm">Subject Code</p>
                        <p className="text-white font-medium">{subject.code}</p>
                      </div>
                      <div className="md:col-span-2">
                        <p className="text-gray-400 text-sm">Subject Name</p>
                        <p className="text-white font-medium">{subject.name}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Grade</p>
                        <p className="text-yellow-400 font-bold">{subject.grade} ({subject.points} pts)</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Credits</p>
                        <p className="text-white font-medium">{subject.credits}</p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditSubject(subject)}
                        className="bg-blue-500 text-white px-3 py-2 rounded-lg hover:bg-blue-600 transition-colors duration-200"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleRemoveSubject(subject.id)}
                        className="bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600 transition-colors duration-200"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* SGPA Calculation */}
          {extractedData.length > 0 && (
            <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-xl p-6 mt-6 text-gray-900">
              <h3 className="text-xl font-bold mb-4">Calculated Results</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-gray-700 font-medium">Total Subjects</p>
                  <p className="text-2xl font-bold">{extractedData.length}</p>
                </div>
                <div>
                  <p className="text-gray-700 font-medium">Total Credits</p>
                  <p className="text-2xl font-bold">{extractedData.reduce((sum, item) => sum + item.credits, 0)}</p>
                </div>
                <div>
                  <p className="text-gray-700 font-medium">Total Points</p>
                  <p className="text-2xl font-bold">{extractedData.reduce((sum, item) => sum + (item.points * item.credits), 0)}</p>
                </div>
                <div>
                  <p className="text-gray-700 font-medium">SGPA</p>
                  <p className="text-3xl font-bold">{calculateSGPA()}</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between mt-6">
            <button
              onClick={() => setStep(uploadMethod === 'upload' ? 2 : 1)}
              className="bg-gray-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-700 transition-colors duration-200"
            >
              Back
            </button>
            <button
              onClick={handleFinalSubmit}
              disabled={extractedData.length === 0}
              className="bg-yellow-400 text-gray-900 px-6 py-3 rounded-lg font-medium hover:bg-yellow-300 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <CheckCircle className="w-5 h-5" />
              <span>Save Semester Data</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadSection;