import axios from 'axios';
import { API_CONFIG, getApiUrl, ERROR_MESSAGES } from '../config/api';

// Create an axios instance with default config
const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    ...API_CONFIG.HEADERS,
  },
  withCredentials: true,
});

// Request interceptor for API calls
api.interceptors.request.use(
  (config) => {
    // You can add auth tokens here if needed
    // const token = localStorage.getItem('token');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    
    // Log request for debugging
    console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`, {
      params: config.params,
      data: config.data,
    });
    
    return config;
  },
  (error) => {
    console.error('[API] Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for API calls
api.interceptors.response.use(
  (response) => {
    console.log(`[API] Response ${response.status} ${response.config.url}`, response.data);
    return response.data;
  },
  (error) => {
    // Handle errors globally
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('[API] Error Response:', {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response.status,
        data: error.response.data,
      });
      
      // Handle specific status codes
      if (error.response.status === 401) {
        // Handle unauthorized
        // router.push('/login');
      } else if (error.response.status === 404) {
        // Handle not found
      }
      
      return Promise.reject({
        status: error.response.status,
        message: error.response.data?.message || ERROR_MESSAGES.UNKNOWN_ERROR,
        data: error.response.data,
        isAxiosError: true,
      });
    } else if (error.request) {
      // The request was made but no response was received
      console.error('[API] No Response:', {
        url: error.config?.url,
        method: error.config?.method,
        error: error.message,
      });
      
      return Promise.reject({
        message: ERROR_MESSAGES.NETWORK_ERROR,
        isNetworkError: true,
      });
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('[API] Setup Error:', error.message);
      
      return Promise.reject({
        message: error.message || ERROR_MESSAGES.UNKNOWN_ERROR,
      });
    }
  }
);

/**
 * File upload service
 * @param {File} file - The file to upload
 * @param {Object} options - Additional options
 * @param {Function} onUploadProgress - Progress callback
 * @returns {Promise<Object>} - The uploaded file data
 */
const uploadFile = async (file, options = {}, onUploadProgress = null) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    // Add any additional fields to form data
    if (options.fields) {
      Object.entries(options.fields).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }
    
    const response = await api.post(API_CONFIG.ENDPOINTS.UPLOAD, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onUploadProgress && progressEvent.lengthComputable) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onUploadProgress(percentCompleted, progressEvent);
        }
      },
    });
    
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error('File upload failed:', error);
    return {
      success: false,
      error: error.message || ERROR_MESSAGES.UPLOAD_FAILED,
      details: error,
    };
  }
};

/**
 * File conversion service
 * @param {string} fileId - The ID of the file to convert
 * @param {string} targetFormat - The target format to convert to
 * @param {Object} options - Additional conversion options
 * @returns {Promise<Object>} - The conversion result
 */
const convertFile = async (fileId, targetFormat, options = {}) => {
  try {
    const response = await api.post(API_CONFIG.ENDPOINTS.CONVERT, {
      fileId,
      targetFormat,
      ...options,
    });
    
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error('File conversion failed:', error);
    return {
      success: false,
      error: error.message || ERROR_MESSAGES.CONVERSION_FAILED,
      details: error,
    };
  }
};

/**
 * Get file information
 * @param {string} fileId - The ID of the file
 * @returns {Promise<Object>} - The file information
 */
const getFileInfo = async (fileId) => {
  try {
    const response = await api.get(`${API_CONFIG.ENDPOINTS.FILES}/${fileId}/info`);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error('Failed to get file info:', error);
    return {
      success: false,
      error: error.message || 'Failed to get file information',
      details: error,
    };
  }
};

/**
 * Download a file
 * @param {string} fileId - The ID of the file to download
 * @param {string} fileName - Optional custom filename
 * @returns {Promise<Object>} - The download result
 */
const downloadFile = async (fileId, fileName = '') => {
  try {
    const response = await api.get(`${API_CONFIG.ENDPOINTS.FILES}/${fileId}/download`, {
      responseType: 'blob',
    });
    
    // Create a download link and trigger download
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName || `file-${fileId}`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    
    return {
      success: true,
    };
  } catch (error) {
    console.error('File download failed:', error);
    return {
      success: false,
      error: error.message || ERROR_MESSAGES.DOWNLOAD_FAILED,
      details: error,
    };
  }
};

// Export the API service methods
export const apiService = {
  // File operations
  upload: uploadFile,
  convert: convertFile,
  getFileInfo,
  download: downloadFile,
  
  // Helper methods
  getApiUrl,
  isValidFileType: (file) => {
    return API_CONFIG.ALLOWED_FILE_TYPES.includes(file.type);
  },
  isValidFileSize: (file) => {
    return file.size <= API_CONFIG.MAX_FILE_SIZE;
  },
};

export default apiService;
