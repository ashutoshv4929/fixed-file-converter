import { v4 as uuidv4 } from 'uuid';
import { 
  formatFileSize, 
  getFileExtension, 
  getFileIcon, 
  getFileCategory 
} from './fileUtils';
import { apiService } from '../services/api';
import { API_CONFIG, ERROR_MESSAGES } from '../config/api';

/**
 * Process a single file for upload
 * @param {File} file - The file to process
 * @param {Object} options - Upload options
 * @param {Function} onProgress - Progress callback
 * @returns {Promise<Object>} The upload result
 */
export const processFileUpload = async (file, options = {}, onProgress = null) => {
  try {
    // Generate a unique ID for the file
    const fileId = uuidv4();
    const fileExt = getFileExtension(file.name);
    
    // Create file metadata
    const fileMeta = {
      id: fileId,
      name: file.name,
      size: file.size,
      type: file.type,
      extension: fileExt,
      icon: getFileIcon(file.type),
      category: getFileCategory(file.type),
      status: 'pending',
      progress: 0,
      uploadedAt: null,
      url: null,
      error: null,
    };
    
    // Validate the file
    const validation = validateFile(file, options.allowedTypes, options.maxFileSize);
    if (!validation.valid) {
      throw new Error(validation.error || 'Invalid file');
    }
    
    // Update status to uploading
    fileMeta.status = 'uploading';
    
    // Upload the file
    const result = await apiService.upload(
      file, 
      options,
      (progress) => {
        fileMeta.progress = progress;
        onProgress && onProgress({ ...fileMeta });
      }
    );
    
    if (!result.success) {
      throw new Error(result.error || 'Upload failed');
    }
    
    // Update file metadata with upload result
    fileMeta.status = 'completed';
    fileMeta.progress = 100;
    fileMeta.uploadedAt = new Date().toISOString();
    fileMeta.url = result.data.url || result.data.path;
    fileMeta.id = result.data.id || fileId;
    
    return {
      success: true,
      data: fileMeta,
    };
    
  } catch (error) {
    console.error('File upload error:', error);
    
    return {
      success: false,
      error: error.message || ERROR_MESSAGES.UPLOAD_FAILED,
      file: {
        id: uuidv4(),
        name: file.name,
        size: file.size,
        type: file.type,
        status: 'error',
        error: error.message,
        progress: 0,
      },
    };
  }
};

/**
 * Process multiple files for upload
 * @param {Array<File>} files - Array of files to upload
 * @param {Object} options - Upload options
 * @param {Function} onFileProgress - Progress callback for individual files
 * @param {Function} onOverallProgress - Overall progress callback
 * @returns {Promise<Array>} Array of upload results
 */
export const processMultipleUploads = async (
  files, 
  options = {}, 
  onFileProgress = null,
  onOverallProgress = null
) => {
  const results = [];
  const totalFiles = files.length;
  
  // Process files sequentially to avoid overwhelming the server
  for (let i = 0; i < totalFiles; i++) {
    const file = files[i];
    
    // Create a progress handler for this file
    const handleProgress = (fileProgress) => {
      if (onFileProgress) {
        onFileProgress(fileProgress, i);
      }
      
      // Calculate overall progress
      if (onOverallProgress) {
        const completedProgress = results.reduce((sum, result) => {
          return sum + (result.data?.progress || 0);
        }, 0);
        
        const currentFileProgress = fileProgress.progress || 0;
        const overallProgress = (completedProgress + currentFileProgress) / totalFiles;
        
        onOverallProgress({
          total: totalFiles,
          completed: results.filter(r => r.success).length,
          failed: results.filter(r => !r.success).length,
          current: i + 1,
          progress: Math.round(overallProgress * 100) / 100,
        });
      }
    };
    
    // Process the file upload
    const result = await processFileUpload(file, options, handleProgress);
    results.push(result);
  }
  
  return results;
};

/**
 * Validate a file against allowed types and size
 * @param {File} file - The file to validate
 * @param {Array<string>} allowedTypes - Allowed MIME types
 * @param {number} maxFileSize - Maximum file size in bytes
 * @returns {{valid: boolean, error?: string}} Validation result
 */
export const validateFile = (file, allowedTypes = [], maxFileSize = null) => {
  if (!file) {
    return { valid: false, error: 'No file provided' };
  }
  
  // Check file type
  if (allowedTypes && allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    return { 
      valid: false, 
      error: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}` 
    };
  }
  
  // Check file size
  const maxSize = maxFileSize !== null ? maxFileSize : API_CONFIG.MAX_FILE_SIZE;
  if (file.size > maxSize) {
    return { 
      valid: false, 
      error: `File is too large. Maximum size: ${formatFileSize(maxSize)}` 
    };
  }
  
  return { valid: true };
};

/**
 * Convert a file to a different format
 * @param {string} fileId - The ID of the file to convert
 * @param {string} targetFormat - The target format
 * @param {Object} options - Conversion options
 * @returns {Promise<Object>} The conversion result
 */
export const convertFile = async (fileId, targetFormat, options = {}) => {
  try {
    const result = await apiService.convert(fileId, targetFormat, options);
    
    if (!result.success) {
      throw new Error(result.error || 'Conversion failed');
    }
    
    return {
      success: true,
      data: result.data,
    };
    
  } catch (error) {
    console.error('File conversion error:', error);
    
    return {
      success: false,
      error: error.message || ERROR_MESSAGES.CONVERSION_FAILED,
      details: error.details,
    };
  }
};

/**
 * Download a file by ID
 * @param {string} fileId - The ID of the file to download
 * @param {string} fileName - Optional custom filename
 * @returns {Promise<Object>} The download result
 */
export const downloadFile = async (fileId, fileName = '') => {
  try {
    const result = await apiService.download(fileId, fileName);
    
    if (!result.success) {
      throw new Error(result.error || 'Download failed');
    }
    
    return {
      success: true,
    };
    
  } catch (error) {
    console.error('File download error:', error);
    
    return {
      success: false,
      error: error.message || ERROR_MESSAGES.DOWNLOAD_FAILED,
      details: error.details,
    };
  }
};

/**
 * Generate a preview URL for a file
 * @param {File|string} file - The file object or URL
 * @returns {Promise<string>} A promise that resolves with the preview URL
 */
export const getFilePreview = (file) => {
  return new Promise((resolve) => {
    // If it's already a URL, return it
    if (typeof file === 'string') {
      resolve(file);
      return;
    }
    
    // For images, create a data URL
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    } else {
      // For other file types, return null or a generic icon
      resolve(null);
    }
  });
};
