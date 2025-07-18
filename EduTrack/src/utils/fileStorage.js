// File storage utility for handling uploaded files
export class FileStorage {
  constructor() {
    this.storageKey = 'uploadedFiles';
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

  // Save file to localStorage
  async saveFile(file, userId, semesterId) {
    try {
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
}