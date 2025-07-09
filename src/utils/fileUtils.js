/**
 * Utility functions for file operations
 */

export const FILE_TYPES = {
  // Document types
  PDF: 'application/pdf',
  DOC: 'application/msword',
  DOCX: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  XLS: 'application/vnd.ms-excel',
  XLSX: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  PPT: 'application/vnd.ms-powerpoint',
  PPTX: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  
  // Image types
  JPG: 'image/jpeg',
  JPEG: 'image/jpeg',
  PNG: 'image/png',
  GIF: 'image/gif',
  WEBP: 'image/webp',
  
  // Text types
  TXT: 'text/plain',
  CSV: 'text/csv',
  
  // Archive types
  ZIP: 'application/zip',
  RAR: 'application/x-rar-compressed',
  '7Z': 'application/x-7z-compressed',
  TAR: 'application/x-tar',
  GZ: 'application/gzip',
};

/**
 * Get file extension from filename
 * @param {string} filename - The filename
 * @returns {string} The file extension (without dot)
 */
export const getFileExtension = (filename) => {
  if (!filename) return '';
  return filename.split('.').pop().toLowerCase();
};

/**
 * Get file type from extension
 * @param {string} filename - The filename or extension
 * @returns {string} The MIME type
 */
export const getFileType = (filename) => {
  const ext = getFileExtension(filename).toUpperCase();
  return FILE_TYPES[ext] || 'application/octet-stream';
};

/**
 * Format file size to human-readable string
 * @param {number} bytes - File size in bytes
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted file size
 */
export const formatFileSize = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * Check if a file type is an image
 * @param {string} mimeType - The MIME type to check
 * @returns {boolean} True if the type is an image
 */
export const isImageType = (mimeType) => {
  return mimeType && mimeType.startsWith('image/');
};

/**
 * Check if a file type is a document
 * @param {string} mimeType - The MIME type to check
 * @returns {boolean} True if the type is a document
 */
export const isDocumentType = (mimeType) => {
  return mimeType && (
    mimeType.startsWith('application/pdf') ||
    mimeType.startsWith('application/msword') ||
    mimeType.startsWith('application/vnd.openxmlformats-officedocument.wordprocessingml') ||
    mimeType.startsWith('application/vnd.ms-excel') ||
    mimeType.startsWith('application/vnd.openxmlformats-officedocument.spreadsheetml') ||
    mimeType.startsWith('application/vnd.ms-powerpoint') ||
    mimeType.startsWith('application/vnd.openxmlformats-officedocument.presentationml') ||
    mimeType === 'text/plain' ||
    mimeType === 'text/csv'
  );
};

/**
 * Check if a file type is an archive
 * @param {string} mimeType - The MIME type to check
 * @returns {boolean} True if the type is an archive
 */
export const isArchiveType = (mimeType) => {
  return mimeType && (
    mimeType === 'application/zip' ||
    mimeType === 'application/x-rar-compressed' ||
    mimeType === 'application/x-7z-compressed' ||
    mimeType === 'application/x-tar' ||
    mimeType === 'application/gzip'
  );
};

/**
 * Get icon name for a file type
 * @param {string} mimeType - The MIME type
 * @returns {string} Icon name
 */
export const getFileIcon = (mimeType) => {
  if (!mimeType) return 'file';
  
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType === 'application/pdf') return 'file-pdf';
  if (mimeType.startsWith('audio/')) return 'file-audio';
  if (mimeType.startsWith('video/')) return 'file-video';
  
  if (mimeType.includes('word') || mimeType.includes('document')) return 'file-word';
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'file-excel';
  if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return 'file-powerpoint';
  
  if (mimeType === 'text/plain') return 'file-alt';
  if (mimeType === 'text/csv') return 'file-csv';
  
  if (mimeType === 'application/zip' || 
      mimeType === 'application/x-rar-compressed' || 
      mimeType === 'application/x-7z-compressed' ||
      mimeType === 'application/x-tar' ||
      mimeType === 'application/gzip') {
    return 'file-archive';
  }
  
  return 'file';
};

/**
 * Create a data URL from a file
 * @param {File} file - The file to create a data URL from
 * @returns {Promise<string>} A promise that resolves with the data URL
 */
export const fileToDataURL = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

/**
 * Download a file from a URL
 * @param {string} url - The URL of the file to download
 * @param {string} filename - The filename to save as
 */
export const downloadFileFromUrl = (url, filename) => {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || 'download';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

/**
 * Create a file object from a data URL
 * @param {string} dataURL - The data URL
 * @param {string} filename - The filename
 * @returns {File} The file object
 */
export const dataURLtoFile = (dataURL, filename) => {
  const arr = dataURL.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  
  return new File([u8arr], filename, { type: mime });
};

/**
 * Get file type category
 * @param {string} mimeType - The MIME type
 * @returns {string} The file category (image, document, archive, other)
 */
export const getFileCategory = (mimeType) => {
  if (!mimeType) return 'other';
  if (isImageType(mimeType)) return 'image';
  if (isDocumentType(mimeType)) return 'document';
  if (isArchiveType(mimeType)) return 'archive';
  return 'other';
};

/**
 * Validate file against allowed types and size
 * @param {File} file - The file to validate
 * @param {Array<string>} allowedTypes - Array of allowed MIME types
 * @param {number} maxSize - Maximum file size in bytes
 * @returns {{valid: boolean, error?: string}} Validation result
 */
export const validateFile = (file, allowedTypes = [], maxSize = 10 * 1024 * 1024) => {
  if (!file) {
    return { valid: false, error: 'No file provided' };
  }
  
  // Check file type
  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    return { 
      valid: false, 
      error: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}` 
    };
  }
  
  // Check file size
  if (file.size > maxSize) {
    return { 
      valid: false, 
      error: `File is too large. Maximum size: ${formatFileSize(maxSize)}` 
    };
  }
  
  return { valid: true };
};
