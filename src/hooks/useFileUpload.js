import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { 
  processFileUpload, 
  processMultipleUploads,
  convertFile,
  downloadFile,
  validateFile as validateFileUtil,
  getFilePreview
} from '../utils/uploadUtils';
import { API_CONFIG } from '../config/api';

/**
 * Custom hook for handling file uploads and conversions
 * @param {Object} options - Options for the hook
 * @param {Array<string>} options.allowedTypes - Allowed MIME types for uploads
 * @param {number} options.maxFileSize - Maximum file size in bytes
 * @param {number} options.maxFiles - Maximum number of files to process
 * @returns {Object} File upload state and methods
 */
const useFileUpload = (options = {}) => {
  // Default options
  const {
    allowedTypes = API_CONFIG.ALLOWED_FILE_TYPES,
    maxFileSize = API_CONFIG.MAX_FILE_SIZE,
    maxFiles = 10,
  } = options;
  
  // State
  const [files, setFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [error, setError] = useState(null);
  const [conversions, setConversions] = useState({});
  
  /**
   * Reset all state
   */
  const reset = useCallback(() => {
    setFiles([]);
    setIsUploading(false);
    setUploadProgress({});
    setError(null);
    setConversions({});
  }, []);
  
  /**
   * Validate a file
   */
  const validateFile = useCallback((file) => {
    return validateFileUtil(file, allowedTypes, maxFileSize);
  }, [allowedTypes, maxFileSize]);
  
  /**
   * Handle file selection
   */
  const handleFileSelect = useCallback((event) => {
    const selectedFiles = Array.from(event.target.files);
    
    // Check max files
    if (files.length + selectedFiles.length > maxFiles) {
      setError(`You can only upload up to ${maxFiles} files at a time`);
      return [];
    }
    
    // Process each file
    const processedFiles = selectedFiles.map(file => {
      const validation = validateFile(file);
      
      return {
        id: uuidv4(),
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        status: validation.valid ? 'pending' : 'error',
        error: validation.valid ? null : validation.error,
        progress: 0,
        preview: null,
      };
    });
    
    // Add previews for images
    processedFiles.forEach(async (fileObj, index) => {
      if (fileObj.type.startsWith('image/')) {
        try {
          const preview = await getFilePreview(fileObj.file);
          setFiles(prevFiles => {
            const newFiles = [...prevFiles];
            const fileIndex = newFiles.findIndex(f => f.id === fileObj.id);
            if (fileIndex !== -1) {
              newFiles[fileIndex] = { ...newFiles[fileIndex], preview };
              return newFiles;
            }
            return prevFiles;
          });
        } catch (err) {
          console.error('Error generating preview:', err);
        }
      }
    });
    
    // Add new files to state
    setFiles(prevFiles => [...prevFiles, ...processedFiles]);
    
    return processedFiles;
  }, [files.length, maxFiles, validateFile]);
  
  /**
   * Upload a single file
   */
  const uploadFile = useCallback(async (fileId) => {
    const fileObj = files.find(f => f.id === fileId);
    if (!fileObj || fileObj.status === 'uploading' || fileObj.status === 'completed') {
      return { success: false, error: 'Invalid file or already processed' };
    }
    
    // Update file status
    setFiles(prevFiles => 
      prevFiles.map(f => 
        f.id === fileId 
          ? { ...f, status: 'uploading', progress: 0, error: null } 
          : f
      )
    );
    
    try {
      const result = await processFileUpload(
        fileObj.file,
        { allowedTypes, maxFileSize },
        (progress) => {
          setUploadProgress(prev => ({
            ...prev,
            [fileId]: progress
          }));
        }
      );
      
      if (result.success) {
        // Update file with upload result
        setFiles(prevFiles => 
          prevFiles.map(f => 
            f.id === fileId 
              ? { 
                  ...f, 
                  ...result.data, 
                  status: 'completed', 
                  progress: 100,
                  uploadedAt: new Date().toISOString(),
                } 
              : f
          )
        );
        
        return { success: true, data: result.data };
      } else {
        // Handle upload failure
        setFiles(prevFiles => 
          prevFiles.map(f => 
            f.id === fileId 
              ? { 
                  ...f, 
                  status: 'error', 
                  error: result.error,
                  progress: 0,
                } 
              : f
          )
        );
        
        return { success: false, error: result.error };
      }
    } catch (err) {
      console.error('Upload error:', err);
      
      setFiles(prevFiles => 
        prevFiles.map(f => 
          f.id === fileId 
            ? { 
                ...f, 
                status: 'error', 
                error: err.message || 'Upload failed',
                progress: 0,
              } 
            : f
        )
      );
      
      return { success: false, error: err.message || 'Upload failed' };
    }
  }, [files, allowedTypes, maxFileSize]);
  
  /**
   * Upload all pending files
   */
  const uploadAllFiles = useCallback(async () => {
    const pendingFiles = files.filter(f => f.status === 'pending' || f.status === 'error');
    
    if (pendingFiles.length === 0) {
      return { success: false, error: 'No files to upload' };
    }
    
    setIsUploading(true);
    setError(null);
    
    try {
      const results = [];
      
      // Process files one by one to avoid overwhelming the server
      for (const fileObj of pendingFiles) {
        const result = await uploadFile(fileObj.id);
        results.push({
          fileId: fileObj.id,
          success: result.success,
          error: result.error,
          data: result.data,
        });
      }
      
      return { 
        success: results.every(r => r.success), 
        results 
      };
      
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message || 'Upload failed');
      return { success: false, error: err.message || 'Upload failed' };
    } finally {
      setIsUploading(false);
    }
  }, [files, uploadFile]);
  
  /**
   * Remove a file
   */
  const removeFile = useCallback((fileId) => {
    setFiles(prevFiles => prevFiles.filter(f => f.id !== fileId));
    
    // Clean up any conversions for this file
    setConversions(prev => {
      const newConversions = { ...prev };
      delete newConversions[fileId];
      return newConversions;
    });
  }, []);
  
  /**
   * Convert a file to a different format
   */
  const handleConvertFile = useCallback(async (fileId, targetFormat) => {
    const fileObj = files.find(f => f.id === fileId);
    if (!fileObj || fileObj.status !== 'completed') {
      return { success: false, error: 'File not ready for conversion' };
    }
    
    // Update conversion status
    setConversions(prev => ({
      ...prev,
      [fileId]: {
        ...(prev[fileId] || {}),
        [targetFormat]: {
          status: 'converting',
          progress: 0,
          error: null,
        },
      },
    }));
    
    try {
      const result = await convertFile(fileObj.id, targetFormat);
      
      if (result.success) {
        // Update conversion status
        setConversions(prev => ({
          ...prev,
          [fileId]: {
            ...(prev[fileId] || {}),
            [targetFormat]: {
              status: 'completed',
              progress: 100,
              result: result.data,
              completedAt: new Date().toISOString(),
            },
          },
        }));
        
        return { success: true, data: result.data };
      } else {
        throw new Error(result.error || 'Conversion failed');
      }
    } catch (err) {
      console.error('Conversion error:', err);
      
      // Update conversion status with error
      setConversions(prev => ({
        ...prev,
        [fileId]: {
          ...(prev[fileId] || {}),
          [targetFormat]: {
            status: 'error',
            error: err.message || 'Conversion failed',
            progress: 0,
          },
        },
      }));
      
      return { success: false, error: err.message || 'Conversion failed' };
    }
  }, [files]);
  
  /**
   * Download a file
   */
  const handleDownloadFile = useCallback(async (fileId, fileName) => {
    try {
      const result = await downloadFile(fileId, fileName);
      
      if (!result.success) {
        throw new Error(result.error || 'Download failed');
      }
      
      return { success: true };
    } catch (err) {
      console.error('Download error:', err);
      return { success: false, error: err.message || 'Download failed' };
    }
  }, []);
  
  return {
    // State
    files,
    isUploading,
    uploadProgress,
    error,
    conversions,
    
    // Methods
    handleFileSelect,
    uploadFile,
    uploadAllFiles,
    removeFile,
    handleConvertFile,
    handleDownloadFile,
    reset,
    validateFile,
  };
};

export default useFileUpload;
