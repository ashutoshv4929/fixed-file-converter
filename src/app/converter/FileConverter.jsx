"use client";
import React from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faFileWord, 
  faFileExcel, 
  faFilePowerpoint, 
  faFilePdf, 
  faFileImage,
  faFileAlt,
  faFileArchive,
  faFileCode,
  faFileAudio,
  faFileVideo,
  faFileDownload,
  faFileUpload,
  faCompress,
  faFileExport,
  faFileImport,
  faFileSignature,
  faFileInvoice,
  faFileContract,
  faFilePrescription,
  faFileMedical,
  faFileInvoiceDollar,
  faRefresh,
  faSpinner,
  faExchangeAlt,
  faExclamationCircle,
  faTimes,
  faCloud
} from '@fortawesome/free-solid-svg-icons';

// Conversion options with Font Awesome icons
const conversionOptions = [
  {
    id: "pdf-to-word",
    name: "PDF to Word",
    icon: faFileWord,
    from: "PDF",
    to: "DOCX",
  },
  {
    id: "pdf-to-excel",
    name: "PDF to Excel",
    icon: faFileExcel,
    from: "PDF",
    to: "XLSX",
  },
  {
    id: "pdf-to-powerpoint",
    name: "PDF to PowerPoint",
    icon: faFilePowerpoint,
    from: "PDF",
    to: "PPTX",
  },
  {
    id: "pdf-to-jpg",
    name: "PDF to JPG",
    icon: faFileImage,
    from: "PDF",
    to: "JPG",
  },
  {
    id: "word-to-pdf",
    name: "Word to PDF",
    icon: faFilePdf,
    from: "DOCX",
    to: "PDF",
  },
  {
    id: "excel-to-pdf",
    name: "Excel to PDF",
    icon: faFilePdf,
    from: "XLSX",
    to: "PDF",
  },
  {
    id: "powerpoint-to-pdf",
    name: "PowerPoint to PDF",
    icon: faFilePdf,
    from: "PPTX",
    to: "PDF",
  },
  {
    id: "jpg-to-pdf",
    name: "JPG to PDF",
    icon: faFilePdf,
    from: "JPG",
    to: "PDF",
  },
  {
    id: "compress-pdf",
    name: "Compress PDF",
    icon: faCompress,
    from: "PDF",
    to: "PDF",
  },
];

