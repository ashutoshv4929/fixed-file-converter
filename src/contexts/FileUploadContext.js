import { createContext, useContext, useMemo } from 'react';
import useFileUpload from '../hooks/useFileUpload';

// Create the context
const FileUploadContext = createContext(null);

/**
 * File upload provider component
 */
export const FileUploadProvider = ({ children, options = {} }) => {
  const fileUpload = useFileUpload(options);
  
  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    ...fileUpload,
  }), [fileUpload]);
  
  return (
    <FileUploadContext.Provider value={value}>
      {children}
    </FileUploadContext.Provider>
  );
};

/**
 * Custom hook to use the file upload context
 */
export const useFileUploadContext = () => {
  const context = useContext(FileUploadContext);
  
  if (!context) {
    throw new Error('useFileUploadContext must be used within a FileUploadProvider');
  }
  
  return context;
};

export default FileUploadContext;
