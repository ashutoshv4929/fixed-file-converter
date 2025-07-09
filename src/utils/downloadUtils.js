/**
 * Utility functions for handling file downloads
 */

/**
 * Triggers a file download in the browser
 * @param {string} url - The URL of the file to download
 * @param {string} fileName - The name to save the file as
 * @param {Object} options - Additional options
 * @param {Function} options.onProgress - Progress callback function
 * @returns {Promise<void>}
 */
export const downloadFile = async (url, fileName, options = {}) => {
  const { onProgress } = options;
  
  try {
    // Create a new XMLHttpRequest object
    const xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.responseType = 'blob';
    
    // Set up progress tracking if callback provided
    if (onProgress && typeof onProgress === 'function') {
      xhr.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          onProgress(percentComplete, event);
        }
      };
    }
    
    // Handle successful download
    xhr.onload = () => {
      if (xhr.status === 200) {
        // Create a blob from the response
        const blob = new Blob([xhr.response], { type: xhr.getResponseHeader('content-type') });
        
        // Create a download link and trigger the download
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = fileName || 'download';
        document.body.appendChild(a);
        a.click();
        
        // Clean up
        window.URL.revokeObjectURL(downloadUrl);
        document.body.removeChild(a);
        
        // Call progress with 100% when done
        if (onProgress) onProgress(100);
      } else {
        throw new Error(`Failed to download file: ${xhr.statusText}`);
      }
    };
    
    // Handle errors
    xhr.onerror = () => {
      throw new Error('Network error occurred while downloading the file');
    };
    
    // Send the request
    xhr.send();
    
  } catch (error) {
    console.error('Download error:', error);
    throw error;
  }
};

/**
 * Triggers a download of a Blob object
 * @param {Blob} blob - The Blob object to download
 * @param {string} fileName - The name to save the file as
 */
export const downloadBlob = (blob, fileName) => {
  try {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName || 'download';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    console.error('Error downloading blob:', error);
    throw error;
  }
};

/**
 * Converts a base64 string to a Blob
 * @param {string} base64 - The base64 string
 * @param {string} contentType - The content type of the file
 * @returns {Blob}
 */
export const base64ToBlob = (base64, contentType = '') => {
  try {
    const byteCharacters = atob(base64.split(',')[1]);
    const byteArrays = [];
    
    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
      const slice = byteCharacters.slice(offset, offset + 512);
      const byteNumbers = new Array(slice.length);
      
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      
      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }
    
    return new Blob(byteArrays, { type: contentType });
  } catch (error) {
    console.error('Error converting base64 to blob:', error);
    throw error;
  }
};

/**
 * Gets the file extension from a filename or URL
 * @param {string} filename - The filename or URL
 * @returns {string} The file extension (without the dot)
 */
export const getFileExtension = (filename) => {
  if (!filename) return '';
  return filename.split('.').pop().toLowerCase().split(/[#?]/)[0];
};

/**
 * Gets the content type based on file extension
 * @param {string} extension - The file extension (without the dot)
 * @returns {string} The MIME type
 */
export const getContentType = (extension) => {
  const types = {
    // Images
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    
    // Documents
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ppt: 'application/vnd.ms-powerpoint',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    
    // Text
    txt: 'text/plain',
    csv: 'text/csv',
    json: 'application/json',
    xml: 'application/xml',
    
    // Archives
    zip: 'application/zip',
    rar: 'application/x-rar-compressed',
    '7z': 'application/x-7z-compressed',
    tar: 'application/x-tar',
    gz: 'application/gzip',
  };
  
  return types[extension.toLowerCase()] || 'application/octet-stream';
};

/**
 * Validates if a file is of an allowed type
 * @param {File} file - The file to validate
 * @param {string[]} allowedTypes - Array of allowed MIME types
 * @returns {boolean} True if the file type is allowed
 */
export const validateFileType = (file, allowedTypes) => {
  if (!file || !allowedTypes || !allowedTypes.length) return false;
  return allowedTypes.includes(file.type);
};

/**
 * Validates if a file is within the allowed size
 * @param {File} file - The file to validate
 * @param {number} maxSizeInMB - Maximum allowed size in megabytes
 * @returns {boolean} True if the file size is within the limit
 */
export const validateFileSize = (file, maxSizeInMB) => {
  if (!file || !maxSizeInMB) return false;
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
  return file.size <= maxSizeInBytes;
};

/**
 * Formats file size in a human-readable format
 * @param {number} bytes - File size in bytes
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted file size
 */
export const formatFileSize = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};
