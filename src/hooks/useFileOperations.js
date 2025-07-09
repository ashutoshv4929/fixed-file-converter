import { useState, useCallback } from 'react';
import { apiService } from '../services/api';

export const useFileOperations = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);

  const resetState = useCallback(() => {
    setError(null);
    setProgress(0);
  }, []);

  const uploadFile = useCallback(async (file) => {
    resetState();
    setIsLoading(true);
    
    try {
      const response = await apiService.upload(file);
      return {
        success: true,
        data: response,
      };
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload file');
      return {
        success: false,
        error: err.message || 'Failed to upload file',
      };
    } finally {
      setIsLoading(false);
    }
  }, [resetState]);

  const convertFile = useCallback(async (fileId, targetFormat) => {
    resetState();
    setIsLoading(true);
    
    try {
      const response = await apiService.convert(fileId, targetFormat);
      return {
        success: true,
        data: response,
      };
    } catch (err) {
      console.error('Conversion error:', err);
      setError(err.message || 'Failed to convert file');
      return {
        success: false,
        error: err.message || 'Failed to convert file',
      };
    } finally {
      setIsLoading(false);
    }
  }, [resetState]);

  const downloadFile = useCallback(async (fileId, fileName) => {
    resetState();
    setIsLoading(true);
    
    try {
      const response = await apiService.download(fileId);
      
      // Create a download link and trigger download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName || 'download');
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      return { success: true };
    } catch (err) {
      console.error('Download error:', err);
      setError(err.message || 'Failed to download file');
      return {
        success: false,
        error: err.message || 'Failed to download file',
      };
    } finally {
      setIsLoading(false);
    }
  }, [resetState]);

  return {
    uploadFile,
    convertFile,
    downloadFile,
    isLoading,
    error,
    progress,
    resetError: () => setError(null),
  };
};

export default useFileOperations;
