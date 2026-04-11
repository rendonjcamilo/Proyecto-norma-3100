import { jsx as _jsx } from "react/jsx-runtime";
/**
 * EvidenceUploader Component Tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EvidenceUploader } from '../EvidenceUploader';
describe('EvidenceUploader', () => {
    const mockOnFileUpload = vi.fn();
    const mockOnError = vi.fn();
    beforeEach(() => {
        mockOnFileUpload.mockClear();
        mockOnError.mockClear();
    });
    describe('Component Rendering', () => {
        it('should render upload zone', () => {
            render(_jsx(EvidenceUploader, { actionId: "act-1", onFileUpload: mockOnFileUpload }));
            expect(screen.getByText(/Arrastra archivos aquí/i)).toBeInTheDocument();
        });
        it('should display file type help text', () => {
            render(_jsx(EvidenceUploader, { actionId: "act-1", onFileUpload: mockOnFileUpload }));
            expect(screen.getByText(/PDF, imágenes, video/i)).toBeInTheDocument();
        });
        it('should render file input', () => {
            const { container } = render(_jsx(EvidenceUploader, { actionId: "act-1", onFileUpload: mockOnFileUpload }));
            const input = container.querySelector('input[type="file"]');
            expect(input).toBeInTheDocument();
            expect(input).toHaveAttribute('accept', '.pdf,.jpg,.jpeg,.png,.mp4,.mov');
        });
    });
    describe('File Selection', () => {
        it('should accept valid PDF files', async () => {
            const { container } = render(_jsx(EvidenceUploader, { actionId: "act-1", onFileUpload: mockOnFileUpload }));
            const file = new File(['content'], 'report.pdf', { type: 'application/pdf' });
            const input = container.querySelector('input[type="file"]');
            fireEvent.change(input, { target: { files: [file] } });
            await waitFor(() => {
                expect(screen.getByText('report.pdf')).toBeInTheDocument();
            });
        });
        it('should accept valid image files', async () => {
            const { container } = render(_jsx(EvidenceUploader, { actionId: "act-1", onFileUpload: mockOnFileUpload }));
            const file = new File(['content'], 'evidence.jpg', { type: 'image/jpeg' });
            const input = container.querySelector('input[type="file"]');
            fireEvent.change(input, { target: { files: [file] } });
            await waitFor(() => {
                expect(screen.getByText('evidence.jpg')).toBeInTheDocument();
            });
        });
        it('should accept valid video files', async () => {
            const { container } = render(_jsx(EvidenceUploader, { actionId: "act-1", onFileUpload: mockOnFileUpload }));
            const file = new File(['content'], 'demo.mp4', { type: 'video/mp4' });
            const input = container.querySelector('input[type="file"]');
            fireEvent.change(input, { target: { files: [file] } });
            await waitFor(() => {
                expect(screen.getByText('demo.mp4')).toBeInTheDocument();
            });
        });
    });
    describe('File Validation', () => {
        it('should reject invalid file types', async () => {
            const { container } = render(_jsx(EvidenceUploader, { actionId: "act-1", onFileUpload: mockOnFileUpload, onError: mockOnError }));
            const file = new File(['content'], 'file.exe', { type: 'application/x-executable' });
            const input = container.querySelector('input[type="file"]');
            fireEvent.change(input, { target: { files: [file] } });
            await waitFor(() => {
                expect(mockOnError).toHaveBeenCalled();
                expect(screen.getByText(/No permitido/i)).toBeInTheDocument();
            });
        });
        it('should enforce size limit', async () => {
            const { container } = render(_jsx(EvidenceUploader, { actionId: "act-1", onFileUpload: mockOnFileUpload, onError: mockOnError, maxSize: 1024 }));
            const largeContent = new ArrayBuffer(2048);
            const file = new File([largeContent], 'large.pdf', { type: 'application/pdf' });
            const input = container.querySelector('input[type="file"]');
            fireEvent.change(input, { target: { files: [file] } });
            await waitFor(() => {
                expect(mockOnError).toHaveBeenCalled();
                expect(screen.getByText(/excede.*límite/i)).toBeInTheDocument();
            });
        });
        it('should prevent duplicate file uploads', async () => {
            const { container } = render(_jsx(EvidenceUploader, { actionId: "act-1", onFileUpload: mockOnFileUpload, onError: mockOnError }));
            const file = new File(['content'], 'report.pdf', { type: 'application/pdf' });
            const input = container.querySelector('input[type="file"]');
            fireEvent.change(input, { target: { files: [file] } });
            await waitFor(() => {
                expect(screen.getByText('report.pdf')).toBeInTheDocument();
            });
            // Try to upload same file again
            fireEvent.change(input, { target: { files: [file] } });
            await waitFor(() => {
                expect(mockOnError).toHaveBeenCalled();
            });
        });
    });
    describe('Drag and Drop', () => {
        it('should handle drag over event', () => {
            const { container } = render(_jsx(EvidenceUploader, { actionId: "act-1", onFileUpload: mockOnFileUpload }));
            const dropZone = container.querySelector('.drag-drop-zone');
            const dragEvent = new DragEvent('dragover', { dataTransfer: new DataTransfer() });
            fireEvent.dragOver(dropZone, { dataTransfer: dragEvent.dataTransfer });
            expect(dropZone).toHaveClass('drag-over');
        });
        it('should handle file drop', async () => {
            const { container } = render(_jsx(EvidenceUploader, { actionId: "act-1", onFileUpload: mockOnFileUpload }));
            const file = new File(['content'], 'report.pdf', { type: 'application/pdf' });
            const dropZone = container.querySelector('.drag-drop-zone');
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            fireEvent.drop(dropZone, { dataTransfer });
            await waitFor(() => {
                expect(screen.getByText('report.pdf')).toBeInTheDocument();
            });
        });
        it('should reject invalid files on drop', async () => {
            const { container } = render(_jsx(EvidenceUploader, { actionId: "act-1", onFileUpload: mockOnFileUpload, onError: mockOnError }));
            const file = new File(['content'], 'script.exe', { type: 'application/x-executable' });
            const dropZone = container.querySelector('.drag-drop-zone');
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            fireEvent.drop(dropZone, { dataTransfer });
            await waitFor(() => {
                expect(mockOnError).toHaveBeenCalled();
            });
        });
    });
    describe('Upload Handler', () => {
        it('should call onFileUpload when upload succeeds', async () => {
            mockOnFileUpload.mockResolvedValue(undefined);
            const { container } = render(_jsx(EvidenceUploader, { actionId: "act-1", onFileUpload: mockOnFileUpload }));
            const file = new File(['content'], 'report.pdf', { type: 'application/pdf' });
            const input = container.querySelector('input[type="file"]');
            fireEvent.change(input, { target: { files: [file] } });
            const uploadButton = screen.getByRole('button', { name: /Enviar/i });
            fireEvent.click(uploadButton);
            await waitFor(() => {
                expect(mockOnFileUpload).toHaveBeenCalledWith(file);
            });
        });
        it('should handle upload errors', async () => {
            mockOnFileUpload.mockRejectedValue(new Error('Upload failed'));
            const { container } = render(_jsx(EvidenceUploader, { actionId: "act-1", onFileUpload: mockOnFileUpload, onError: mockOnError }));
            const file = new File(['content'], 'report.pdf', { type: 'application/pdf' });
            const input = container.querySelector('input[type="file"]');
            fireEvent.change(input, { target: { files: [file] } });
            const uploadButton = screen.getByRole('button', { name: /Enviar/i });
            fireEvent.click(uploadButton);
            await waitFor(() => {
                expect(mockOnError).toHaveBeenCalled();
            });
        });
        it('should show loading state during upload', async () => {
            mockOnFileUpload.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
            const { container } = render(_jsx(EvidenceUploader, { actionId: "act-1", onFileUpload: mockOnFileUpload }));
            const file = new File(['content'], 'report.pdf', { type: 'application/pdf' });
            const input = container.querySelector('input[type="file"]');
            fireEvent.change(input, { target: { files: [file] } });
            const uploadButton = screen.getByRole('button', { name: /Enviar/i });
            fireEvent.click(uploadButton);
            expect(uploadButton).toBeDisabled();
            await waitFor(() => {
                expect(uploadButton).not.toBeDisabled();
            });
        });
    });
    describe('Accessibility', () => {
        it('should have proper ARIA labels', () => {
            render(_jsx(EvidenceUploader, { actionId: "act-1", onFileUpload: mockOnFileUpload }));
            const input = screen.getByLabelText(/Archivos de evidencia/i);
            expect(input).toBeInTheDocument();
        });
        it('should be keyboard navigable', async () => {
            const user = userEvent.setup();
            const { container } = render(_jsx(EvidenceUploader, { actionId: "act-1", onFileUpload: mockOnFileUpload }));
            const button = screen.getByRole('button', { name: /Seleccionar/i });
            await user.tab();
            expect(button).toHaveFocus();
        });
    });
});
//# sourceMappingURL=EvidenceUploader.test.js.map