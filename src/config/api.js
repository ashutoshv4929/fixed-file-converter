// API configuration
export const API_CONFIG = {
  // Base URL for API requests
  BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || '/api',
  
  // API endpoints
  ENDPOINTS: {
    UPLOAD: '/upload',
    CONVERT: '/convert',
    FILES: '/files',
  },
  
  // Default request timeout in milliseconds
  TIMEOUT: 30000,
  
  // Maximum file size in bytes (10MB)
  MAX_FILE_SIZE: 10 * 1024 * 1024,
  
  // Allowed file types
  ALLOWED_FILE_TYPES: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'image/jpeg',
    'image/png',
    'image/gif',
    'text/plain'
  ],
  
  // Default headers
  HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
};

// File conversion options
export const CONVERSION_OPTIONS = {
  // Add any conversion-specific options here
  // For example, quality settings for images, etc.
};

// Default error messages
export const ERROR_MESSAGES = {
  NO_FILE: 'No file provided',
  INVALID_FILE_TYPE: 'Invalid file type',
  FILE_TOO_LARGE: 'File is too large',
  UPLOAD_FAILED: 'Failed to upload file',
  CONVERSION_FAILED: 'Failed to convert file',
  DOWNLOAD_FAILED: 'Failed to download file',
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNKNOWN_ERROR: 'An unknown error occurred',
};

// Helper function to get the full API URL
export const getApiUrl = (endpoint) => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// Helper function to validate file type
export const isValidFileType = (file) => {
  return API_CONFIG.ALLOWED_FILE_TYPES.includes(file.type);
};

// Helper function to validate file size
export const isValidFileSize = (file) => {
  return file.size <= API_CONFIG.MAX_FILE_SIZE;
};

export default {
  ...API_CONFIG,
  CONVERSION_OPTIONS,
  ERROR_MESSAGES,
  getApiUrl,
  isValidFileType,
  isValidFileSize,
};
