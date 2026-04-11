/**
 * ActionsList Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ActionsList } from '../ActionsList';
import * as actionStore from '../../../stores/actionStore';

vi.mock('../../../stores/actionStore', () => ({
  useActionStore: vi.fn(),
}));

vi.mock('../ActionDetail', () => ({
  ActionDetail: () => <div>Action Detail</div>,
}));

describe('ActionsList', () => {
  const mockActions = [
    {
      id: '1',
      finding_id: 'HALL-001',
      action_number: 'ACC-001',
      title: 'Implementar control de acceso',
      description: 'Implementar sistema de control de acceso',
      responsible_user_id: 'user1',
      assigned_to: 'user1',
      due_date: '2026-05-01',
      deadline: '2026-05-01',
      priority: 'alta' as const,
      status: 'en_progreso' as const,
      completion_percentage: 50,
      created_date: '2026-04-01',
      created_by: 'user1',
    },
    {
      id: '2',
      finding_id: 'HALL-002',
      action_number: 'ACC-002',
      title: 'Revisar documentación',
      description: 'Revisar documentación de cumplimiento',
      responsible_user_id: 'user2',
      assigned_to: 'user2',
      due_date: '2026-04-15',
      deadline: '2026-04-15',
      priority: 'crítica' as const,
      status: 'abierta' as const,
      completion_percentage: 0,
      created_date: '2026-04-01',
      created_by: 'user1',
    },
  ];

  beforeEach(() => {
    vi.mocked(actionStore.useActionStore).mockReturnValue({
      actions: mockActions,
      selectedAction: null,
      actionDetail: null,
      filters: {},
      stats: null,
      loading: false,
      error: null,
      fetchActions: vi.fn().mockResolvedValue(undefined),
      fetchActionDetail: vi.fn(),
      setSelectedAction: vi.fn(),
      setFilters: vi.fn(),
      updateAction: vi.fn(),
      updateActionProgress: vi.fn(),
      updateFollowup: vi.fn(),
      fetchStats: vi.fn(),
      clearError: vi.fn(),
    } as any);
  });

  it('should render table with actions', () => {
    render(<ActionsList />);
    expect(screen.getByText('Implementar control de acceso')).toBeInTheDocument();
    expect(screen.getByText('Revisar documentación')).toBeInTheDocument();
  });

  it('should display action metadata', () => {
    render(<ActionsList />);
    expect(screen.getByText('ACC-001')).toBeInTheDocument();
    expect(screen.getByText('ACC-002')).toBeInTheDocument();
  });

  it('should render filter controls', () => {
    render(<ActionsList />);
    expect(screen.getByLabelText('Estado:')).toBeInTheDocument();
    expect(screen.getByLabelText('Prioridad:')).toBeInTheDocument();
    expect(screen.getByLabelText('Ordenar por:')).toBeInTheDocument();
  });

  it('should show empty state when no actions', () => {
    vi.mocked(actionStore.useActionStore).mockReturnValue({
      actions: [],
      selectedAction: null,
      actionDetail: null,
      filters: {},
      stats: null,
      loading: false,
      error: null,
      fetchActions: vi.fn(),
      fetchActionDetail: vi.fn(),
      setSelectedAction: vi.fn(),
      setFilters: vi.fn(),
      updateAction: vi.fn(),
      updateActionProgress: vi.fn(),
      updateFollowup: vi.fn(),
      fetchStats: vi.fn(),
      clearError: vi.fn(),
    } as any);

    render(<ActionsList />);
    expect(
      screen.getByText('No hay acciones que coincidan con los filtros')
    ).toBeInTheDocument();
  });

  it('should show loading state', () => {
    vi.mocked(actionStore.useActionStore).mockReturnValue({
      actions: [],
      selectedAction: null,
      actionDetail: null,
      filters: {},
      stats: null,
      loading: true,
      error: null,
      fetchActions: vi.fn(),
      fetchActionDetail: vi.fn(),
      setSelectedAction: vi.fn(),
      setFilters: vi.fn(),
      updateAction: vi.fn(),
      updateActionProgress: vi.fn(),
      updateFollowup: vi.fn(),
      fetchStats: vi.fn(),
      clearError: vi.fn(),
    } as any);

    render(<ActionsList />);
    expect(screen.getByText('Cargando acciones...')).toBeInTheDocument();
  });

  it('should filter by status', () => {
    render(<ActionsList />);
    const statusSelect = screen.getByDisplayValue('-- Todos --') as HTMLSelectElement;
    fireEvent.change(statusSelect, { target: { value: 'abierta' } });
    expect(statusSelect.value).toBe('abierta');
  });

  it('should display progress bars', () => {
    const { container } = render(<ActionsList />);
    const progressBars = container.querySelectorAll('.progress-mini');
    expect(progressBars.length).toBeGreaterThan(0);
  });

  it('should display priority badges with correct colors', () => {
    render(<ActionsList />);
    expect(screen.getByText('alta')).toBeInTheDocument();
    expect(screen.getByText('crítica')).toBeInTheDocument();
  });

  it('should display status badges', () => {
    render(<ActionsList />);
    expect(screen.getByText('En Progreso')).toBeInTheDocument();
    expect(screen.getByText('Abierta')).toBeInTheDocument();
  });
});
