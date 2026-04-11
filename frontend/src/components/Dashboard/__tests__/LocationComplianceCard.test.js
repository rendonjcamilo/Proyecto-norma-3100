import { jsx as _jsx } from "react/jsx-runtime";
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { LocationComplianceCard } from '../LocationComplianceCard';
const mockCompliance = {
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
};
describe('LocationComplianceCard', () => {
    it('renders location name', () => {
        render(_jsx(LocationComplianceCard, { compliance: mockCompliance }));
        expect(screen.getByText('Clínica Centro')).toBeInTheDocument();
    });
    it('displays compliance percentage', () => {
        render(_jsx(LocationComplianceCard, { compliance: mockCompliance }));
        expect(screen.getByText('85%')).toBeInTheDocument();
    });
    it('displays semáforo label for verde', () => {
        render(_jsx(LocationComplianceCard, { compliance: mockCompliance }));
        expect(screen.getByText('Verde - Cumple')).toBeInTheDocument();
    });
    it('displays semáforo description', () => {
        render(_jsx(LocationComplianceCard, { compliance: mockCompliance }));
        expect(screen.getByText('Cumplimiento ≥ 80%')).toBeInTheDocument();
    });
    it('displays hallazgos count', () => {
        render(_jsx(LocationComplianceCard, { compliance: mockCompliance }));
        expect(screen.getByText(/2 incumplimiento/)).toBeInTheDocument();
    });
    it('hides hallazgos count when zero', () => {
        const complianceNoHallazgos = { ...mockCompliance, hallazgosCount: 0 };
        render(_jsx(LocationComplianceCard, { compliance: complianceNoHallazgos }));
        expect(screen.queryByText(/incumplimiento/)).not.toBeInTheDocument();
    });
    it('displays top 3 standards', () => {
        render(_jsx(LocationComplianceCard, { compliance: mockCompliance }));
        expect(screen.getByText('CTA')).toBeInTheDocument();
        expect(screen.getByText('PP')).toBeInTheDocument();
        expect(screen.getByText('GRH')).toBeInTheDocument();
    });
    it('sorts standards by percentage descending', () => {
        const complianceUnsorted = {
            ...mockCompliance,
            perStandardMetrics: [
                { name: 'A', code: 'A', percent: 50, color: 'naranja' },
                { name: 'B', code: 'B', percent: 90, color: 'verde' },
                { name: 'C', code: 'C', percent: 70, color: 'naranja' },
            ],
        };
        render(_jsx(LocationComplianceCard, { compliance: complianceUnsorted }));
        const card = screen.getByText('Clínica Centro').closest('.location-compliance-card');
        const standards = card?.querySelectorAll('.standard-code');
        expect(standards?.[0].textContent).toBe('B');
        expect(standards?.[1].textContent).toBe('C');
        expect(standards?.[2].textContent).toBe('A');
    });
    it('displays assessment date', () => {
        render(_jsx(LocationComplianceCard, { compliance: mockCompliance }));
        expect(screen.getByText(/Evaluación:/)).toBeInTheDocument();
    });
    it('hides assessment date when not provided', () => {
        const complianceNoDate = { ...mockCompliance, lastAssessmentDate: undefined };
        render(_jsx(LocationComplianceCard, { compliance: complianceNoDate }));
        expect(screen.queryByText(/Evaluación:/)).not.toBeInTheDocument();
    });
    it('shows selected badge when isSelected is true', () => {
        render(_jsx(LocationComplianceCard, { compliance: mockCompliance, isSelected: true }));
        expect(screen.getByText('Seleccionada')).toBeInTheDocument();
    });
    it('hides selected badge when isSelected is false', () => {
        render(_jsx(LocationComplianceCard, { compliance: mockCompliance, isSelected: false }));
        expect(screen.queryByText('Seleccionada')).not.toBeInTheDocument();
    });
    it('calls onClick when card is clicked', () => {
        const mockOnClick = jest.fn();
        render(_jsx(LocationComplianceCard, { compliance: mockCompliance, onClick: mockOnClick }));
        const card = screen.getByText('Clínica Centro').closest('.location-compliance-card');
        fireEvent.click(card);
        expect(mockOnClick).toHaveBeenCalled();
    });
    it('applies selected class when isSelected is true', () => {
        const { container } = render(_jsx(LocationComplianceCard, { compliance: mockCompliance, isSelected: true }));
        const card = container.querySelector('.location-compliance-card');
        expect(card).toHaveClass('selected');
    });
    it('applies semáforo-verde class', () => {
        const { container } = render(_jsx(LocationComplianceCard, { compliance: mockCompliance }));
        const card = container.querySelector('.location-compliance-card');
        expect(card).toHaveClass('semaforo-verde');
    });
    it('displays naranja semáforo correctly', () => {
        const complianceNaranja = {
            ...mockCompliance,
            overallCompliance: 65,
            semaforo: 'naranja',
        };
        const { container } = render(_jsx(LocationComplianceCard, { compliance: complianceNaranja }));
        const card = container.querySelector('.location-compliance-card');
        expect(card).toHaveClass('semaforo-naranja');
        expect(screen.getByText('Naranja - Parcial')).toBeInTheDocument();
    });
    it('displays rojo semáforo correctly', () => {
        const complianceRojo = {
            ...mockCompliance,
            overallCompliance: 45,
            semaforo: 'rojo',
        };
        const { container } = render(_jsx(LocationComplianceCard, { compliance: complianceRojo }));
        const card = container.querySelector('.location-compliance-card');
        expect(card).toHaveClass('semaforo-rojo');
        expect(screen.getByText('Rojo - No Cumple')).toBeInTheDocument();
    });
    it('renders view details button', () => {
        render(_jsx(LocationComplianceCard, { compliance: mockCompliance }));
        expect(screen.getByText('Ver Detalles →')).toBeInTheDocument();
    });
    it('has proper accessibility attributes', () => {
        const { container } = render(_jsx(LocationComplianceCard, { compliance: mockCompliance }));
        const card = container.querySelector('.location-compliance-card');
        expect(card).toHaveAttribute('role', 'button');
        expect(card).toHaveAttribute('tabIndex', '0');
    });
    it('responds to Enter key press', () => {
        const mockOnClick = jest.fn();
        const { container } = render(_jsx(LocationComplianceCard, { compliance: mockCompliance, onClick: mockOnClick }));
        const card = container.querySelector('.location-compliance-card');
        fireEvent.keyDown(card, { key: 'Enter' });
        expect(mockOnClick).toHaveBeenCalled();
    });
    it('responds to Space key press', () => {
        const mockOnClick = jest.fn();
        const { container } = render(_jsx(LocationComplianceCard, { compliance: mockCompliance, onClick: mockOnClick }));
        const card = container.querySelector('.location-compliance-card');
        fireEvent.keyDown(card, { key: ' ' });
        expect(mockOnClick).toHaveBeenCalled();
    });
    it('handles plural/singular hallazgo text', () => {
        render(_jsx(LocationComplianceCard, { compliance: mockCompliance }));
        expect(screen.getByText(/2 incumplimientos/)).toBeInTheDocument();
    });
    it('displays standard percentages', () => {
        render(_jsx(LocationComplianceCard, { compliance: mockCompliance }));
        expect(screen.getByText('90%')).toBeInTheDocument();
        expect(screen.getByText('85%')).toBeInTheDocument();
        expect(screen.getByText('80%')).toBeInTheDocument();
    });
    it('applies standard semáforo colors correctly', () => {
        const { container } = render(_jsx(LocationComplianceCard, { compliance: mockCompliance }));
        const dots = container.querySelectorAll('.standard-dot.semaforo-verde');
        expect(dots.length).toBe(3);
    });
    it('handles single hallazgo singular form', () => {
        const complianceOneHallazgo = { ...mockCompliance, hallazgosCount: 1 };
        render(_jsx(LocationComplianceCard, { compliance: complianceOneHallazgo }));
        expect(screen.getByText(/1 incumplimiento$/)).toBeInTheDocument();
    });
});
//# sourceMappingURL=LocationComplianceCard.test.js.map