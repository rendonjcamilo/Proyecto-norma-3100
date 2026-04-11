/**
 * Evidence Uploader Component
 * Drag-drop file upload for corrective action evidence
 * Supports: PDF, images (JPG/PNG), video (MP4/MOV), max 500MB
 */

import React, { useRef, useState } from 'react';
import './EvidenceUploader.css';

export interface UploadedFile {
  id?: string;
  filename: string;
  fileSize: number;
  fileType: string;
  uploadedAt?: Date;
  uploadedBy?: string;
  contentHash?: string;
}

interface EvidenceUploaderProps {
  actionId: string;
  onFileUpload: (file: UploadedFile) => Promise<void>;
  onError?: (error: string) => void;
  maxSize?: number; // bytes
  acceptedTypes?: string[];
}

export const EvidenceUploader: React.FC<EvidenceUploaderProps> = ({
  actionId,
  onFileUpload,
  onError,
  maxSize = 500 * 1024 * 1024, // 500MB default
  acceptedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'video/mp4',
    'video/quicktime',
  ],
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): { valid: boolean; error?: string } => {
    // Check file type
    if (!acceptedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `Tipo de archivo no permitido. Permitidos: PDF, imágenes (JPG/PNG), vídeos (MP4/MOV)`,
      };
    }

    // Check file size
    if (file.size > maxSize) {
      return {
        valid: false,
        error: `El archivo excede el tamaño máximo de ${maxSize / (1024 * 1024)}MB`,
      };
    }

    return { valid: true };
  };

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const validation = validateFile(file);

      if (!validation.valid) {
        const errorMsg = `${file.name}: ${validation.error}`;
        setError(errorMsg);
        onError?.(errorMsg);
        continue;
      }

      await uploadFile(file);
    }
  };

  const uploadFile = async (file: File) => {
    try {
      setIsUploading(true);
      setError(null);

      // Create FormData for multipart upload
      const formData = new FormData();
      formData.append('actionId', actionId);
      formData.append('file', file);

      // Simulate upload with progress tracking
      setUploadProgress(0);
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + Math.random() * 30;
        });
      }, 200);

      // Create file object
      const uploadedFile: UploadedFile = {
        filename: file.name,
        fileSize: file.size,
        fileType: file.type,
        uploadedAt: new Date(),
      };

      // Call parent handler
      await onFileUpload(uploadedFile);

      clearInterval(progressInterval);
      setUploadProgress(100);

      // Add to uploaded files list
      setUploadedFiles(prev => [...prev, uploadedFile]);

      // Reset after delay
      setTimeout(() => {
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        setUploadProgress(0);
        setIsUploading(false);
      }, 1000);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error al cargar el archivo';
      setError(errorMsg);
      onError?.(errorMsg);
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
  };

  const getFileIcon = (fileType: string): string => {
    if (fileType.startsWith('image/')) return '🖼️';
    if (fileType.startsWith('video/')) return '🎥';
    if (fileType === 'application/pdf') return '📄';
    return '📎';
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="evidence-uploader">
      <div className="uploader-header">
        <h4>Subir Evidencia</h4>
        <p className="uploader-help">
          Soportados: PDF, imágenes (JPG/PNG), vídeos (MP4/MOV), máximo 500MB
        </p>
      </div>

      <div
        className={`drag-drop-zone ${isDragging ? 'dragging' : ''} ${
          isUploading ? 'uploading' : ''
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleInputChange}
          disabled={isUploading}
          className="file-input"
        />

        <div className="drop-content">
          <span className="drop-icon">📤</span>
          <p className="drop-text">
            Arrastra archivos aquí o{' '}
            <button
              type="button"
              className="browse-btn"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              selecciona
            </button>
          </p>
        </div>

        {isUploading && (
          <div className="upload-progress">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="progress-text">{Math.round(uploadProgress)}%</p>
          </div>
        )}
      </div>

      {error && (
        <div className="error-message">
          <strong>Error:</strong> {error}
        </div>
      )}

      {uploadedFiles.length > 0 && (
        <div className="uploaded-files">
          <h5>Archivos Subidos ({uploadedFiles.length})</h5>
          <div className="files-list">
            {uploadedFiles.map((file, index) => (
              <div key={index} className="file-item">
                <div className="file-info">
                  <span className="file-icon">{getFileIcon(file.fileType)}</span>
                  <div className="file-details">
                    <p className="file-name">{file.filename}</p>
                    <p className="file-size">{formatFileSize(file.fileSize)}</p>
                  </div>
                </div>
                <button
                  type="button"
                  className="remove-btn"
                  onClick={() => removeFile(index)}
                  title="Eliminar archivo"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EvidenceUploader;
