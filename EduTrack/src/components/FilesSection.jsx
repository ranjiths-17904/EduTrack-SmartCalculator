import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  Trash2, 
  Eye,
  Calendar,
  User,
  HardDrive,
  Search,
  Filter,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { FileStorage } from '../utils/fileStorage.js';
import { useData } from '../context/DataContext.jsx';

const FilesSection = () => {
  const { user } = useAuth();
  const { semesters } = useData();
  const [files, setFiles] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedFile, setSelectedFile] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  const fileStorage = new FileStorage();

  useEffect(() => {
    if (user) {
      loadFiles();
    }
  }, [user]);

  const loadFiles = () => {
    const userFiles = fileStorage.getFiles(user.id);
    setFiles(userFiles);
  };

  const handleDownload = (fileId) => {
    try {
      fileStorage.downloadFile(user.id, fileId);
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Error downloading file');
    }
  };

  const handleDelete = (fileId) => {
    if (confirm('Are you sure you want to delete this file?')) {
      const success = fileStorage.deleteFile(user.id, fileId);
      if (success) {
        loadFiles();
      } else {
        alert('Error deleting file');
      }
    }
  };

  const handlePreview = (file) => {
    setSelectedFile(file);
    setShowPreview(true);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type) => {
    if (type.includes('pdf')) return '📄';
    if (type.includes('image')) return '🖼️';
    return '📁';
  };

  const getSemesterName = (semesterId) => {
    const semester = semesters.find(sem => sem.id === semesterId);
    return semester ? semester.name : 'Unknown Semester';
  };

  const filteredFiles = files.filter(file => {
    const matchesSearch = !searchTerm || 
      file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getSemesterName(file.semesterId).toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterType === 'all' || 
      (filterType === 'pdf' && file.type.includes('pdf')) ||
      (filterType === 'image' && file.type.includes('image'));
    
    return matchesSearch && matchesFilter;
  });

  const totalSize = files.reduce((sum, file) => sum + file.size, 0);

  if (!user) {
    return (
      <div className="text-center py-12">
        <FileText className="w-24 h-24 text-gray-600 mx-auto mb-6" />
        <h2 className="text-2xl font-bold text-white mb-4">Access Denied</h2>
        <p className="text-gray-400">Please log in to view your files</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
          <div className="flex items-center space-x-4">
            <div className="bg-blue-500 p-3 rounded-full">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-gray-400">Total Files</p>
              <p className="text-2xl font-bold text-white">{files.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
          <div className="flex items-center space-x-4">
            <div className="bg-green-500 p-3 rounded-full">
              <HardDrive className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-gray-400">Storage Used</p>
              <p className="text-2xl font-bold text-white">{formatFileSize(totalSize)}</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
          <div className="flex items-center space-x-4">
            <div className="bg-purple-500 p-3 rounded-full">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-gray-400">Owner</p>
              <p className="text-2xl font-bold text-white">{user.name}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search files by name or semester..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
            </div>
          </div>
          <div className="md:w-48">
            <div className="relative">
              <Filter className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
              >
                <option value="all">All Files</option>
                <option value="pdf">PDF Files</option>
                <option value="image">Images</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Files List */}
      <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
        <h2 className="text-2xl font-bold text-white mb-6">Your Files</h2>
        
        {filteredFiles.length === 0 ? (
          <div className="text-center py-12">
            {files.length === 0 ? (
              <>
                <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">No Files Yet</h3>
                <p className="text-gray-400">Upload your first marksheet to see files here</p>
              </>
            ) : (
              <>
                <Search className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">No Results Found</h3>
                <p className="text-gray-400">Try adjusting your search or filter criteria</p>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredFiles.map((file) => (
              <div key={file.id} className="bg-gray-700 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="text-3xl">{getFileIcon(file.type)}</div>
                    <div>
                      <h3 className="text-white font-medium">{file.name}</h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-400">
                        <span>{formatFileSize(file.size)}</span>
                        <span>•</span>
                        <span>{getSemesterName(file.semesterId)}</span>
                        <span>•</span>
                        <span>{new Date(file.uploadDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    {file.type.includes('image') && (
                      <button
                        onClick={() => handlePreview(file)}
                        className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200"
                        title="Preview"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDownload(file.id)}
                      className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors duration-200"
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(file.id)}
                      className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {showPreview && selectedFile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-2xl p-8 max-w-4xl w-full mx-4 border border-gray-700 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white">File Preview</h3>
              <button
                onClick={() => setShowPreview(false)}
                className="p-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200"
              >
                ✕
              </button>
            </div>
            
            <div className="text-center">
              <h4 className="text-lg font-medium text-white mb-4">{selectedFile.name}</h4>
              {selectedFile.type.includes('image') ? (
                <img 
                  src={selectedFile.data} 
                  alt={selectedFile.name}
                  className="max-w-full max-h-96 mx-auto rounded-lg border border-gray-600"
                />
              ) : (
                <div className="bg-gray-700 rounded-xl p-8">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400">Preview not available for this file type</p>
                  <button
                    onClick={() => handleDownload(selectedFile.id)}
                    className="mt-4 bg-yellow-400 text-gray-900 px-6 py-3 rounded-lg font-medium hover:bg-yellow-300 transition-colors duration-200"
                  >
                    Download to View
                  </button>
                </div>
              )}
            </div>
            
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="bg-gray-700 rounded-lg p-3">
                <span className="text-gray-400">File Size: </span>
                <span className="text-white">{formatFileSize(selectedFile.size)}</span>
              </div>
              <div className="bg-gray-700 rounded-lg p-3">
                <span className="text-gray-400">Upload Date: </span>
                <span className="text-white">{new Date(selectedFile.uploadDate).toLocaleString()}</span>
              </div>
              <div className="bg-gray-700 rounded-lg p-3">
                <span className="text-gray-400">File Type: </span>
                <span className="text-white">{selectedFile.type}</span>
              </div>
              <div className="bg-gray-700 rounded-lg p-3">
                <span className="text-gray-400">Semester: </span>
                <span className="text-white">{getSemesterName(selectedFile.semesterId)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilesSection;