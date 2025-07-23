export class FileStorage {
  constructor() {
    this.storageKey = 'uploadedFiles';
    this.maxFileSize = 10 * 1024 * 1024; // 10MB
    this.maxTotalStorage = 50 * 1024 * 1024; // 50MB per user
    this.allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
  }

  // Convert file to base64 for storage
  async fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  }

  // Validate file before upload
  validateFile(file) {
    const errors = [];
    
    if (!file) {
      errors.push('No file selected.');
      return { isValid: false, errors };
    }

    if (!this.allowedTypes.includes(file.type)) {
      errors.push('Invalid file type. Please upload PDF, JPG, or PNG files only.');
    }

    if (file.size > this.maxFileSize) {
      errors.push(`File size too large. Maximum size is ${this.formatFileSize(this.maxFileSize)}.`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Check storage quota
  checkStorageQuota(userId, additionalSize = 0) {
    const currentSize = this.getUserStorageSize(userId);
    const totalSize = currentSize + additionalSize;
    const availableSpace = this.maxTotalStorage - currentSize;
    
    return {
      currentSize,
      maxSize: this.maxTotalStorage,
      availableSpace,
      usagePercentage: (currentSize / this.maxTotalStorage) * 100,
      canUpload: totalSize <= this.maxTotalStorage
    };
  }

  // Save file to localStorage
  async saveFile(file, userId, semesterId) {
    try {
      const validation = this.validateFile(file);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(' '));
      }

      const quota = this.checkStorageQuota(userId, file.size);
      if (!quota.canUpload) {
        throw new Error(`Storage quota exceeded. Available: ${this.formatFileSize(quota.availableSpace)}`);
      }

      const base64Data = await this.fileToBase64(file);
      const fileData = {
        id: `${userId}_${semesterId}_${Date.now()}`,
        name: file.name,
        type: file.type,
        size: file.size,
        data: base64Data,
        userId: userId,
        semesterId: semesterId,
        uploadDate: new Date().toISOString()
      };

      const existingFiles = this.getFiles(userId);
      existingFiles.push(fileData);
      
      localStorage.setItem(`${this.storageKey}_${userId}`, JSON.stringify(existingFiles));
      return fileData.id;
    } catch (error) {
      console.error('Error saving file:', error);
      throw error;
    }
  }

  // Get all files for a user
  getFiles(userId) {
    try {
      const files = localStorage.getItem(`${this.storageKey}_${userId}`);
      return files ? JSON.parse(files) : [];
    } catch (error) {
      console.error('Error getting files:', error);
      return [];
    }
  }

  // Get a specific file
  getFile(userId, fileId) {
    const files = this.getFiles(userId);
    return files.find(file => file.id === fileId);
  }

  // Delete a file
  deleteFile(userId, fileId) {
    try {
      const files = this.getFiles(userId);
      const filteredFiles = files.filter(file => file.id !== fileId);
      localStorage.setItem(`${this.storageKey}_${userId}`, JSON.stringify(filteredFiles));
      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }

  // Download a file
  downloadFile(userId, fileId) {
    const file = this.getFile(userId, fileId);
    if (!file) {
      throw new Error('File not found');
    }

    const link = document.createElement('a');
    link.href = file.data;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Clear all files for a user
  clearUserFiles(userId) {
    try {
      localStorage.removeItem(`${this.storageKey}_${userId}`);
    } catch (error) {
      console.error('Error clearing user files:', error);
    }
  }

  // Get total storage size for a user
  getUserStorageSize(userId) {
    const files = this.getFiles(userId);
    return files.reduce((total, file) => total + file.size, 0);
  }

  // Format file size for display
formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const size = parseFloat((bytes / Math.pow(k, i)).toFixed(2));
  return `${size} ${sizes[i]}`;
}
};