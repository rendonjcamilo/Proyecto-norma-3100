/**
 * DeleteConfirmationModal Component
 * Modal genérico para confirmar eliminación de evaluaciones
 */

import React from 'react';

interface DeleteConfirmationModalProps {
  title: string;
  message: string;
  itemName: string;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  title,
  message,
  itemName,
  isLoading = false,
  onConfirm,
  onCancel,
}) => {
  return (
    <div className="delete-confirmation-modal-overlay" onClick={onCancel}>
      <div className="delete-confirmation-modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="delete-confirmation-modal-header">
          <div className="delete-confirmation-modal-icon">⚠️</div>
          <h2>{title}</h2>
          <button
            className="delete-confirmation-modal-close"
            onClick={onCancel}
            type="button"
            disabled={isLoading}
          >
            ✕
          </button>
        </div>

        <div className="delete-confirmation-modal-body">
          <p>{message}</p>
          <div className="delete-confirmation-modal-item-name">
            <strong>{itemName}</strong>
          </div>
          <p className="delete-confirmation-modal-warning">
            Esta acción no se puede deshacer.
          </p>
        </div>

        <div className="delete-confirmation-modal-footer">
          <button
            className="btn-dashboard btn-dashboard-secondary"
            onClick={onCancel}
            type="button"
            disabled={isLoading}
          >
            Cancelar
          </button>
          <button
            className="btn-dashboard btn-dashboard-danger"
            onClick={onConfirm}
            type="button"
            disabled={isLoading}
          >
            {isLoading ? 'Eliminando...' : '🗑️ Eliminar'}
          </button>
        </div>
      </div>

      <style>{`
        .delete-confirmation-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .delete-confirmation-modal-dialog {
          background: white;
          border-radius: 8px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
          width: 90%;
          max-width: 450px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .delete-confirmation-modal-header {
          padding: 24px;
          border-bottom: 1px solid #e0e0e0;
          display: flex;
          align-items: flex-start;
          gap: 16px;
          position: relative;
        }

        .delete-confirmation-modal-icon {
          font-size: 28px;
          flex-shrink: 0;
        }

        .delete-confirmation-modal-header h2 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          color: #202124;
          flex: 1;
        }

        .delete-confirmation-modal-close {
          background: none;
          border: none;
          font-size: 20px;
          cursor: pointer;
          color: #5f6368;
          padding: 0;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          transition: background-color 0.2s;
          flex-shrink: 0;
        }

        .delete-confirmation-modal-close:hover:not(:disabled) {
          background-color: #f0f0f0;
        }

        .delete-confirmation-modal-close:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .delete-confirmation-modal-body {
          padding: 24px;
          flex: 1;
        }

        .delete-confirmation-modal-body p {
          margin: 0 0 16px 0;
          color: #5f6368;
          font-size: 14px;
          line-height: 1.5;
        }

        .delete-confirmation-modal-body p:last-of-type {
          margin-bottom: 0;
        }

        .delete-confirmation-modal-item-name {
          padding: 12px 16px;
          background-color: #f8f9fa;
          border-left: 4px solid #de350b;
          border-radius: 4px;
          margin: 16px 0;
          font-size: 13px;
          color: #202124;
          word-break: break-word;
        }

        .delete-confirmation-modal-warning {
          padding: 12px 16px;
          background-color: #fff3e0;
          border: 1px solid #ffe0b2;
          border-radius: 4px;
          color: #e65100;
          font-size: 13px;
          margin: 16px 0 0 0 !important;
        }

        .delete-confirmation-modal-footer {
          padding: 16px 24px;
          border-top: 1px solid #e0e0e0;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 12px;
          background-color: #f8f9fa;
        }

        .btn {
          padding: 8px 24px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s;
        }

        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-secondary {
          background-color: white;
          color: #202124;
          border: 1px solid #dadce0;
        }

        .btn-secondary:hover:not(:disabled) {
          background-color: #f8f9fa;
        }

        .btn-danger {
          background-color: #de350b;
          color: white;
        }

        .btn-danger:hover:not(:disabled) {
          background-color: #c42107;
        }

        .btn-danger:active:not(:disabled) {
          background-color: #a91903;
        }
      `}</style>
    </div>
  );
};

export default DeleteConfirmationModal;
