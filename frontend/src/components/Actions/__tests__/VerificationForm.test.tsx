/**
 * VerificationForm Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VerificationForm, VerificationData } from '../VerificationForm';

describe('VerificationForm', () => {
  const mockOnVerify = vi.fn();
  const mockOnCancel = vi.fn();

  const mockEvidence = [
    {
      id: 'ev-1',
      filename: 'report.pdf',
      fileSize: 1024000,
    },
    {
      id: 'ev-2',
      filename: 'screenshot.jpg',
      fileSize: 512000,
    },
  ];

  beforeEach(() => {
    mockOnVerify.mockClear();
    mockOnCancel.mockClear();
  });

  describe('Component Rendering', () => {
    it('should render form with header', () => {
      render(
        <VerificationForm
          actionId="act-1"
          actionTitle="Implementar nuevo sistema"
          actionDescription="Implementar nuevo sistema de backup en servidor principal"
          evidence={mockEvidence}
          onVerify={mockOnVerify}
        />
      );

      expect(screen.getByText('Verificación de Acción Correctiva')).toBeInTheDocument();
    });

    it('should display action summary', () => {
      render(
        <VerificationForm
          actionId="act-1"
          actionTitle="Implementar nuevo sistema"
          actionDescription="Implementar nuevo sistema de backup en servidor principal"
          evidence={mockEvidence}
          onVerify={mockOnVerify}
        />
      );

      expect(screen.getByDisplayValue('Implementar nuevo sistema')).toBeInTheDocument();
      expect(screen.getByText('Implementar nuevo sistema de backup en servidor principal')).toBeInTheDocument();
    });

    it('should display attached evidence', () => {
      render(
        <VerificationForm
          actionId="act-1"
          actionTitle="Test Action"
          actionDescription="Test Description"
          evidence={mockEvidence}
          onVerify={mockOnVerify}
        />
      );

      expect(screen.getByText('report.pdf')).toBeInTheDocument();
      expect(screen.getByText('screenshot.jpg')).toBeInTheDocument();
    });

    it('should show no evidence message when empty', () => {
      render(
        <VerificationForm
          actionId="act-1"
          actionTitle="Test Action"
          actionDescription="Test Description"
          evidence={[]}
          onVerify={mockOnVerify}
        />
      );

      expect(screen.getByText(/Sin evidencia adjunta/i)).toBeInTheDocument();
    });
  });

  describe('Decision Selection', () => {
    it('should render approve and reject options', () => {
      render(
        <VerificationForm
          actionId="act-1"
          actionTitle="Test Action"
          actionDescription="Test Description"
          evidence={mockEvidence}
          onVerify={mockOnVerify}
        />
      );

      expect(screen.getByLabelText(/Aprobado/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Rechazado/i)).toBeInTheDocument();
    });

    it('should allow selecting approved decision', async () => {
      render(
        <VerificationForm
          actionId="act-1"
          actionTitle="Test Action"
          actionDescription="Test Description"
          evidence={mockEvidence}
          onVerify={mockOnVerify}
        />
      );

      const approveRadio = screen.getByLabelText(/Aprobado/i) as HTMLInputElement;
      fireEvent.click(approveRadio);

      expect(approveRadio.checked).toBe(true);
    });

    it('should allow selecting rejected decision', async () => {
      render(
        <VerificationForm
          actionId="act-1"
          actionTitle="Test Action"
          actionDescription="Test Description"
          evidence={mockEvidence}
          onVerify={mockOnVerify}
        />
      );

      const rejectRadio = screen.getByLabelText(/Rechazado/i) as HTMLInputElement;
      fireEvent.click(rejectRadio);

      expect(rejectRadio.checked).toBe(true);
    });

    it('should show decision descriptions', () => {
      render(
        <VerificationForm
          actionId="act-1"
          actionTitle="Test Action"
          actionDescription="Test Description"
          evidence={mockEvidence}
          onVerify={mockOnVerify}
        />
      );

      expect(screen.getByText(/acción ha cumplido con los requisitos/i)).toBeInTheDocument();
      expect(screen.getByText(/acción no cumple con los requisitos/i)).toBeInTheDocument();
    });
  });

  describe('Comments Validation', () => {
    it('should require comments', async () => {
      render(
        <VerificationForm
          actionId="act-1"
          actionTitle="Test Action"
          actionDescription="Test Description"
          evidence={mockEvidence}
          onVerify={mockOnVerify}
        />
      );

      const approveRadio = screen.getByLabelText(/Aprobado/i);
      fireEvent.click(approveRadio);

      const submitButton = screen.getByRole('button', { name: /Enviar Verificación/i });
      fireEvent.click(submitButton);

      expect(mockOnVerify).not.toHaveBeenCalled();
      expect(screen.getByText(/Comentarios requeridos/i)).toBeInTheDocument();
    });

    it('should enforce minimum comment length', async () => {
      render(
        <VerificationForm
          actionId="act-1"
          actionTitle="Test Action"
          actionDescription="Test Description"
          evidence={mockEvidence}
          onVerify={mockOnVerify}
        />
      );

      const approveRadio = screen.getByLabelText(/Aprobado/i);
      fireEvent.click(approveRadio);

      const commentsField = screen.getByPlaceholderText(/Comentarios/i);
      fireEvent.change(commentsField, { target: { value: 'OK' } });

      const submitButton = screen.getByRole('button', { name: /Enviar Verificación/i });
      fireEvent.click(submitButton);

      expect(mockOnVerify).not.toHaveBeenCalled();
      expect(screen.getByText(/mínimo 10 caracteres/i)).toBeInTheDocument();
    });

    it('should accept valid comments', async () => {
      mockOnVerify.mockResolvedValue(undefined);

      render(
        <VerificationForm
          actionId="act-1"
          actionTitle="Test Action"
          actionDescription="Test Description"
          evidence={mockEvidence}
          onVerify={mockOnVerify}
        />
      );

      const approveRadio = screen.getByLabelText(/Aprobado/i);
      fireEvent.click(approveRadio);

      const commentsField = screen.getByPlaceholderText(/Comentarios/i);
      fireEvent.change(commentsField, { target: { value: 'La acción ha sido completada correctamente' } });

      const submitButton = screen.getByRole('button', { name: /Enviar Verificación/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnVerify).toHaveBeenCalled();
      });
    });

    it('should enforce maximum comment length', async () => {
      render(
        <VerificationForm
          actionId="act-1"
          actionTitle="Test Action"
          actionDescription="Test Description"
          evidence={mockEvidence}
          onVerify={mockOnVerify}
        />
      );

      const commentsField = screen.getByPlaceholderText(/Comentarios/i) as HTMLTextAreaElement;
      const longText = 'a'.repeat(201);

      fireEvent.change(commentsField, { target: { value: longText } });

      expect(commentsField.value.length).toBeLessThanOrEqual(200);
    });
  });

  describe('Form Submission', () => {
    it('should call onVerify with correct data for approval', async () => {
      mockOnVerify.mockResolvedValue(undefined);

      render(
        <VerificationForm
          actionId="act-1"
          actionTitle="Test Action"
          actionDescription="Test Description"
          evidence={mockEvidence}
          onVerify={mockOnVerify}
        />
      );

      const approveRadio = screen.getByLabelText(/Aprobado/i);
      fireEvent.click(approveRadio);

      const commentsField = screen.getByPlaceholderText(/Comentarios/i);
      fireEvent.change(commentsField, { target: { value: 'Acción aprobada, cumple con requisitos' } });

      const submitButton = screen.getByRole('button', { name: /Enviar Verificación/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnVerify).toHaveBeenCalledWith({
          actionId: 'act-1',
          decision: 'approved',
          comments: 'Acción aprobada, cumple con requisitos',
        });
      });
    });

    it('should call onVerify with correct data for rejection', async () => {
      mockOnVerify.mockResolvedValue(undefined);

      render(
        <VerificationForm
          actionId="act-1"
          actionTitle="Test Action"
          actionDescription="Test Description"
          evidence={mockEvidence}
          onVerify={mockOnVerify}
        />
      );

      const rejectRadio = screen.getByLabelText(/Rechazado/i);
      fireEvent.click(rejectRadio);

      const commentsField = screen.getByPlaceholderText(/Comentarios/i);
      fireEvent.change(commentsField, { target: { value: 'Falta completar algunos pasos de la acción' } });

      const submitButton = screen.getByRole('button', { name: /Enviar Verificación/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnVerify).toHaveBeenCalledWith({
          actionId: 'act-1',
          decision: 'rejected',
          comments: 'Falta completar algunos pasos de la acción',
        });
      });
    });

    it('should handle verification errors', async () => {
      mockOnVerify.mockRejectedValue(new Error('Verification failed'));

      render(
        <VerificationForm
          actionId="act-1"
          actionTitle="Test Action"
          actionDescription="Test Description"
          evidence={mockEvidence}
          onVerify={mockOnVerify}
        />
      );

      const approveRadio = screen.getByLabelText(/Aprobado/i);
      fireEvent.click(approveRadio);

      const commentsField = screen.getByPlaceholderText(/Comentarios/i);
      fireEvent.change(commentsField, { target: { value: 'Verificación completada' } });

      const submitButton = screen.getByRole('button', { name: /Enviar Verificación/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Error/i)).toBeInTheDocument();
      });
    });

    it('should show loading state during submission', async () => {
      mockOnVerify.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );

      render(
        <VerificationForm
          actionId="act-1"
          actionTitle="Test Action"
          actionDescription="Test Description"
          evidence={mockEvidence}
          onVerify={mockOnVerify}
        />
      );

      const approveRadio = screen.getByLabelText(/Aprobado/i);
      fireEvent.click(approveRadio);

      const commentsField = screen.getByPlaceholderText(/Comentarios/i);
      fireEvent.change(commentsField, { target: { value: 'Verificación completada' } });

      const submitButton = screen.getByRole('button', { name: /Enviar Verificación/i });
      fireEvent.click(submitButton);

      expect(submitButton).toBeDisabled();

      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
    });
  });

  describe('Form Cancellation', () => {
    it('should call onCancel when cancel button is clicked', () => {
      render(
        <VerificationForm
          actionId="act-1"
          actionTitle="Test Action"
          actionDescription="Test Description"
          evidence={mockEvidence}
          onVerify={mockOnVerify}
          onCancel={mockOnCancel}
        />
      );

      const cancelButton = screen.getByRole('button', { name: /Cancelar/i });
      fireEvent.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper form structure', () => {
      const { container } = render(
        <VerificationForm
          actionId="act-1"
          actionTitle="Test Action"
          actionDescription="Test Description"
          evidence={mockEvidence}
          onVerify={mockOnVerify}
        />
      );

      expect(container.querySelector('form')).toBeInTheDocument();
    });

    it('should have ARIA labels for form fields', () => {
      render(
        <VerificationForm
          actionId="act-1"
          actionTitle="Test Action"
          actionDescription="Test Description"
          evidence={mockEvidence}
          onVerify={mockOnVerify}
        />
      );

      expect(screen.getByLabelText(/Comentarios/i)).toBeInTheDocument();
    });
  });
});
