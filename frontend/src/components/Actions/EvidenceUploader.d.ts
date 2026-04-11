/**
 * Evidence Uploader Component
 * Drag-drop file upload for corrective action evidence
 * Supports: PDF, images (JPG/PNG), video (MP4/MOV), max 500MB
 */
import React from 'react';
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
    maxSize?: number;
    acceptedTypes?: string[];
}
export declare const EvidenceUploader: React.FC<EvidenceUploaderProps>;
export default EvidenceUploader;
//# sourceMappingURL=EvidenceUploader.d.ts.map