// Main component with proper initialization
function FileConverter() {
  const [selectedFiles, setSelectedFiles] = React.useState([]);
  const [targetFormat, setTargetFormat] = React.useState("");
  const [isConverting, setIsConverting] = React.useState(false);
  const [convertedFiles, setConvertedFiles] = React.useState([]);
  const [error, setError] = React.useState("");
  const [uploading, setUploading] = React.useState(false);
  
  // Get the selected conversion option
  const selectedOption = React.useMemo(() => {
    return conversionOptions.find(option => option.id === targetFormat) || null;
  }, [targetFormat]);

  // Handle file selection
  const handleFileSelect = React.useCallback((event) => {
    try {
      const files = Array.from(event.target.files);
      if (files.length === 0) return;
      
      setSelectedFiles(prev => [...prev, ...files]);
      setError("");
    } catch (err) {
      setError("Failed to select files. Please try again.");
      console.error(err);
    }
  }, []);

  // Handle file conversion with CloudConvert
  const handleConvert = React.useCallback(async () => {
    if (!selectedOption) {
      setError("Please select a conversion type");
      return;
    }
    
    if (selectedFiles.length === 0) {
      setError("Please select at least one file");
      return;
    }
    
    try {
      setIsConverting(true);
      setError("");
      
      // Convert each file using CloudConvert
      const converted = [];
      
      for (const file of selectedFiles) {
        try {
          setUploading(true);
          
          // Call our API route to handle the conversion
          const response = await fetch('/api/cloudconvert', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              file: {
                name: file.name,
                size: file.size,
                type: file.type,
              },
              targetFormat: selectedOption.to,
            }),
          });
          
          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to start conversion');
          }
          
          const { jobId, uploadUrl, method, headers } = await response.json();
          
          // Upload the file to CloudConvert
          const uploadResponse = await fetch(uploadUrl, {
            method,
            body: file,
            headers: {
              ...headers,
              'Content-Length': file.size,
            },
          });
          
          if (!uploadResponse.ok) {
            throw new Error('Failed to upload file');
          }
          
          // Poll for conversion completion
          let downloadUrl;
          let attempts = 0;
          const maxAttempts = 60; // 1 minute timeout (60 * 1 second)
          
          while (attempts < maxAttempts) {
            const statusResponse = await fetch(`/api/cloudconvert?jobId=${jobId}`);
            
            if (!statusResponse.ok) {
              const error = await statusResponse.json();
              throw new Error(error.error || 'Failed to get conversion status');
            }
            
            const statusData = await statusResponse.json();
            
            if (statusData.status === 'finished') {
              downloadUrl = statusData.downloadUrl;
              break;
            } else if (statusData.status === 'error') {
              throw new Error(statusData.error || 'Conversion failed');
            }
            
            // Wait before polling again
            await new Promise(resolve => setTimeout(resolve, 1000));
            attempts++;
          }
          
          if (!downloadUrl) {
            throw new Error('Conversion timed out');
          }
          
          converted.push({
            id: jobId,
            name: file.name.replace(/\.[^/.]+$/, '') + '.' + selectedOption.to.toLowerCase(),
            type: selectedOption.to.toLowerCase(),
            size: file.size,
            url: downloadUrl
          });
          
        } catch (err) {
          console.error(`Error converting file ${file.name}:`, err);
          // Continue with other files even if one fails
          setError(`Failed to convert ${file.name}: ${err.message}`);
        } finally {
          setUploading(false);
        }
      }
      
      setConvertedFiles(converted);
      
      if (converted.length === 0) {
        setError("Failed to convert any files. Please try again.");
      } else if (converted.length < selectedFiles.length) {
        setError(`Successfully converted ${converted.length} of ${selectedFiles.length} files. Some files failed to convert.`);
      }
      
    } catch (err) {
      console.error('Conversion error:', err);
      setError(err.message || "Failed to convert files. Please try again.");
    } finally {
      setIsConverting(false);
    }
  }, [selectedOption, selectedFiles]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
                <FontAwesomeIcon icon={faFilePdf} className="text-white text-xl" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  FileConverter
                </h1>
                <p className="text-sm text-gray-500">Convert files instantly with CloudConvert</p>
              </div>
            </div>
            <button
              onClick={() => {
                setSelectedFiles([]);
                setConvertedFiles([]);
                setError("");
              }}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <FontAwesomeIcon icon={faRefresh} className="mr-2" />
              Reset
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Conversion Options */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Choose Conversion Type
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {conversionOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => setTargetFormat(option.id)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  targetFormat === option.id
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-200 hover:border-gray-300 text-gray-700"
                }`}
              >
                <FontAwesomeIcon icon={option.icon} className="text-2xl mb-2" />
                <div className="text-sm font-medium">{option.name}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {option.from} → {option.to}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* File Upload */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Select Files
          </h2>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
            <input
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png"
              disabled={isConverting}
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <div className="flex flex-col items-center">
                <FontAwesomeIcon 
                  icon={uploading ? faSpinner : faCloud} 
                  className={`text-4xl mb-4 ${uploading ? 'animate-spin' : ''} text-blue-500`} 
                />
                <p className="text-lg font-medium text-gray-700 mb-2">
                  {uploading ? "Uploading..." : "Click to upload files"}
                </p>
                <p className="text-sm text-gray-500">
                  Support: PDF, Word, Excel, PowerPoint, JPG, PNG
                </p>
              </div>
            </label>
          </div>

          {/* Selected Files */}
          {selectedFiles.length > 0 && (
            <div className="mt-6">
              <h3 className="font-medium text-gray-900 mb-3">
                Selected Files ({selectedFiles.length})
              </h3>
              <div className="space-y-2">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <FontAwesomeIcon icon={faFileAlt} className="text-gray-400" />
                      <span className="text-sm font-medium text-gray-900 truncate max-w-xs">
                        {file.name}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        const newFiles = [...selectedFiles];
                        newFiles.splice(index, 1);
                        setSelectedFiles(newFiles);
                      }}
                      className="text-red-500 hover:text-red-700"
                      disabled={isConverting}
                    >
                      <FontAwesomeIcon icon={faTimes} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Convert Button */}
        {(selectedFiles.length > 0 && targetFormat) && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <button
              onClick={handleConvert}
              disabled={isConverting || uploading}
              className={`w-full py-3 px-6 rounded-lg font-semibold text-white transition-colors ${
                isConverting || uploading 
                  ? 'bg-blue-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isConverting || uploading ? (
                <>
                  <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
                  {uploading ? 'Uploading...' : 'Converting...'}
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faExchangeAlt} className="mr-2" />
                  Convert to {selectedOption?.to || 'Selected Format'}
                </>
              )}
            </button>
          </div>
        )}

        {/* Converted Files */}
        {convertedFiles.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Converted Files
            </h2>
            <div className="space-y-3">
              {convertedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FontAwesomeIcon icon={faFileDownload} className="text-green-500" />
                    <span className="text-sm font-medium text-gray-900">
                      {file.name}
                    </span>
                  </div>
                  <a
                    href={file.url}
                    download={file.name}
                    className="px-3 py-1 bg-green-600 text-white text-sm font-medium rounded hover:bg-green-700 transition-colors"
                  >
                    Download
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <FontAwesomeIcon icon={faExclamationCircle} className="text-red-500 mr-2" />
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default FileConverter;
