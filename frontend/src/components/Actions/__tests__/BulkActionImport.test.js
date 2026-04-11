import { jsx as _jsx } from "react/jsx-runtime";
/**
 * BulkActionImport Component Tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BulkActionImport } from '../BulkActionImport';
describe('BulkActionImport', () => {
    const mockOnImport = vi.fn();
    const mockOnClose = vi.fn();
    const mockCSVContent = `provider_id,location_id,action_description,assigned_to,due_date
prov-001,loc-001,Implementar nuevo sistema de backup,engineer@hospital.com,2026-05-10
prov-001,loc-002,Actualizar certificaciones,hr@hospital.com,2026-05-15`;
    beforeEach(() => {
        mockOnImport.mockClear();
        mockOnClose.mockClear();
    });
    describe('Component Rendering', () => {
        it('should render import section', () => {
            render(_jsx(BulkActionImport, { onImport: mockOnImport }));
            expect(screen.getByText(/Importar Acciones Correctivas en Lote/i)).toBeInTheDocument();
        });
        it('should display upload zone', () => {
            const { container } = render(_jsx(BulkActionImport, { onImport: mockOnImport }));
            expect(container.querySelector('.csv-upload-zone')).toBeInTheDocument();
        });
        it('should show CSV format help', () => {
            render(_jsx(BulkActionImport, { onImport: mockOnImport }));
            expect(screen.getByText(/Formato del archivo CSV/i)).toBeInTheDocument();
            expect(screen.getByText(/provider_id/i)).toBeInTheDocument();
            expect(screen.getByText(/location_id/i)).toBeInTheDocument();
        });
        it('should have download template button', () => {
            render(_jsx(BulkActionImport, { onImport: mockOnImport }));
            const templateButton = screen.getByRole('button', { name: /Descargar plantilla/i });
            expect(templateButton).toBeInTheDocument();
        });
    });
    describe('CSV File Upload', () => {
        it('should accept CSV files', async () => {
            const { container } = render(_jsx(BulkActionImport, { onImport: mockOnImport }));
            const file = new File([mockCSVContent], 'actions.csv', { type: 'text/csv' });
            const input = container.querySelector('input[type="file"]');
            fireEvent.change(input, { target: { files: [file] } });
            await waitFor(() => {
                expect(screen.getByText(/Vista Previa/i)).toBeInTheDocument();
            });
        });
        it('should reject non-CSV files', async () => {
            const { container } = render(_jsx(BulkActionImport, { onImport: mockOnImport }));
            const file = new File(['content'], 'data.xlsx', { type: 'application/vnd.ms-excel' });
            const input = container.querySelector('input[type="file"]');
            fireEvent.change(input, { target: { files: [file] } });
            await waitFor(() => {
                expect(screen.getByText(/Por favor, sube un archivo CSV válido/i)).toBeInTheDocument();
            });
        });
        it('should parse CSV content correctly', async () => {
            const { container } = render(_jsx(BulkActionImport, { onImport: mockOnImport }));
            const file = new File([mockCSVContent], 'actions.csv', { type: 'text/csv' });
            const input = container.querySelector('input[type="file"]');
            fireEvent.change(input, { target: { files: [file] } });
            await waitFor(() => {
                expect(screen.getByText('prov-001')).toBeInTheDocument();
                expect(screen.getByText('loc-001')).toBeInTheDocument();
                expect(screen.getByText('engineer@hospital.com')).toBeInTheDocument();
            });
        });
        it('should show error for empty CSV', async () => {
            const { container } = render(_jsx(BulkActionImport, { onImport: mockOnImport }));
            const file = new File([''], 'empty.csv', { type: 'text/csv' });
            const input = container.querySelector('input[type="file"]');
            fireEvent.change(input, { target: { files: [file] } });
            await waitFor(() => {
                expect(screen.getByText(/no contiene filas válidas/i)).toBeInTheDocument();
            });
        });
    });
    describe('CSV Preview', () => {
        it('should display first 10 rows in preview', async () => {
            const csvWith15Rows = `provider_id,location_id,action_description,assigned_to,due_date
${Array.from({ length: 15 }, (_, i) => `prov-${i},loc-${i},Action ${i},email${i}@test.com,2026-05-${10 + i}`).join('\n')}`;
            const { container } = render(_jsx(BulkActionImport, { onImport: mockOnImport }));
            const file = new File([csvWith15Rows], 'actions.csv', { type: 'text/csv' });
            const input = container.querySelector('input[type="file"]');
            fireEvent.change(input, { target: { files: [file] } });
            await waitFor(() => {
                expect(screen.getByText(/Vista Previa \(15 acciones\)/i)).toBeInTheDocument();
                expect(screen.getByText(/\.\.\. y 5 acciones más/i)).toBeInTheDocument();
            });
        });
        it('should display action count', async () => {
            const { container } = render(_jsx(BulkActionImport, { onImport: mockOnImport }));
            const file = new File([mockCSVContent], 'actions.csv', { type: 'text/csv' });
            const input = container.querySelector('input[type="file"]');
            fireEvent.change(input, { target: { files: [file] } });
            await waitFor(() => {
                expect(screen.getByText(/Vista Previa \(2 acciones\)/i)).toBeInTheDocument();
            });
        });
        it('should display preview table with correct columns', async () => {
            const { container } = render(_jsx(BulkActionImport, { onImport: mockOnImport }));
            const file = new File([mockCSVContent], 'actions.csv', { type: 'text/csv' });
            const input = container.querySelector('input[type="file"]');
            fireEvent.change(input, { target: { files: [file] } });
            await waitFor(() => {
                expect(screen.getByText('Proveedor')).toBeInTheDocument();
                expect(screen.getByText('Ubicación')).toBeInTheDocument();
                expect(screen.getByText('Descripción')).toBeInTheDocument();
                expect(screen.getByText('Asignado a')).toBeInTheDocument();
                expect(screen.getByText('Vencimiento')).toBeInTheDocument();
            });
        });
    });
    describe('Import Functionality', () => {
        it('should call onImport with parsed data', async () => {
            mockOnImport.mockResolvedValue([
                { row_number: 1, status: 'success', message: 'Imported' },
                { row_number: 2, status: 'success', message: 'Imported' },
            ]);
            const { container } = render(_jsx(BulkActionImport, { onImport: mockOnImport }));
            const file = new File([mockCSVContent], 'actions.csv', { type: 'text/csv' });
            const input = container.querySelector('input[type="file"]');
            fireEvent.change(input, { target: { files: [file] } });
            await waitFor(() => {
                expect(screen.getByText(/Vista Previa/i)).toBeInTheDocument();
            });
            const importButton = screen.getByRole('button', { name: /Importar 2 Acciones/i });
            fireEvent.click(importButton);
            await waitFor(() => {
                expect(mockOnImport).toHaveBeenCalled();
            });
        });
        it('should display import results', async () => {
            const results = [
                { row_number: 1, status: 'success', message: 'Imported successfully' },
                { row_number: 2, status: 'success', message: 'Imported successfully' },
            ];
            mockOnImport.mockResolvedValue(results);
            const { container } = render(_jsx(BulkActionImport, { onImport: mockOnImport }));
            const file = new File([mockCSVContent], 'actions.csv', { type: 'text/csv' });
            const input = container.querySelector('input[type="file"]');
            fireEvent.change(input, { target: { files: [file] } });
            await waitFor(() => {
                expect(screen.getByText(/Vista Previa/i)).toBeInTheDocument();
            });
            const importButton = screen.getByRole('button', { name: /Importar 2 Acciones/i });
            fireEvent.click(importButton);
            await waitFor(() => {
                expect(screen.getByText(/Resultados de Importación/i)).toBeInTheDocument();
                expect(screen.getByText('2')).toBeInTheDocument(); // 2 imported
            });
        });
        it('should display error details when import fails', async () => {
            const results = [
                { row_number: 1, status: 'success', message: 'Imported successfully' },
                { row_number: 2, status: 'error', message: 'Invalid email format' },
            ];
            mockOnImport.mockResolvedValue(results);
            const { container } = render(_jsx(BulkActionImport, { onImport: mockOnImport }));
            const file = new File([mockCSVContent], 'actions.csv', { type: 'text/csv' });
            const input = container.querySelector('input[type="file"]');
            fireEvent.change(input, { target: { files: [file] } });
            await waitFor(() => {
                expect(screen.getByText(/Vista Previa/i)).toBeInTheDocument();
            });
            const importButton = screen.getByRole('button', { name: /Importar 2 Acciones/i });
            fireEvent.click(importButton);
            await waitFor(() => {
                expect(screen.getByText(/Invalid email format/i)).toBeInTheDocument();
            });
        });
        it('should show loading state during import', async () => {
            mockOnImport.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve([]), 100)));
            const { container } = render(_jsx(BulkActionImport, { onImport: mockOnImport }));
            const file = new File([mockCSVContent], 'actions.csv', { type: 'text/csv' });
            const input = container.querySelector('input[type="file"]');
            fireEvent.change(input, { target: { files: [file] } });
            await waitFor(() => {
                expect(screen.getByText(/Vista Previa/i)).toBeInTheDocument();
            });
            const importButton = screen.getByRole('button', { name: /Importar 2 Acciones/i });
            fireEvent.click(importButton);
            expect(importButton).toBeDisabled();
            await waitFor(() => {
                expect(importButton).not.toBeDisabled();
            });
        });
    });
    describe('Drag and Drop', () => {
        it('should handle file drop', async () => {
            const { container } = render(_jsx(BulkActionImport, { onImport: mockOnImport }));
            const dropZone = container.querySelector('.csv-upload-zone');
            const file = new File([mockCSVContent], 'actions.csv', { type: 'text/csv' });
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            fireEvent.drop(dropZone, { dataTransfer });
            await waitFor(() => {
                expect(screen.getByText(/Vista Previa/i)).toBeInTheDocument();
            });
        });
        it('should reject non-CSV files on drop', async () => {
            const { container } = render(_jsx(BulkActionImport, { onImport: mockOnImport }));
            const dropZone = container.querySelector('.csv-upload-zone');
            const file = new File(['content'], 'data.xlsx', { type: 'application/vnd.ms-excel' });
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            fireEvent.drop(dropZone, { dataTransfer });
            await waitFor(() => {
                expect(screen.getByText(/Por favor, sube un archivo CSV válido/i)).toBeInTheDocument();
            });
        });
    });
    describe('Template Download', () => {
        it('should download CSV template', () => {
            const createElementSpy = vi.spyOn(document, 'createElement');
            render(_jsx(BulkActionImport, { onImport: mockOnImport }));
            const templateButton = screen.getByRole('button', { name: /Descargar plantilla/i });
            fireEvent.click(templateButton);
            expect(createElementSpy).toHaveBeenCalledWith('a');
            createElementSpy.mockRestore();
        });
    });
    describe('Cancel Functionality', () => {
        it('should reset form when cancel is clicked', async () => {
            const { container } = render(_jsx(BulkActionImport, { onImport: mockOnImport }));
            const file = new File([mockCSVContent], 'actions.csv', { type: 'text/csv' });
            const input = container.querySelector('input[type="file"]');
            fireEvent.change(input, { target: { files: [file] } });
            await waitFor(() => {
                expect(screen.getByText(/Vista Previa/i)).toBeInTheDocument();
            });
            const cancelButton = screen.getByRole('button', { name: /Cancelar/i });
            fireEvent.click(cancelButton);
            await waitFor(() => {
                expect(screen.queryByText(/Vista Previa/i)).not.toBeInTheDocument();
            });
        });
    });
    describe('Close Functionality', () => {
        it('should call onClose button after import', async () => {
            mockOnImport.mockResolvedValue([
                { row_number: 1, status: 'success', message: 'Imported' },
            ]);
            render(_jsx(BulkActionImport, { onImport: mockOnImport, onClose: mockOnClose }));
            const file = new File([mockCSVContent], 'actions.csv', { type: 'text/csv' });
            const { container } = render(_jsx(BulkActionImport, { onImport: mockOnImport, onClose: mockOnClose }));
            const input = container.querySelector('input[type="file"]');
            fireEvent.change(input, { target: { files: [file] } });
            await waitFor(() => {
                expect(screen.getByText(/Vista Previa/i)).toBeInTheDocument();
            });
            const importButton = screen.getByRole('button', { name: /Importar 2 Acciones/i });
            fireEvent.click(importButton);
            await waitFor(() => {
                const closeButton = screen.getByRole('button', { name: /Cerrar/i });
                fireEvent.click(closeButton);
                expect(mockOnClose).toHaveBeenCalled();
            });
        });
    });
    describe('Accessibility', () => {
        it('should have proper file input', () => {
            const { container } = render(_jsx(BulkActionImport, { onImport: mockOnImport }));
            const fileInput = container.querySelector('input[type="file"]');
            expect(fileInput).toHaveAttribute('accept', '.csv');
        });
    });
});
//# sourceMappingURL=BulkActionImport.test.js.map