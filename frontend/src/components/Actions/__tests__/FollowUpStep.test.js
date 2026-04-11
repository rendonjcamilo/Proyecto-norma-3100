import { jsx as _jsx } from "react/jsx-runtime";
/**
 * FollowUpStep Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FollowUpStep } from '../FollowUpStep';
describe('FollowUpStep', () => {
    const mockFollowup = {
        id: 'fu-1',
        action_id: 'act-1',
        step_number: 1,
        step_name: 'Planificación',
        description: 'Planificar la implementación del control',
        status: 'en_progreso',
        due_date: '2026-05-01',
        completion_percentage: 50,
        evidence_attachment: 'https://example.com/evidence.pdf',
        completed_date: undefined,
        completed_by: undefined,
        comments: 'Se ha iniciado la planificación',
        created_at: '2026-04-01T00:00:00Z',
        updated_at: '2026-04-05T00:00:00Z',
    };
    it('should render followup step', () => {
        render(_jsx(FollowUpStep, { followup: mockFollowup }));
        expect(screen.getByText('Planificación')).toBeInTheDocument();
    });
    it('should display step number', () => {
        render(_jsx(FollowUpStep, { followup: mockFollowup }));
        expect(screen.getByText('Paso 1')).toBeInTheDocument();
    });
    it('should display description', () => {
        render(_jsx(FollowUpStep, { followup: mockFollowup }));
        expect(screen.getByText('Planificar la implementación del control')).toBeInTheDocument();
    });
    it('should display due date', () => {
        render(_jsx(FollowUpStep, { followup: mockFollowup }));
        expect(screen.getByText(/2026-05-01/)).toBeInTheDocument();
    });
    it('should display progress percentage', () => {
        render(_jsx(FollowUpStep, { followup: mockFollowup }));
        expect(screen.getByText('50%')).toBeInTheDocument();
    });
    it('should display evidence link when present', () => {
        render(_jsx(FollowUpStep, { followup: mockFollowup }));
        expect(screen.getByText('📎 Ver evidencia')).toBeInTheDocument();
    });
    it('should display comments when present', () => {
        render(_jsx(FollowUpStep, { followup: mockFollowup }));
        expect(screen.getByText('Se ha iniciado la planificación')).toBeInTheDocument();
    });
    it('should allow status change when not readonly', () => {
        const mockOnUpdateStatus = vi.fn();
        render(_jsx(FollowUpStep, { followup: mockFollowup, onUpdateStatus: mockOnUpdateStatus, readonly: false }));
        const statusSelect = screen.getByDisplayValue('En Progreso');
        fireEvent.change(statusSelect, { target: { value: 'completado' } });
        expect(mockOnUpdateStatus).toHaveBeenCalledWith(mockFollowup.id, 'completado');
    });
    it('should show readonly status badge when readonly', () => {
        render(_jsx(FollowUpStep, { followup: mockFollowup, readonly: true }));
        expect(screen.getByText('En Progreso')).toBeInTheDocument();
    });
    it('should toggle comment form', () => {
        render(_jsx(FollowUpStep, { followup: mockFollowup, readonly: false }));
        const toggleBtn = screen.getByText('+ Agregar Comentario/Evidencia');
        fireEvent.click(toggleBtn);
        expect(screen.getByText('✕ Cerrar')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Describe el progreso realizado...')).toBeInTheDocument();
    });
    it('should calculate days until due', () => {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 5);
        const followupWithFutureDate = {
            ...mockFollowup,
            due_date: futureDate.toISOString(),
        };
        render(_jsx(FollowUpStep, { followup: followupWithFutureDate }));
        expect(screen.getByText(/\(5 días\)/)).toBeInTheDocument();
    });
    it('should show overdue indicator', () => {
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - 3);
        const overdueFollowup = {
            ...mockFollowup,
            due_date: pastDate.toISOString(),
        };
        const { container } = render(_jsx(FollowUpStep, { followup: overdueFollowup }));
        const overdueElement = container.querySelector('.overdue');
        expect(overdueElement).toBeInTheDocument();
    });
    it('should display completed status styling', () => {
        const completedFollowup = {
            ...mockFollowup,
            status: 'completado',
            completion_percentage: 100,
        };
        const { container } = render(_jsx(FollowUpStep, { followup: completedFollowup }));
        expect(container.querySelector('.status-success')).toBeInTheDocument();
    });
    it('should display pending status styling', () => {
        const pendingFollowup = {
            ...mockFollowup,
            status: 'pendiente',
            completion_percentage: 0,
        };
        const { container } = render(_jsx(FollowUpStep, { followup: pendingFollowup }));
        expect(container.querySelector('.status-pending')).toBeInTheDocument();
    });
});
//# sourceMappingURL=FollowUpStep.test.js.map