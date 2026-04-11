import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Evidence Uploader Component
 * Drag-drop file upload for corrective action evidence
 * Supports: PDF, images (JPG/PNG), video (MP4/MOV), max 500MB
 */
import { useRef, useState } from 'react';
import './EvidenceUploader.css';
export const EvidenceUploader = ({ actionId, onFileUpload, onError, maxSize = 500 * 1024 * 1024, // 500MB default
acceptedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'video/mp4',
    'video/quicktime',
], }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);
    const validateFile = (file) => {
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
    const handleFileSelect = async (files) => {
        if (!files || files.length === 0)
            return;
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
    const uploadFile = async (file) => {
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
            const uploadedFile = {
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
        }
        catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Error al cargar el archivo';
            setError(errorMsg);
            onError?.(errorMsg);
            setIsUploading(false);
            setUploadProgress(0);
        }
    };
    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };
    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };
    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        handleFileSelect(e.dataTransfer.files);
    };
    const handleInputChange = (e) => {
        handleFileSelect(e.target.files);
    };
    const getFileIcon = (fileType) => {
        if (fileType.startsWith('image/'))
            return '🖼️';
        if (fileType.startsWith('video/'))
            return '🎥';
        if (fileType === 'application/pdf')
            return '📄';
        return '📎';
    };
    const formatFileSize = (bytes) => {
        if (bytes === 0)
            return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };
    const removeFile = (index) => {
        setUploadedFiles(prev => prev.filter((_, i) => i !== index));
    };
    return (_jsxs("div", { className: "evidence-uploader", children: [_jsxs("div", { className: "uploader-header", children: [_jsx("h4", { children: "Subir Evidencia" }), _jsx("p", { className: "uploader-help", children: "Soportados: PDF, im\u00E1genes (JPG/PNG), v\u00EDdeos (MP4/MOV), m\u00E1ximo 500MB" })] }), _jsxs("div", { className: `drag-drop-zone ${isDragging ? 'dragging' : ''} ${isUploading ? 'uploading' : ''}`, onDragOver: handleDragOver, onDragLeave: handleDragLeave, onDrop: handleDrop, children: [_jsx("input", { ref: fileInputRef, type: "file", multiple: true, accept: acceptedTypes.join(','), onChange: handleInputChange, disabled: isUploading, className: "file-input" }), _jsxs("div", { className: "drop-content", children: [_jsx("span", { className: "drop-icon", children: "\uD83D\uDCE4" }), _jsxs("p", { className: "drop-text", children: ["Arrastra archivos aqu\u00ED o", ' ', _jsx("button", { type: "button", className: "browse-btn", onClick: () => fileInputRef.current?.click(), disabled: isUploading, children: "selecciona" })] })] }), isUploading && (_jsxs("div", { className: "upload-progress", children: [_jsx("div", { className: "progress-bar", children: _jsx("div", { className: "progress-fill", style: { width: `${uploadProgress}%` } }) }), _jsxs("p", { className: "progress-text", children: [Math.round(uploadProgress), "%"] })] }))] }), error && (_jsxs("div", { className: "error-message", children: [_jsx("strong", { children: "Error:" }), " ", error] })), uploadedFiles.length > 0 && (_jsxs("div", { className: "uploaded-files", children: [_jsxs("h5", { children: ["Archivos Subidos (", uploadedFiles.length, ")"] }), _jsx("div", { className: "files-list", children: uploadedFiles.map((file, index) => (_jsxs("div", { className: "file-item", children: [_jsxs("div", { className: "file-info", children: [_jsx("span", { className: "file-icon", children: getFileIcon(file.fileType) }), _jsxs("div", { className: "file-details", children: [_jsx("p", { className: "file-name", children: file.filename }), _jsx("p", { className: "file-size", children: formatFileSize(file.fileSize) })] })] }), _jsx("button", { type: "button", className: "remove-btn", onClick: () => removeFile(index), title: "Eliminar archivo", children: "\u2715" })] }, index))) })] }))] }));
};
export default EvidenceUploader;
//# sourceMappingURL=EvidenceUploader.js.map