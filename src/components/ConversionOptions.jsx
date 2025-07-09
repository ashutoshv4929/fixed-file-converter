import { useState, useEffect } from 'react';
import { useFileUploadContext } from '../contexts/FileUploadContext';
import styles from '../app/converter/converter.module.css';

// Supported conversion formats
const CONVERSION_OPTIONS = {
  'application/pdf': [
    { value: 'docx', label: 'Word Document (.docx)' },
    { value: 'jpg', label: 'JPEG Image (.jpg)' },
    { value: 'png', label: 'PNG Image (.png)' },
    { value: 'txt', label: 'Text File (.txt)' },
  ],
  'application/msword': [
    { value: 'pdf', label: 'PDF Document (.pdf)' },
    { value: 'docx', label: 'Word Document (.docx)' },
    { value: 'txt', label: 'Text File (.txt)' },
  ],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [
    { value: 'pdf', label: 'PDF Document (.pdf)' },
    { value: 'doc', label: 'Word 97-2003 (.doc)' },
    { value: 'txt', label: 'Text File (.txt)' },
  ],
  'application/vnd.ms-excel': [
    { value: 'pdf', label: 'PDF Document (.pdf)' },
    { value: 'xlsx', label: 'Excel Workbook (.xlsx)' },
    { value: 'csv', label: 'CSV File (.csv)' },
  ],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [
    { value: 'pdf', label: 'PDF Document (.pdf)' },
    { value: 'xls', label: 'Excel 97-2003 (.xls)' },
    { value: 'csv', label: 'CSV File (.csv)' },
  ],
  'image/jpeg': [
    { value: 'png', label: 'PNG Image (.png)' },
    { value: 'pdf', label: 'PDF Document (.pdf)' },
    { value: 'webp', label: 'WebP Image (.webp)' },
  ],
  'image/png': [
    { value: 'jpg', label: 'JPEG Image (.jpg)' },
    { value: 'pdf', label: 'PDF Document (.pdf)' },
    { value: 'webp', label: 'WebP Image (.webp)' },
  ],
  'text/plain': [
    { value: 'pdf', label: 'PDF Document (.pdf)' },
    { value: 'docx', label: 'Word Document (.docx)' },
  ],
};

// Default conversion options
const DEFAULT_CONVERSION_OPTIONS = [
  { value: 'pdf', label: 'PDF Document (.pdf)' },
  { value: 'docx', label: 'Word Document (.docx)' },
  { value: 'jpg', label: 'JPEG Image (.jpg)' },
  { value: 'png', label: 'PNG Image (.png)' },
];

const ConversionOptions = () => {
  const { 
    files, 
    conversions, 
    handleConvertFile, 
    handleDownloadFile,
    isUploading,
  } = useFileUploadContext();
  
  const [selectedFormat, setSelectedFormat] = useState('');
  const [availableFormats, setAvailableFormats] = useState([]);
  
  // Update available formats when selected files change
  useEffect(() => {
    if (files.length === 0) {
      setAvailableFormats([]);
      setSelectedFormat('');
      return;
    }
    
    // For now, just use the first file's type to determine available formats
    const file = files[0];
    const formats = CONVERSION_OPTIONS[file.type] || DEFAULT_CONVERSION_OPTIONS;
    
    setAvailableFormats(formats);
    setSelectedFormat(formats[0]?.value || '');
  }, [files]);
  
  const handleConvert = useCallback(() => {
    if (!selectedFormat || files.length === 0) return;
    
    // Convert all selected files
    files.forEach(file => {
      if (file.status === 'completed') {
        handleConvertFile(file.id, selectedFormat);
      }
    });
  }, [selectedFormat, files, handleConvertFile]);
  
  // Show conversion results
  const renderConversionResults = () => {
    if (files.length === 0) return null;
    
    return (
      <div className={styles.results}>
        <h3>Conversion Results</h3>
        
        {files.map(file => {
          const fileConversions = conversions[file.id] || {};
          const formatKeys = Object.keys(fileConversions);
          
          if (formatKeys.length === 0) return null;
          
          return (
            <div key={file.id} className={styles.fileConversion}>
              <h4>{file.name}</h4>
              <ul>
                {formatKeys.map(format => {
                  const conversion = fileConversions[format];
                  const formatInfo = availableFormats.find(f => f.value === format) || 
                    { label: format.toUpperCase() };
                  
                  return (
                    <li key={format} className={styles.conversionItem}>
                      <span className={styles.formatName}>
                        {formatInfo.label}
                      </span>
                      
                      {conversion.status === 'converting' && (
                        <span className={styles.status}>
                          Converting... {conversion.progress}%
                        </span>
                      )}
                      
                      {conversion.status === 'completed' && (
                        <button
                          className={styles.downloadButton}
                          onClick={() => {
                            const fileName = `${file.name.split('.').slice(0, -1).join('.')}.${format}`;
                            handleDownloadFile(conversion.result.id, fileName);
                          }}
                        >
                          Download
                        </button>
                      )}
                      
                      {conversion.status === 'error' && (
                        <span className={styles.errorText}>
                          {conversion.error || 'Conversion failed'}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    );
  };
  
  if (files.length === 0) return null;
  
  const hasCompletedUploads = files.some(f => f.status === 'completed');
  const isConverting = Object.values(conversions).some(
    formatConversions => Object.values(formatConversions).some(
      conv => conv.status === 'converting'
    )
  );
  
  return (
    <div className={styles.conversionSection}>
      <div className={styles.formatSelector}>
        <label htmlFor="targetFormat">Convert to:</label>
        <select
          id="targetFormat"
          value={selectedFormat}
          onChange={(e) => setSelectedFormat(e.target.value)}
          disabled={!hasCompletedUploads || isUploading || isConverting}
        >
          {availableFormats.map(format => (
            <option key={format.value} value={format.value}>
              {format.label}
            </option>
          ))}
        </select>
        
        <button
          className={styles.convertButton}
          onClick={handleConvert}
          disabled={!selectedFormat || !hasCompletedUploads || isUploading || isConverting}
        >
          {isConverting ? 'Converting...' : 'Convert'}
        </button>
      </div>
      
      {renderConversionResults()}
    </div>
  );
};

export default ConversionOptions;
