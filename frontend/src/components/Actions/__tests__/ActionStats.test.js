import { jsx as _jsx } from "react/jsx-runtime";
/**
 * ActionStats Component Tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ActionStats } from '../ActionStats';
import * as actionStore from '../../../stores/actionStore';
vi.mock('../../../stores/actionStore', () => ({
    useActionStore: vi.fn(),
}));
describe('ActionStats', () => {
    const mockStats = {
        total_actions: 100,
        open_actions: 40,
        in_progress: 35,
        closed_actions: 25,
        overdue_actions: 12,
        avg_completion: 65,
        latest_deadline: '2026-04-30',
    };
    beforeEach(() => {
        vi.mocked(actionStore.useActionStore).mockReturnValue({
            stats: mockStats,
            fetchStats: vi.fn().mockResolvedValue(undefined),
            loading: false,
            actions: [],
            selectedAction: null,
            actionDetail: null,
            filters: {},
            error: null,
            setSelectedAction: vi.fn(),
            setFilters: vi.fn(),
            fetchActions: vi.fn(),
            fetchActionDetail: vi.fn(),
            updateAction: vi.fn(),
            updateActionProgress: vi.fn(),
            updateFollowup: vi.fn(),
            clearError: vi.fn(),
        });
    });
    it('should render stat cards', () => {
        render(_jsx(ActionStats, {}));
        expect(screen.getByText('Total de Acciones')).toBeInTheDocument();
        expect(screen.getByText('Abierta')).toBeInTheDocument();
        expect(screen.getByText('En Progreso')).toBeInTheDocument();
        expect(screen.getByText('Cerrada')).toBeInTheDocument();
    });
    it('should display correct stats values', () => {
        render(_jsx(ActionStats, {}));
        expect(screen.getByText('100')).toBeInTheDocument();
        expect(screen.getByText('40')).toBeInTheDocument();
        expect(screen.getByText('35')).toBeInTheDocument();
        expect(screen.getByText('25')).toBeInTheDocument();
        expect(screen.getByText('12')).toBeInTheDocument();
    });
    it('should display average completion percentage', () => {
        render(_jsx(ActionStats, {}));
        expect(screen.getByText('65%')).toBeInTheDocument();
    });
    it('should show loading state', () => {
        vi.mocked(actionStore.useActionStore).mockReturnValue({
            stats: null,
            fetchStats: vi.fn(),
            loading: true,
            actions: [],
            selectedAction: null,
            actionDetail: null,
            filters: {},
            error: null,
            setSelectedAction: vi.fn(),
            setFilters: vi.fn(),
            fetchActions: vi.fn(),
            fetchActionDetail: vi.fn(),
            updateAction: vi.fn(),
            updateActionProgress: vi.fn(),
            updateFollowup: vi.fn(),
            clearError: vi.fn(),
        });
        render(_jsx(ActionStats, {}));
        expect(screen.getByText('Cargando...')).toBeInTheDocument();
    });
    it('should call fetchStats on mount', () => {
        const mockFetchStats = vi.fn();
        vi.mocked(actionStore.useActionStore).mockReturnValue({
            stats: mockStats,
            fetchStats: mockFetchStats,
            loading: false,
            actions: [],
            selectedAction: null,
            actionDetail: null,
            filters: {},
            error: null,
            setSelectedAction: vi.fn(),
            setFilters: vi.fn(),
            fetchActions: vi.fn(),
            fetchActionDetail: vi.fn(),
            updateAction: vi.fn(),
            updateActionProgress: vi.fn(),
            updateFollowup: vi.fn(),
            clearError: vi.fn(),
        });
        render(_jsx(ActionStats, {}));
        expect(mockFetchStats).toHaveBeenCalled();
    });
    it('should calculate overdue percentage correctly', () => {
        render(_jsx(ActionStats, {}));
        const overduePercent = Math.round((12 / 100) * 100);
        expect(screen.getByText(`${overduePercent}% del total`)).toBeInTheDocument();
    });
});
//# sourceMappingURL=ActionStats.test.js.map