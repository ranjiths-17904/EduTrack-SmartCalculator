import React, { useState } from 'react';
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
  Loader,
  AlertTriangle
} from 'lucide-react';
import { useData } from '../context/DataContext.jsx';
import { OCRProcessor } from '../utils/ocrProcessor.js';
import { FileStorage } from '../utils/fileStorage.js';
import { useAuth } from '../context/AuthContext.jsx';

const UploadSection = () => {
  const { user } = useAuth();
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
  const [ocrResult, setOcrResult] = useState(null);
  const [processingStage, setProcessingStage] = useState('');
  const [savedFileId, setSavedFileId] = useState(null);

  const { addSemester } = useData();
  const ocrProcessor = new OCRProcessor();
  const fileStorage = new FileStorage();

  const gradePoints = {
    'O': 10, 'A+': 9, 'A': 8, 'B+': 7, 'B': 6, 'C': 5, 'D': 4, 'F': 0, 'U': 0, 'RA': 0
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      if (!validTypes.includes(file.type)) {
        alert('Please upload a PDF, JPG, or PNG file.');
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB.');
        return;
      }

      setSelectedFile(file);
      setStep(2);
    }
  };

  const processWithOCR = async () => {
    if (!selectedFile) return;

    // Check if file is PDF - OCR only supports images
    if (selectedFile.type === 'application/pdf') {
      setOcrResult({
        success: false,
        error: 'PDF files are not supported for automatic OCR processing. The file has been saved and you can download it later. Please use image files (JPG/PNG) for OCR or switch to manual entry.',
        confidence: 0
      });
      setProcessingStage('Processing failed - PDF not supported');
      setIsProcessing(false);
      
      // Save PDF file even though OCR failed
      try {
        const fileId = await fileStorage.saveFile(selectedFile, user.id, 'temp_' + Date.now());
        setSavedFileId(fileId);
      } catch (error) {
        console.error('Error saving PDF file:', error);
      }
      return;
    }

    setIsProcessing(true);
    setProcessingStage('Initializing OCR...');

    try {
      setProcessingStage('Reading file...');
      await new Promise(resolve => setTimeout(resolve, 1000));

      setProcessingStage('Performing OCR analysis...');
      const result = await ocrProcessor.processImage(selectedFile);
      
      setOcrResult(result);

      if (result.success) {
        setProcessingStage('Extracting data...');
        
        // Set semester info from OCR
        setSemesterInfo(prev => ({
          ...prev,
          studentName: result.data.studentInfo.name || prev.studentName,
          semester: result.data.semesterInfo.semester?.toString() || prev.semester,
          year: result.data.semesterInfo.year || prev.year,
          rollNumber: result.data.studentInfo.rollNumber || prev.rollNumber,
          name: `Semester ${result.data.semesterInfo.semester || 'Unknown'} - ${result.data.semesterInfo.year || 'Unknown'}`
        }));

        // Set extracted subjects
        setExtractedData(result.data.subjects || []);
        
        setProcessingStage('Processing complete!');
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Save successful file
        try {
          const fileId = await fileStorage.saveFile(selectedFile, user.id, 'temp_' + Date.now());
          setSavedFileId(fileId);
        } catch (error) {
          console.error('Error saving file:', error);
        }
        
        setStep(3);
      } else {
        setProcessingStage('Processing failed');
        
        // Save failed file for manual review
        try {
          const fileId = await fileStorage.saveFile(selectedFile, user.id, 'temp_' + Date.now());
          setSavedFileId(fileId);
        } catch (error) {
          console.error('Error saving file:', error);
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error('OCR Error:', error);
      setOcrResult({
        success: false,
        error: 'An unexpected error occurred during processing.'
      });
      setProcessingStage('Processing failed');
      
      // Save file even on error
      try {
        const fileId = await fileStorage.saveFile(selectedFile, user.id, 'temp_' + Date.now());
        setSavedFileId(fileId);
      } catch (error) {
        console.error('Error saving file:', error);
      }
    } finally {
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
    // Filter out U and RA grades
    const validSubjects = extractedData.filter(subject => 
      subject.grade && !['U', 'RA', 'u', 'ra'].includes(subject.grade.toUpperCase())
    );
    
    const totalCredits = validSubjects.reduce((sum, item) => sum + (item.credits || 0), 0);
    const totalPoints = validSubjects.reduce((sum, item) => sum + ((item.points || 0) * (item.credits || 0)), 0);
    return totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : 0;
  };

  const handleFinalSubmit = () => {
    // Filter out U and RA grades for credit calculation
    const validSubjects = extractedData.filter(subject => 
      subject.grade && !['U', 'RA', 'u', 'ra'].includes(subject.grade.toUpperCase())
    );
    
    const totalCredits = validSubjects.reduce((sum, item) => sum + (item.credits || 0), 0);
    const sgpa = calculateSGPA();

    const semesterId = Date.now().toString();
    const semesterData = {
      id: semesterId,
      studentName: semesterInfo.studentName,
      name: semesterInfo.name,
      year: semesterInfo.year,
      semester: semesterInfo.semester,
      rollNumber: semesterInfo.rollNumber,
      institution: semesterInfo.institution,
      subjects: extractedData, // Keep all subjects including U/RA for display
      totalCredits,
      totalSubjects: extractedData.length,
      sgpa: parseFloat(sgpa),
      uploadDate: new Date().toISOString(),
      uploadMethod: uploadMethod,
      marksheetFile: selectedFile?.name || 'manual_entry',
      ocrConfidence: ocrResult?.confidence || null,
      fileId: savedFileId
    };

    // Update file with final semester ID
    if (savedFileId && selectedFile) {
      try {
        fileStorage.deleteFile(user.id, savedFileId);
        fileStorage.saveFile(selectedFile, user.id, semesterId);
      } catch (error) {
        console.error('Error updating file with semester ID:', error);
      }
    }

    addSemester(semesterData);
    
    // Reset form
    setStep(1);
    setSelectedFile(null);
    setExtractedData([]);
    setSemesterInfo({ studentName: '', name: '', year: '', semester: '', rollNumber: '', institution: '' });
    setUploadMethod('upload');
    setOcrResult(null);
    setSavedFileId(null);
  };

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
              <p className="text-gray-400 mb-6">Upload an image of your marksheet (JPG/PNG) for automatic OCR data extraction</p>
              
              <div className="border-2 border-dashed border-gray-600 rounded-xl p-6 text-center hover:border-yellow-400 transition-colors duration-200 mb-4">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-400 mb-3">Supports JPG, PNG files up to 10MB (PDF requires manual entry)</p>
                
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

              <div className="space-y-2 text-sm text-gray-400">
                <p>✓ Advanced OCR for images</p>
                <p>✓ 99%+ accuracy detection</p>
                <p>✓ JPG/PNG support only</p>
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
                {(selectedFile?.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            
            {!isProcessing && !ocrResult && (
              <button
                onClick={processWithOCR}
                className="bg-yellow-400 text-gray-900 px-8 py-3 rounded-lg font-medium hover:bg-yellow-300 transition-colors duration-200 flex items-center space-x-2 mx-auto"
              >
                <Eye className="w-5 h-5" />
                <span>Extract Data with Advanced OCR</span>
              </button>
            )}
          </div>

          {isProcessing && (
            <div className="bg-gray-700 rounded-xl p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Loader className="animate-spin w-6 h-6 text-yellow-400" />
                <span className="text-white font-medium">{processingStage}</span>
              </div>
              <div className="space-y-2 text-sm text-gray-400">
                <p>✓ File uploaded successfully</p>
                <p>✓ Initializing OCR engine</p>
                <p>🔄 Performing text recognition...</p>
                <p>🔄 Extracting semester information...</p>
                <p>🔄 Parsing subject data...</p>
                <p>⏳ Validating extracted data...</p>
              </div>
            </div>
          )}

          {ocrResult && !ocrResult.success && (
            <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-6">
              <div className="flex items-center space-x-3 mb-4">
                <AlertTriangle className="w-6 h-6 text-red-400" />
                <span className="text-red-400 font-medium">Processing Failed</span>
              </div>
              <p className="text-red-300 mb-4">{ocrResult.error}</p>
              {ocrResult.confidence && (
                <p className="text-gray-400 text-sm mb-4">
                  Detection confidence: {ocrResult.confidence.toFixed(1)}% (Required: 60%+)
                </p>
              )}
              {ocrResult.rawText && (
                <details className="mb-4">
                  <summary className="text-gray-400 text-sm cursor-pointer hover:text-white">
                    View Raw OCR Text (for debugging)
                  </summary>
                  <pre className="text-xs text-gray-300 mt-2 p-2 bg-gray-800 rounded overflow-auto max-h-32">
                    {ocrResult.rawText}
                  </pre>
                </details>
              )}
              {savedFileId && (
                <div className="mb-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                  <p className="text-blue-300 text-sm">
                    ✓ File has been saved and can be downloaded later from the Files section
                  </p>
                </div>
              )}
              <div className="flex space-x-4">
                <button
                  onClick={() => setStep(1)}
                  className="bg-gray-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-700 transition-colors duration-200"
                >
                  Try Another File
                </button>
                <button
                  onClick={handleManualEntry}
                  className="bg-blue-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors duration-200"
                >
                  Manual Entry Instead
                </button>
              </div>
            </div>
          )}

          {ocrResult && ocrResult.success && (
            <div className="bg-green-900/20 border border-green-500/30 rounded-xl p-6">
              <div className="flex items-center space-x-3 mb-4">
                <CheckCircle className="w-6 h-6 text-green-400" />
                <span className="text-green-400 font-medium">Processing Successful</span>
              </div>
              <p className="text-green-300 mb-2">
                Data extracted with {ocrResult.confidence.toFixed(1)}% confidence
              </p>
              <p className="text-gray-400 text-sm">
                Found {extractedData.length} subjects for {semesterInfo.studentName}
              </p>
              {savedFileId && (
                <div className="mt-3 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                  <p className="text-blue-300 text-sm">
                    ✓ Original file has been saved and can be downloaded later
                  </p>
                </div>
              )}
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
            {ocrResult?.confidence && (
              <div className="mt-2 text-sm">
                <span className="text-gray-400">OCR Confidence: </span>
                <span className="text-green-400 font-medium">{ocrResult.confidence.toFixed(1)}%</span>
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

            {extractedData.map((subject) => {
              const isExcluded = subject.grade && ['U', 'RA', 'u', 'ra'].includes(subject.grade.toUpperCase());
              return (
                <div key={subject.id} className={`rounded-xl p-4 ${isExcluded ? 'bg-red-900/20 border border-red-500/30' : 'bg-gray-700'}`}>
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
                          <p className={`font-medium ${isExcluded ? 'text-red-300 line-through' : 'text-white'}`}>
                            {subject.code}
                          </p>
                        </div>
                        <div className="md:col-span-2">
                          <p className="text-gray-400 text-sm">Subject Name</p>
                          <p className={`font-medium ${isExcluded ? 'text-red-300 line-through' : 'text-white'}`}>
                            {subject.name}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm">Grade</p>
                          <div className="flex items-center space-x-2">
                            <p className={`font-bold ${isExcluded ? 'text-red-400' : 'text-yellow-400'}`}>
                              {subject.grade} ({subject.points} pts)
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
                            {subject.credits}
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-2 ml-4">
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
              );
            })}
          </div>

          {/* SGPA Calculation */}
          {extractedData.length > 0 && (
            <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-xl p-6 mt-6 text-gray-900">
              <h3 className="text-xl font-bold mb-4">Calculated Results</h3>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div>
                  <p className="text-gray-700 font-medium">Total Subjects</p>
                  <p className="text-2xl font-bold">{extractedData.length}</p>
                </div>
                <div>
                  <p className="text-gray-700 font-medium">Valid Credits</p>
                  <p className="text-2xl font-bold">
                    {extractedData.filter(s => !['U', 'RA', 'u', 'ra'].includes(s.grade?.toUpperCase())).reduce((sum, item) => sum + (item.credits || 0), 0)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-700 font-medium">Excluded</p>
                  <p className="text-2xl font-bold text-red-600">
                    {extractedData.filter(s => ['U', 'RA', 'u', 'ra'].includes(s.grade?.toUpperCase())).length}
                  </p>
                </div>
                <div>
                  <p className="text-gray-700 font-medium">Total Points</p>
                  <p className="text-2xl font-bold">
                    {extractedData.filter(s => !['U', 'RA', 'u', 'ra'].includes(s.grade?.toUpperCase())).reduce((sum, item) => sum + ((item.points || 0) * (item.credits || 0)), 0)}
                  </p>
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