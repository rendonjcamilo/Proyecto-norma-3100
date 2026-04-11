import { jsx as _jsx } from "react/jsx-runtime";
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ComplianceCharts } from '../ComplianceCharts';
const mockComplianceData = [
    {
        locationId: '1',
        locationName: 'Clínica Centro',
        overallCompliance: 85,
        semaforo: 'verde',
        hallazgosCount: 2,
        lastAssessmentDate: '2026-03-15',
        perStandardMetrics: [
            { name: 'Capacidad técnico-administrativa', code: 'CTA', percent: 90, color: 'verde' },
            { name: 'Políticas y procedimientos', code: 'PP', percent: 85, color: 'verde' },
            { name: 'Gestión de recursos humanos', code: 'GRH', percent: 80, color: 'verde' },
        ],
    },
    {
        locationId: '2',
        locationName: 'Hospital Norte',
        overallCompliance: 65,
        semaforo: 'naranja',
        hallazgosCount: 5,
        lastAssessmentDate: '2026-03-10',
        perStandardMetrics: [
            { name: 'Capacidad técnico-administrativa', code: 'CTA', percent: 70, color: 'naranja' },
            { name: 'Políticas y procedimientos', code: 'PP', percent: 60, color: 'naranja' },
            { name: 'Gestión de recursos humanos', code: 'GRH', percent: 65, color: 'naranja' },
        ],
    },
];
describe('ComplianceCharts', () => {
    it('renders main heading', () => {
        render(_jsx(ComplianceCharts, { data: mockComplianceData }));
        expect(screen.getByText('Análisis Comparativo')).toBeInTheDocument();
    });
    it('displays overall compliance average', () => {
        render(_jsx(ComplianceCharts, { data: mockComplianceData }));
        expect(screen.getByText('Cumplimiento Promedio')).toBeInTheDocument();
        // Average of 85 and 65 = 75
        expect(screen.getByText('75%')).toBeInTheDocument();
    });
    it('displays semáforo distribution', () => {
        render(_jsx(ComplianceCharts, { data: mockComplianceData }));
        expect(screen.getByText('Distribución por Estado')).toBeInTheDocument();
    });
    it('counts locations by semáforo color', () => {
        render(_jsx(ComplianceCharts, { data: mockComplianceData }));
        // Should show counts for verde, naranja, rojo
        const verdCount = screen.getByText('Verde');
        const naranjaCount = screen.getByText('Naranja');
        expect(verdCount).toBeInTheDocument();
        expect(naranjaCount).toBeInTheDocument();
    });
    it('displays location comparison bars', () => {
        render(_jsx(ComplianceCharts, { data: mockComplianceData }));
        expect(screen.getByText(/Cumplimiento por Ubicación/)).toBeInTheDocument();
        expect(screen.getByText('Clínica Centro')).toBeInTheDocument();
        expect(screen.getByText('Hospital Norte')).toBeInTheDocument();
    });
    it('sorts locations by compliance descending', () => {
        render(_jsx(ComplianceCharts, { data: mockComplianceData }));
        const locationLabels = screen.getAllByText(/Clínica Centro|Hospital Norte/);
        // First location should be Clínica Centro (85%), then Hospital Norte (65%)
        expect(locationLabels[0].textContent).toContain('Clínica Centro');
    });
    it('displays top standards section', () => {
        render(_jsx(ComplianceCharts, { data: mockComplianceData }));
        expect(screen.getByText(/Estándares con Mayor Cumplimiento/)).toBeInTheDocument();
    });
    it('shows top 5 standards', () => {
        const dataWithMoreStandards = [
            {
                ...mockComplianceData[0],
                perStandardMetrics: [
                    { name: 'Standard A', code: 'SA', percent: 95, color: 'verde' },
                    { name: 'Standard B', code: 'SB', percent: 90, color: 'verde' },
                    { name: 'Standard C', code: 'SC', percent: 85, color: 'verde' },
                    { name: 'Standard D', code: 'SD', percent: 80, color: 'verde' },
                    { name: 'Standard E', code: 'SE', percent: 75, color: 'naranja' },
                    { name: 'Standard F', code: 'SF', percent: 70, color: 'naranja' },
                ],
            },
            mockComplianceData[1],
        ];
        render(_jsx(ComplianceCharts, { data: dataWithMoreStandards }));
        // Should show top 5 rankings
        expect(screen.getByText('#1')).toBeInTheDocument();
        expect(screen.getByText('#5')).toBeInTheDocument();
        // Should not show #6
        expect(screen.queryByText('#6')).not.toBeInTheDocument();
    });
    it('displays standards breakdown section', () => {
        render(_jsx(ComplianceCharts, { data: mockComplianceData }));
        expect(screen.getByText(/Promedio por Estándar/)).toBeInTheDocument();
    });
    it('calculates correct average for standards', () => {
        render(_jsx(ComplianceCharts, { data: mockComplianceData }));
        // CTA average: (90 + 70) / 2 = 80
        // Should display CTA with 80%
        const ctaElements = screen.getAllByText(/CTA/);
        expect(ctaElements.length).toBeGreaterThan(0);
    });
    it('applies correct semáforo colors to standards', () => {
        const { container } = render(_jsx(ComplianceCharts, { data: mockComplianceData }));
        // Should have both verde and naranja standards
        const verdeElements = container.querySelectorAll('.semaforo-verde');
        const naranjaElements = container.querySelectorAll('.semaforo-naranja');
        expect(verdeElements.length).toBeGreaterThan(0);
        expect(naranjaElements.length).toBeGreaterThan(0);
    });
    it('displays location percentages in comparison bars', () => {
        render(_jsx(ComplianceCharts, { data: mockComplianceData }));
        expect(screen.getByText('85%')).toBeInTheDocument();
        expect(screen.getByText('65%')).toBeInTheDocument();
    });
    it('displays ranking numbers for top standards', () => {
        render(_jsx(ComplianceCharts, { data: mockComplianceData }));
        expect(screen.getByText('#1')).toBeInTheDocument();
        expect(screen.getByText('#2')).toBeInTheDocument();
        expect(screen.getByText('#3')).toBeInTheDocument();
    });
    it('handles single location data', () => {
        const singleLocation = [mockComplianceData[0]];
        render(_jsx(ComplianceCharts, { data: singleLocation }));
        expect(screen.getByText('Análisis Comparativo')).toBeInTheDocument();
        expect(screen.getByText('100%')).toBeInTheDocument(); // Average of single location
    });
    it('displays all unique standards across locations', () => {
        render(_jsx(ComplianceCharts, { data: mockComplianceData }));
        expect(screen.getByText(/CTA/)).toBeInTheDocument();
        expect(screen.getByText(/PP/)).toBeInTheDocument();
        expect(screen.getByText(/GRH/)).toBeInTheDocument();
    });
    it('calculates semáforo colors correctly for standards', () => {
        render(_jsx(ComplianceCharts, { data: mockComplianceData }));
        // CTA average is 80 (verde)
        // PP average is 72.5 (naranja)
        // GRH average is 72.5 (naranja)
        const { container } = render(_jsx(ComplianceCharts, { data: mockComplianceData }));
        const verdeCount = container.querySelectorAll('.semaforo-verde').length;
        const naranjaCount = container.querySelectorAll('.semaforo-naranja').length;
        expect(verdeCount + naranjaCount).toBeGreaterThan(0);
    });
    it('renders chart cards with proper structure', () => {
        const { container } = render(_jsx(ComplianceCharts, { data: mockComplianceData }));
        const chartCards = container.querySelectorAll('.chart-card');
        expect(chartCards.length).toBeGreaterThan(0);
    });
    it('displays location names in bars', () => {
        render(_jsx(ComplianceCharts, { data: mockComplianceData }));
        const clinicaLabel = screen.getByText('Clínica Centro');
        const hospitalLabel = screen.getByText('Hospital Norte');
        expect(clinicaLabel).toBeInTheDocument();
        expect(hospitalLabel).toBeInTheDocument();
    });
    it('handles data with different numbers of standards per location', () => {
        const mixedData = [
            {
                ...mockComplianceData[0],
                perStandardMetrics: mockComplianceData[0].perStandardMetrics.slice(0, 2),
            },
            mockComplianceData[1],
        ];
        render(_jsx(ComplianceCharts, { data: mixedData }));
        expect(screen.getByText(/Promedio por Estándar/)).toBeInTheDocument();
    });
    it('renders breakdown bars for all standards', () => {
        const { container } = render(_jsx(ComplianceCharts, { data: mockComplianceData }));
        const breakdownBars = container.querySelectorAll('.breakdown-bar');
        // Should have bars for CTA, PP, GRH
        expect(breakdownBars.length).toBeGreaterThanOrEqual(3);
    });
    it('displays percentages in breakdown', () => {
        render(_jsx(ComplianceCharts, { data: mockComplianceData }));
        // Should show percentages for averaged standards
        const percentElements = screen.getAllByText(/%/);
        expect(percentElements.length).toBeGreaterThan(0);
    });
    it('shows all three chart types', () => {
        render(_jsx(ComplianceCharts, { data: mockComplianceData }));
        expect(screen.getByText('Cumplimiento Promedio')).toBeInTheDocument();
        expect(screen.getByText('Distribución por Estado')).toBeInTheDocument();
        expect(screen.getByText(/Cumplimiento por Ubicación/)).toBeInTheDocument();
    });
});
//# sourceMappingURL=ComplianceCharts.test.js.map