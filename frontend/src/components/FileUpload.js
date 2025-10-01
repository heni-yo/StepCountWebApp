import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, X, AlertCircle } from 'lucide-react';

const FileUpload = ({ onFileUpload, isProcessing }) => {
  const [uploadedFile, setUploadedFile] = useState(null);
  const [error, setError] = useState(null);

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    setError(null);
    
    if (rejectedFiles.length > 0) {
      const rejection = rejectedFiles[0];
      if (rejection.errors[0]?.code === 'file-invalid-type') {
        setError('Please upload a CSV file');
      } else if (rejection.errors[0]?.code === 'file-too-large') {
        setError('File is too large. Please upload a file smaller than 100MB');
      } else {
        setError('Invalid file. Please try again.');
      }
      return;
    }

    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setUploadedFile(file);
      onFileUpload(file);
    }
  }, [onFileUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/csv': ['.csv']
    },
    maxSize: 100 * 1024 * 1024, // 100MB
    multiple: false,
    disabled: isProcessing
  });

  const removeFile = () => {
    setUploadedFile(null);
    setError(null);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getShortFileName = (fileName) => {
    const nameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.'));
    const extension = fileName.split('.').pop();
    
    // Extract meaningful parts (remove common prefixes/suffixes)
    let shortName = nameWithoutExt
      .replace(/stepcount_/gi, '')
      .replace(/_cond_\d+_pose_\d+_\d+_steps/gi, '')
      .replace(/_104hz/gi, '')
      .replace(/_/g, ' ')
      .trim();
    
    if (shortName.length > 20) {
      shortName = shortName.substring(0, 20) + '...';
    }
    
    return shortName + '.' + extension;
  };

  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload CSV File</h2>
      
      {!uploadedFile ? (
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
            ${isDragActive 
              ? 'border-primary-400 bg-primary-50' 
              : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
            }
            ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <input {...getInputProps()} />
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-900 mb-2">
            {isDragActive ? 'Drop the CSV file here' : 'Drag & drop a CSV file here'}
          </p>
          <p className="text-sm text-gray-600 mb-4">
            or click to select a file
          </p>
          <p className="text-xs text-gray-500">
            Supports CSV files up to 100MB
          </p>
        </div>
      ) : (
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <File className="w-8 h-8 text-primary-600" />
              <div>
                <p className="font-medium text-gray-900" title={uploadedFile.name}>
                  {getShortFileName(uploadedFile.name)}
                </p>
                <p className="text-sm text-gray-600">{formatFileSize(uploadedFile.size)}</p>
              </div>
            </div>
            {!isProcessing && (
              <button
                onClick={removeFile}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 bg-error-50 border border-error-200 rounded-lg flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-error-600" />
          <p className="text-sm text-error-700">{error}</p>
        </div>
      )}

      {isProcessing && (
        <div className="mt-4 p-4 bg-primary-50 border border-primary-200 rounded-lg">
          <div className="flex items-center space-x-3">
            <div className="loading-spinner"></div>
            <div>
              <p className="font-medium text-primary-900">Processing file...</p>
              <p className="text-sm text-primary-700">This may take a few minutes</p>
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 text-xs text-gray-500">
        <p className="font-medium mb-1">Expected CSV format:</p>
        <p>time,x,y,z</p>
        <p>2023-01-01 10:00:00.000,-0.078923,0.396706,0.917759</p>
        <p>2023-01-01 10:00:00.010,-0.094370,0.381479,0.933580</p>
      </div>
    </div>
  );
};

export default FileUpload;
