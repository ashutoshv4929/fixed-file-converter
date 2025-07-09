import { useCallback, useRef } from 'react';
import { useFileUploadContext } from '../contexts/FileUploadContext';
import styles from '../app/converter/converter.module.css';

const FileUploadArea = () => {
  const { 
    files, 
    isUploading, 
    handleFileSelect, 
    uploadAllFiles, 
    removeFile,
    error,
  } = useFileUploadContext();
  
  const fileInputRef = useRef(null);
  
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isUploading) return;
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      handleFileSelect({ target: { files: e.dataTransfer.files } });
    }
  }, [handleFileSelect, isUploading]);
  
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);
  
  const handleClick = useCallback(() => {
    if (!isUploading) {
      fileInputRef.current?.click();
    }
  }, [isUploading]);
  
  const handleUploadClick = useCallback((e) => {
    e.stopPropagation();
    if (!isUploading && files.some(f => f.status === 'pending' || f.status === 'error')) {
      uploadAllFiles();
    }
  }, [files, isUploading, uploadAllFiles]);
  
  const hasPendingFiles = files.some(f => f.status === 'pending' || f.status === 'error');
  const uploadButtonText = isUploading 
    ? 'Uploading...' 
    : hasPendingFiles 
      ? `Upload ${files.filter(f => f.status === 'pending' || f.status === 'error').length} Files`
      : 'Select Files to Upload';
  
  return (
    <div className={styles.uploadSection}>
      <div 
        className={styles.dropZone}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={handleClick}
        style={{
          cursor: isUploading ? 'not-allowed' : 'pointer',
          opacity: isUploading ? 0.7 : 1,
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          className={styles.fileInput}
          onChange={handleFileSelect}
          multiple
          disabled={isUploading}
        />
        
        <div className={styles.uploadContent}>
          <svg 
            width="48" 
            height="48" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          
          <h3>Drag & Drop files here or click to browse</h3>
          <p className={styles.smallText}>
            Supported formats: PDF, DOCX, XLSX, PPTX, JPG, PNG, GIF, TXT
          </p>
          <p className={styles.smallText}>
            Max file size: 10MB
          </p>
          
          <button 
            className={`${styles.convertButton} ${isUploading ? styles.loading : ''}`}
            onClick={handleUploadClick}
            disabled={!hasPendingFiles || isUploading}
          >
            {uploadButtonText}
          </button>
        </div>
      </div>
      
      {error && (
        <div className={styles.error}>
          {error}
        </div>
      )}
      
      {files.length > 0 && (
        <div className={styles.fileList}>
          <h3>Selected Files</h3>
          <ul>
            {files.map((file) => (
              <li key={file.id} className={styles.fileItem}>
                <div className={styles.fileInfo}>
                  <span className={styles.fileName} title={file.name}>
                    {file.name}
                  </span>
                  <span className={styles.fileSize}>
                    {formatFileSize(file.size)}
                  </span>
                </div>
                
                <div className={styles.fileActions}>
                  {file.status === 'error' && (
                    <span className={styles.errorText}>
                      {file.error || 'Error'}
                    </span>
                  )}
                  
                  {file.status === 'uploading' && (
                    <div className={styles.progressContainer}>
                      <div 
                        className={styles.progressBar} 
                        style={{ width: `${file.progress}%` }}
                      />
                      <span>{file.progress}%</span>
                    </div>
                  )}
                  
                  <button
                    className={styles.removeButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(file.id);
                    }}
                    disabled={isUploading}
                    title="Remove file"
                  >
                    ×
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

// Helper function to format file size
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default FileUploadArea;
