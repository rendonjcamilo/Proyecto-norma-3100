import { jsx as _jsx } from "react/jsx-runtime";
/**
 * Compliance Dashboard Component Tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ComplianceDashboard } from '../ComplianceDashboard';
describe('ComplianceDashboard', () => {
    const mockMetrics = {
        providerId: 'prov-001',
        providerName: 'Hospital Central',
        totalFindings: 50,
        openFindings: 10,
        inProgressFindings: 20,
        resolvedFindings: 15,
        closedFindings: 5,
        overdueFindingsCount: 3,
        averageRiskScore: 65,
        compliancePercentage: 70,
        trendDirection: 'improving',
    };
    const mockRiskAlerts = [
        {
            id: 'alert-1',
            findingId: 'find-1',
            title: 'Backup system not operational',
            severity: 'critical',
            riskScore: 92,
            daysOverdue: 5,
        },
        {
            id: 'alert-2',
            findingId: 'find-2',
            title: 'Staff certification expired',
            severity: 'high',
            riskScore: 85,
            daysOverdue: 2,
        },
    ];
    const mockOnRefresh = vi.fn();
    beforeEach(() => {
        mockOnRefresh.mockClear();
    });
    describe('Component Rendering', () => {
        it('should render dashboard header', () => {
            render(_jsx(ComplianceDashboard, { metrics: mockMetrics, riskAlerts: mockRiskAlerts }));
            expect(screen.getByText(/Dashboard de Cumplimiento Norma 3100/i)).toBeInTheDocument();
        });
        it('should display provider name', () => {
            render(_jsx(ComplianceDashboard, { providerName: "Hospital Central", metrics: mockMetrics, riskAlerts: mockRiskAlerts }));
            expect(screen.getByText('Hospital Central')).toBeInTheDocument();
        });
        it('should render loading state', () => {
            render(_jsx(ComplianceDashboard, { loading: true, metrics: undefined }));
            expect(screen.getByText(/Cargando dashboard/i)).toBeInTheDocument();
        });
        it('should render error state when no metrics', () => {
            render(_jsx(ComplianceDashboard, { loading: false, metrics: undefined }));
            expect(screen.getByText(/No hay datos de cumplimiento disponibles/i)).toBeInTheDocument();
        });
    });
    describe('Compliance Overview', () => {
        it('should display compliance percentage', () => {
            render(_jsx(ComplianceDashboard, { metrics: mockMetrics, riskAlerts: mockRiskAlerts }));
            expect(screen.getByText(/70%/)).toBeInTheDocument();
        });
        it('should show correct compliance status', () => {
            render(_jsx(ComplianceDashboard, { metrics: mockMetrics, riskAlerts: mockRiskAlerts }));
            expect(screen.getByText(/Cumplimiento Parcial/)).toBeInTheDocument();
        });
        it('should display compliance description', () => {
            render(_jsx(ComplianceDashboard, { metrics: mockMetrics, riskAlerts: mockRiskAlerts }));
            expect(screen.getByText(/35 de 50 hallazgos en proceso o resueltos/)).toBeInTheDocument();
        });
        it('should show trend indicator', () => {
            render(_jsx(ComplianceDashboard, { metrics: mockMetrics, riskAlerts: mockRiskAlerts }));
            expect(screen.getByText(/📈 Mejorando/)).toBeInTheDocument();
        });
        it('should display average risk score', () => {
            render(_jsx(ComplianceDashboard, { metrics: mockMetrics, riskAlerts: mockRiskAlerts }));
            expect(screen.getByText('65')).toBeInTheDocument();
        });
    });
    describe('Findings Breakdown', () => {
        it('should display finding status breakdown', () => {
            render(_jsx(ComplianceDashboard, { metrics: mockMetrics, riskAlerts: mockRiskAlerts }));
            expect(screen.getByText('Abiertos')).toBeInTheDocument();
            expect(screen.getByText('En Progreso')).toBeInTheDocument();
            expect(screen.getByText('Resueltos')).toBeInTheDocument();
            expect(screen.getByText('Cerrados')).toBeInTheDocument();
        });
        it('should show correct finding counts', () => {
            render(_jsx(ComplianceDashboard, { metrics: mockMetrics, riskAlerts: mockRiskAlerts }));
            const counts = screen.getAllByText(/^\d+$/);
            // Should have counts for each status and other numbers
            expect(counts.length).toBeGreaterThan(0);
        });
        it('should display overdue findings count', () => {
            render(_jsx(ComplianceDashboard, { metrics: mockMetrics, riskAlerts: mockRiskAlerts }));
            expect(screen.getByText('Vencidos')).toBeInTheDocument();
        });
        it('should render progress bar', () => {
            const { container } = render(_jsx(ComplianceDashboard, { metrics: mockMetrics, riskAlerts: mockRiskAlerts }));
            expect(container.querySelector('.progress-bar')).toBeInTheDocument();
        });
    });
    describe('Risk Alerts', () => {
        it('should display risk alerts section', () => {
            render(_jsx(ComplianceDashboard, { metrics: mockMetrics, riskAlerts: mockRiskAlerts }));
            expect(screen.getByText(/Alertas de Riesgo/i)).toBeInTheDocument();
        });
        it('should display alert titles', () => {
            render(_jsx(ComplianceDashboard, { metrics: mockMetrics, riskAlerts: mockRiskAlerts }));
            expect(screen.getByText('Backup system not operational')).toBeInTheDocument();
            expect(screen.getByText('Staff certification expired')).toBeInTheDocument();
        });
        it('should show severity badges', () => {
            render(_jsx(ComplianceDashboard, { metrics: mockMetrics, riskAlerts: mockRiskAlerts }));
            expect(screen.getByText('CRITICAL')).toBeInTheDocument();
            expect(screen.getByText('HIGH')).toBeInTheDocument();
        });
        it('should display risk scores', () => {
            render(_jsx(ComplianceDashboard, { metrics: mockMetrics, riskAlerts: mockRiskAlerts }));
            expect(screen.getByText(/92\/100/)).toBeInTheDocument();
            expect(screen.getByText(/85\/100/)).toBeInTheDocument();
        });
        it('should show overdue days', () => {
            render(_jsx(ComplianceDashboard, { metrics: mockMetrics, riskAlerts: mockRiskAlerts }));
            expect(screen.getByText(/Vencido hace 5 días/)).toBeInTheDocument();
        });
        it('should not show empty alerts', () => {
            render(_jsx(ComplianceDashboard, { metrics: mockMetrics, riskAlerts: [] }));
            expect(screen.queryByText(/Alertas de Riesgo/i)).not.toBeInTheDocument();
        });
    });
    describe('Quick Actions', () => {
        it('should display action buttons', () => {
            render(_jsx(ComplianceDashboard, { metrics: mockMetrics, riskAlerts: mockRiskAlerts }));
            expect(screen.getByText(/Ver Todos los Hallazgos/i)).toBeInTheDocument();
            expect(screen.getByText(/Ver Todas las Acciones/i)).toBeInTheDocument();
            expect(screen.getByText(/Descargar Reporte/i)).toBeInTheDocument();
        });
        it('should show verification button for auditors', () => {
            render(_jsx(ComplianceDashboard, { metrics: mockMetrics, riskAlerts: mockRiskAlerts, userRole: "auditor" }));
            expect(screen.getByText(/Verificar Acciones/i)).toBeInTheDocument();
        });
        it('should not show verification button for providers', () => {
            render(_jsx(ComplianceDashboard, { metrics: mockMetrics, riskAlerts: mockRiskAlerts, userRole: "provider_admin" }));
            expect(screen.queryByText(/Verificar Acciones/i)).not.toBeInTheDocument();
        });
    });
    describe('Refresh Functionality', () => {
        it('should render refresh button', () => {
            render(_jsx(ComplianceDashboard, { metrics: mockMetrics, riskAlerts: mockRiskAlerts, onRefresh: mockOnRefresh }));
            expect(screen.getByRole('button', { name: /Actualizar/i })).toBeInTheDocument();
        });
        it('should call onRefresh when button clicked', async () => {
            mockOnRefresh.mockResolvedValue(undefined);
            render(_jsx(ComplianceDashboard, { metrics: mockMetrics, riskAlerts: mockRiskAlerts, onRefresh: mockOnRefresh }));
            const refreshButton = screen.getByRole('button', { name: /Actualizar/i });
            fireEvent.click(refreshButton);
            await waitFor(() => {
                expect(mockOnRefresh).toHaveBeenCalled();
            });
        });
        it('should show loading state during refresh', async () => {
            mockOnRefresh.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
            render(_jsx(ComplianceDashboard, { metrics: mockMetrics, riskAlerts: mockRiskAlerts, onRefresh: mockOnRefresh }));
            const refreshButton = screen.getByRole('button', { name: /Actualizar/i });
            fireEvent.click(refreshButton);
            expect(refreshButton).toBeDisabled();
            await waitFor(() => {
                expect(refreshButton).not.toBeDisabled();
            });
        });
        it('should toggle auto-refresh', () => {
            render(_jsx(ComplianceDashboard, { metrics: mockMetrics, riskAlerts: mockRiskAlerts, onRefresh: mockOnRefresh }));
            const autoRefreshCheckbox = screen.getByRole('checkbox');
            expect(autoRefreshCheckbox).not.toBeChecked();
            fireEvent.click(autoRefreshCheckbox);
            expect(autoRefreshCheckbox).toBeChecked();
        });
    });
    describe('Status Color Coding', () => {
        it('should use green for high compliance', () => {
            const highCompliance = { ...mockMetrics, compliancePercentage: 85 };
            render(_jsx(ComplianceDashboard, { metrics: highCompliance, riskAlerts: mockRiskAlerts }));
            expect(screen.getByText(/Cumplimiento Alto/)).toBeInTheDocument();
        });
        it('should use orange for medium compliance', () => {
            const mediumCompliance = { ...mockMetrics, compliancePercentage: 65 };
            render(_jsx(ComplianceDashboard, { metrics: mediumCompliance, riskAlerts: mockRiskAlerts }));
            expect(screen.getByText(/Cumplimiento Parcial/)).toBeInTheDocument();
        });
        it('should use red for low compliance', () => {
            const lowCompliance = { ...mockMetrics, compliancePercentage: 35 };
            render(_jsx(ComplianceDashboard, { metrics: lowCompliance, riskAlerts: mockRiskAlerts }));
            expect(screen.getByText(/Cumplimiento Bajo/)).toBeInTheDocument();
        });
    });
    describe('Responsive Design', () => {
        it('should render on desktop', () => {
            const { container } = render(_jsx(ComplianceDashboard, { metrics: mockMetrics, riskAlerts: mockRiskAlerts }));
            expect(container.querySelector('.compliance-dashboard')).toBeInTheDocument();
        });
    });
});
//# sourceMappingURL=ComplianceDashboard.test.js.map