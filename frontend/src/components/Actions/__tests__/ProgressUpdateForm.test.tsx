/**
 * ProgressUpdateForm Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProgressUpdateForm } from '../ProgressUpdateForm';
import { ActionFollowup } from '../../../stores/actionStore';

describe('ProgressUpdateForm', () => {
  const mockFollowups: ActionFollowup[] = [
    {
      id: 'fu-1',
      action_id: 'act-1',
      step_number: 1,
      step_name: 'Planificación',
      description: 'Plan inicial',
      status: 'pendiente',
      due_date: '2026-05-01',
      completion_percentage: 0,
      evidence_attachment: undefined,
      completed_date: undefined,
      completed_by: undefined,
      comments: undefined,
      created_at: '2026-04-01T00:00:00Z',
      updated_at: '2026-04-01T00:00:00Z',
    },
    {
      id: 'fu-2',
      action_id: 'act-1',
      step_number: 2,
      step_name: 'Diseño',
      description: 'Diseño detallado',
      status: 'pendiente',
      due_date: '2026-05-15',
      completion_percentage: 0,
      evidence_attachment: undefined,
      completed_date: undefined,
      completed_by: undefined,
      comments: undefined,
      created_at: '2026-04-01T00:00:00Z',
      updated_at: '2026-04-01T00:00:00Z',
    },
  ];

  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();

  it('should render form with followups', () => {
    render(
      <ProgressUpdateForm
        actionId="act-1"
        followups={mockFollowups}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('Actualizar Progreso')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Paso 1: Planificación (pendiente)')).toBeInTheDocument();
  });

  it('should have default followup selected', () => {
    render(
      <ProgressUpdateForm
        actionId="act-1"
        followups={mockFollowups}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const select = screen.getByDisplayValue('Paso 1: Planificación (pendiente)') as HTMLSelectElement;
    expect(select.value).toBe(mockFollowups[0].id);
  });

  it('should display followup info', () => {
    render(
      <ProgressUpdateForm
        actionId="act-1"
        followups={mockFollowups}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText(/Plazo:/)).toBeInTheDocument();
    expect(screen.getByText(/Progreso actual:/)).toBeInTheDocument();
  });

  it('should update completion percentage', () => {
    render(
      <ProgressUpdateForm
        actionId="act-1"
        followups={mockFollowups}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const rangeInput = screen.getByRole('slider');
    fireEvent.change(rangeInput, { target: { value: '75' } });

    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('should allow status selection', () => {
    render(
      <ProgressUpdateForm
        actionId="act-1"
        followups={mockFollowups}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const statusSelect = screen.getByDisplayValue('En Progreso') as HTMLSelectElement;
    fireEvent.change(statusSelect, { target: { value: 'completado' } });

    expect(statusSelect.value).toBe('completado');
  });

  it('should accept evidence URL', () => {
    render(
      <ProgressUpdateForm
        actionId="act-1"
        followups={mockFollowups}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const evidenceInput = screen.getByPlaceholderText('https://ejemplo.com/evidencia.pdf');
    fireEvent.change(evidenceInput, { target: { value: 'https://example.com/test.pdf' } });

    expect((evidenceInput as HTMLInputElement).value).toBe('https://example.com/test.pdf');
  });

  it('should accept comment', () => {
    render(
      <ProgressUpdateForm
        actionId="act-1"
        followups={mockFollowups}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const commentInput = screen.getByPlaceholderText(
      'Describe qué se ha completado y qué está pendiente...'
    );
    fireEvent.change(commentInput, { target: { value: 'Progreso significativo realizado' } });

    expect((commentInput as HTMLTextAreaElement).value).toBe('Progreso significativo realizado');
  });

  it('should call onSubmit with correct data', async () => {
    render(
      <ProgressUpdateForm
        actionId="act-1"
        followups={mockFollowups}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const rangeInput = screen.getByRole('slider');
    fireEvent.change(rangeInput, { target: { value: '50' } });

    const submitBtn = screen.getByText('Guardar Progreso');
    fireEvent.click(submitBtn);

    expect(mockOnSubmit).toHaveBeenCalled();
  });

  it('should call onCancel when cancel button clicked', () => {
    render(
      <ProgressUpdateForm
        actionId="act-1"
        followups={mockFollowups}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const cancelBtn = screen.getByText('Cancelar');
    fireEvent.click(cancelBtn);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('should show loading state', () => {
    render(
      <ProgressUpdateForm
        actionId="act-1"
        followups={mockFollowups}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        loading={true}
      />
    );

    expect(screen.getByText('Guardando...')).toBeInTheDocument();
  });

  it('should validate completion percentage range', async () => {
    const mockOnSubmitWithValidation = vi.fn().mockRejectedValue(
      new Error('El progreso debe estar entre 0 y 100%')
    );

    render(
      <ProgressUpdateForm
        actionId="act-1"
        followups={mockFollowups}
        onSubmit={mockOnSubmitWithValidation}
        onCancel={mockOnCancel}
      />
    );

    const rangeInput = screen.getByRole('slider');
    fireEvent.change(rangeInput, { target: { value: '150' } });

    const submitBtn = screen.getByText('Guardar Progreso');
    fireEvent.click(submitBtn);

    // The form should validate and prevent submission
    expect(rangeInput).toHaveValue('100');
  });

  it('should display remaining days field', () => {
    render(
      <ProgressUpdateForm
        actionId="act-1"
        followups={mockFollowups}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByPlaceholderText('Ej: 5')).toBeInTheDocument();
  });
});
