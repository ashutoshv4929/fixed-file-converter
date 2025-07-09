"use client";
import React from "react";

import { useUpload } from "../../utilities/runtime-helpers";

function MainComponent() {
  const [selectedFiles, setSelectedFiles] = React.useState([]);
  const [conversionType, setConversionType] = React.useState("");
  const [isConverting, setIsConverting] = React.useState(false);
  const [convertedFiles, setConvertedFiles] = React.useState([]);
  const [error, setError] = React.useState("");
  const [upload, { loading: uploading }] = useUpload();

  const conversionOptions = [
    {
      id: "pdf-to-word",
      name: "PDF to Word",
      icon: "fas fa-file-word",
      from: "PDF",
      to: "DOCX",
    },
    {
      id: "pdf-to-excel",
      name: "PDF to Excel",
      icon: "fas fa-file-excel",
      from: "PDF",
      to: "XLSX",
    },
    {
      id: "pdf-to-powerpoint",
      name: "PDF to PowerPoint",
      icon: "fas fa-file-powerpoint",
      from: "PDF",
      to: "PPTX",
    },
    {
      id: "pdf-to-jpg",
      name: "PDF to JPG",
      icon: "fas fa-file-image",
      from: "PDF",
      to: "JPG",
    },
    {
      id: "word-to-pdf",
      name: "Word to PDF",
      icon: "fas fa-file-pdf",
      from: "DOCX",
      to: "PDF",
    },
    {
      id: "excel-to-pdf",
      name: "Excel to PDF",
      icon: "fas fa-file-pdf",
      from: "XLSX",
      to: "PDF",
    },
    {
      id: "powerpoint-to-pdf",
      name: "PowerPoint to PDF",
      icon: "fas fa-file-pdf",
      from: "PPTX",
      to: "PDF",
    },
    {
      id: "jpg-to-pdf",
      name: "JPG to PDF",
      icon: "fas fa-file-pdf",
      from: "JPG",
      to: "PDF",
    },
    {
      id: "png-to-pdf",
      name: "PNG to PDF",
      icon: "fas fa-file-pdf",
      from: "PNG",
      to: "PDF",
    },
    {
      id: "image-to-text",
      name: "Extract to Word",
      icon: "fas fa-file-word",
      from: "IMAGE",
      to: "DOCX",
    },
    {
      id: "merge-pdf",
      name: "Merge PDF",
      icon: "fas fa-object-group",
      from: "PDF",
      to: "PDF",
    },
    {
      id: "split-pdf",
      name: "Split PDF",
      icon: "fas fa-cut",
      from: "PDF",
      to: "PDF",
    },
    {
      id: "compress-pdf",
      name: "Compress PDF",
      icon: "fas fa-compress",
      from: "PDF",
      to: "PDF",
    },
  ];

  const handleFileSelect = async (event) => {
    const files = Array.from(event.target.files);
    setError("");
    console.log('Files selected for upload:', files);

    if (files.length === 0) {
      setError('No files selected');
      return;
    }

    const uploadedFiles = [];
    for (const file of files) {
      try {
        console.log('Starting upload for file:', file.name, {
          size: file.size,
          type: file.type,
          isFile: file instanceof File,
          isBlob: file instanceof Blob
        });
        
        const result = await upload({ file });
        console.log('Upload completed for file:', file.name, 'Result:', result);
        
        if (!result || !result.url) {
          throw new Error('Upload completed but no URL was returned');
        }
        
        uploadedFiles.push({
          name: file.name,
          url: result.url,
          size: file.size,
          type: file.type,
        });
        
        // Clear any previous errors if we successfully uploaded at least one file
        setError("");
      } catch (err) {
        console.error('Error uploading file:', file.name, err);
        setError(`Failed to upload ${file.name}: ${err.message}`);
        
        // Don't return here, try to upload remaining files
        continue;
      }
    }

    if (uploadedFiles.length > 0) {
      setSelectedFiles(prevFiles => [...prevFiles, ...uploadedFiles]);
    }
  };

  const handleConvert = async () => {
    if (!conversionType || selectedFiles.length === 0) {
      setError("Please select files and conversion type");
      return;
    }

    setIsConverting(true);
    setError("");

    try {
      const response = await fetch("/api/convert", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          files: selectedFiles,
          conversionType: conversionType,
        }),
      });

      if (!response.ok) {
        throw new Error(`Conversion failed: ${response.statusText}`);
      }

      const result = await response.json();
      setConvertedFiles(result.convertedFiles || []);
    } catch (err) {
      console.error(err);
      setError("Conversion failed. Please try again.");
    } finally {
      setIsConverting(false);
    }
  };

  const resetApp = () => {
    setSelectedFiles([]);
    setConvertedFiles([]);
    setConversionType("");
    setError("");
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
                <i className="fas fa-file-pdf text-white text-xl"></i>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  FileConverter
                </h1>
                <p className="text-sm text-gray-500">Convert files instantly</p>
              </div>
            </div>
            <button
              onClick={resetApp}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <i className="fas fa-refresh mr-2"></i>
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
                onClick={() => setConversionType(option.id)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  conversionType === option.id
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-200 hover:border-gray-300 text-gray-700"
                }`}
              >
                <i className={`${option.icon} text-2xl mb-2`}></i>
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
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <div className="flex flex-col items-center">
                <i className="fas fa-cloud-upload-alt text-4xl text-gray-400 mb-4"></i>
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
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <i className="fas fa-file text-gray-400"></i>
                      <div>
                        <p className="font-medium text-gray-900">{file.name}</p>
                        <p className="text-sm text-gray-500">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        setSelectedFiles((files) =>
                          files.filter((_, i) => i !== index)
                        )
                      }
                      className="text-red-500 hover:text-red-700 transition-colors"
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Convert Button */}
        {selectedFiles.length > 0 && conversionType && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <button
              onClick={handleConvert}
              disabled={isConverting}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-4 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              {isConverting ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  <span>Converting...</span>
                </>
              ) : (
                <>
                  <i className="fas fa-magic"></i>
                  <span>Convert Files</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <i className="fas fa-exclamation-triangle text-red-500 mr-3"></i>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Converted Files */}
        {convertedFiles.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Converted Files
            </h2>

            <div className="space-y-3">
              {convertedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex flex-col p-4 bg-green-50 border border-green-200 rounded-lg"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <i className="fas fa-check-circle text-green-500"></i>
                      <div>
                        <p className="font-medium text-gray-900">{file.name}</p>
                        <p className="text-sm text-gray-500">
                          {file.description || "Ready for download"}
                        </p>
                      </div>
                    </div>
                    <a
                      href={file.url}
                      download={file.name}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
                    >
                      <i className="fas fa-download"></i>
                      <span>Download</span>
                    </a>
                  </div>

                  {/* Show extracted text preview for text extraction */}
                  {file.textContent && (
                    <div className="mt-3 p-4 bg-white border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">
                          Extracted Text:
                        </h4>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(file.textContent);
                            // You could add a toast notification here
                          }}
                          className="text-blue-600 hover:text-blue-800 text-sm flex items-center space-x-1"
                        >
                          <i className="fas fa-copy"></i>
                          <span>Copy</span>
                        </button>
                      </div>
                      <div className="max-h-40 overflow-y-auto bg-gray-50 p-3 rounded border text-sm text-gray-700 whitespace-pre-wrap">
                        {file.textContent}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Features */}
        <div className="mt-8 grid md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6 text-center">
            <i className="fas fa-shield-alt text-3xl text-blue-500 mb-4"></i>
            <h3 className="font-semibold text-gray-900 mb-2">Secure</h3>
            <p className="text-sm text-gray-600">
              Your files are processed securely and deleted after conversion
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 text-center">
            <i className="fas fa-bolt text-3xl text-yellow-500 mb-4"></i>
            <h3 className="font-semibold text-gray-900 mb-2">Fast</h3>
            <p className="text-sm text-gray-600">
              Lightning-fast conversion with high-quality results
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 text-center">
            <i className="fas fa-mobile-alt text-3xl text-green-500 mb-4"></i>
            <h3 className="font-semibold text-gray-900 mb-2">
              Mobile Friendly
            </h3>
            <p className="text-sm text-gray-600">
              Works perfectly on all devices and screen sizes
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MainComponent;