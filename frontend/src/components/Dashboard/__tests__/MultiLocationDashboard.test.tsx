/**
 * Multi-Location Dashboard Tests
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MultiLocationDashboard } from '../MultiLocationDashboard';

// Mock fetch
global.fetch = jest.fn();

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(() => 'test-token'),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

const mockLocations = [
  { id: '1', name: 'Clínica Centro', city: 'Bogotá', state: 'Cundinamarca' },
  { id: '2', name: 'Hospital Norte', city: 'Medellín', state: 'Antioquia' },
  { id: '3', name: 'Centro Diagnóstico', city: 'Cali', state: 'Valle' },
];

const mockComplianceData = [
  {
    locationId: '1',
    locationName: 'Clínica Centro',
    overallCompliance: 85,
    semaforo: 'verde' as const,
    hallazgosCount: 2,
    lastAssessmentDate: '2026-03-15',
    perStandardMetrics: [
      { name: 'Capacidad técnico-administrativa', code: 'CTA', percent: 90, color: 'verde' as const },
      { name: 'Políticas y procedimientos', code: 'PP', percent: 85, color: 'verde' as const },
      { name: 'Gestión de recursos humanos', code: 'GRH', percent: 80, color: 'verde' as const },
    ],
  },
  {
    locationId: '2',
    locationName: 'Hospital Norte',
    overallCompliance: 65,
    semaforo: 'naranja' as const,
    hallazgosCount: 5,
    lastAssessmentDate: '2026-03-10',
    perStandardMetrics: [
      { name: 'Capacidad técnico-administrativa', code: 'CTA', percent: 70, color: 'naranja' as const },
      { name: 'Políticas y procedimientos', code: 'PP', percent: 60, color: 'naranja' as const },
      { name: 'Gestión de recursos humanos', code: 'GRH', percent: 65, color: 'naranja' as const },
    ],
  },
  {
    locationId: '3',
    locationName: 'Centro Diagnóstico',
    overallCompliance: 45,
    semaforo: 'rojo' as const,
    hallazgosCount: 8,
    lastAssessmentDate: '2026-02-20',
    perStandardMetrics: [
      { name: 'Capacidad técnico-administrativa', code: 'CTA', percent: 40, color: 'rojo' as const },
      { name: 'Políticas y procedimientos', code: 'PP', percent: 45, color: 'rojo' as const },
      { name: 'Gestión de recursos humanos', code: 'GRH', percent: 50, color: 'naranja' as const },
    ],
  },
];

describe('MultiLocationDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state initially', () => {
    (global.fetch as jest.Mock).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(<MultiLocationDashboard />);
    expect(screen.getByText(/Cargando datos de cumplimiento/i)).toBeInTheDocument();
  });

  it('renders dashboard with locations and compliance data', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockLocations,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockComplianceData,
      });

    render(<MultiLocationDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Cumplimiento por Ubicación')).toBeInTheDocument();
    });

    expect(screen.getByText('Clínica Centro')).toBeInTheDocument();
    expect(screen.getByText('Hospital Norte')).toBeInTheDocument();
    expect(screen.getByText('Centro Diagnóstico')).toBeInTheDocument();
  });

  it('displays location selector with all locations', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, json: async () => mockLocations })
      .mockResolvedValueOnce({ ok: true, json: async () => mockComplianceData });

    render(<MultiLocationDashboard />);

    await waitFor(() => {
      const selector = screen.getByDisplayValue('Clínica Centro (Bogotá)');
      expect(selector).toBeInTheDocument();
    });
  });

  it('changes selected location when selector changes', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, json: async () => mockLocations })
      .mockResolvedValueOnce({ ok: true, json: async () => mockComplianceData });

    render(<MultiLocationDashboard />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Clínica Centro (Bogotá)')).toBeInTheDocument();
    });

    const selector = screen.getByDisplayValue('Clínica Centro (Bogotá)');
    fireEvent.change(selector, { target: { value: '2' } });

    expect(screen.getByDisplayValue('Hospital Norte (Medellín)')).toBeInTheDocument();
  });

  it('switches between all and selected view modes', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, json: async () => mockLocations })
      .mockResolvedValueOnce({ ok: true, json: async () => mockComplianceData });

    render(<MultiLocationDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Clínica Centro')).toBeInTheDocument();
    });

    // Initially shows all locations
    expect(screen.getByText('Clínica Centro')).toBeInTheDocument();
    expect(screen.getByText('Hospital Norte')).toBeInTheDocument();
    expect(screen.getByText('Centro Diagnóstico')).toBeInTheDocument();

    // Click "Solo Seleccionada" button
    const selectedOnlyBtn = screen.getByText('Solo Seleccionada');
    fireEvent.click(selectedOnlyBtn);

    // Wait for view change
    await waitFor(() => {
      const allLocationsBtn = screen.getByText('Todas las Ubicaciones');
      expect(allLocationsBtn.parentElement).not.toHaveClass('active');
    });
  });

  it('displays semáforo colors correctly', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, json: async () => mockLocations })
      .mockResolvedValueOnce({ ok: true, json: async () => mockComplianceData });

    render(<MultiLocationDashboard />);

    await waitFor(() => {
      const cards = screen.getAllByRole('button');
      expect(cards.length).toBeGreaterThan(0);
    });

    // Check for semáforo color classes
    const dashboardElement = screen.getByText('Cumplimiento por Ubicación').closest('.multi-location-dashboard');
    expect(dashboardElement?.innerHTML).toContain('semaforo-verde');
    expect(dashboardElement?.innerHTML).toContain('semaforo-naranja');
    expect(dashboardElement?.innerHTML).toContain('semaforo-rojo');
  });

  it('displays compliance percentages', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, json: async () => mockLocations })
      .mockResolvedValueOnce({ ok: true, json: async () => mockComplianceData });

    render(<MultiLocationDashboard />);

    await waitFor(() => {
      expect(screen.getByText('85%')).toBeInTheDocument();
      expect(screen.getByText('65%')).toBeInTheDocument();
      expect(screen.getByText('45%')).toBeInTheDocument();
    });
  });

  it('displays hallazgos count', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, json: async () => mockLocations })
      .mockResolvedValueOnce({ ok: true, json: async () => mockComplianceData });

    render(<MultiLocationDashboard />);

    await waitFor(() => {
      expect(screen.getByText(/2 incumplimiento/)).toBeInTheDocument();
      expect(screen.getByText(/5 incumplimiento/)).toBeInTheDocument();
      expect(screen.getByText(/8 incumplimiento/)).toBeInTheDocument();
    });
  });

  it('displays error message on fetch failure', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    render(<MultiLocationDashboard />);

    await waitFor(() => {
      expect(screen.getByText(/Error/i)).toBeInTheDocument();
    });
  });

  it('displays comparison charts when multiple locations exist', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, json: async () => mockLocations })
      .mockResolvedValueOnce({ ok: true, json: async () => mockComplianceData });

    render(<MultiLocationDashboard />);

    await waitFor(() => {
      expect(screen.getByText(/Análisis Comparativo/)).toBeInTheDocument();
    });
  });

  it('shows selected location info', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, json: async () => mockLocations })
      .mockResolvedValueOnce({ ok: true, json: async () => mockComplianceData });

    render(<MultiLocationDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Clínica Centro')).toBeInTheDocument();
    });

    // Check for location details
    expect(screen.getByText(/Bogotá, Cundinamarca/)).toBeInTheDocument();
  });

  it('displays last assessment date', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, json: async () => mockLocations })
      .mockResolvedValueOnce({ ok: true, json: async () => mockComplianceData });

    render(<MultiLocationDashboard />);

    await waitFor(() => {
      const assessmentDates = screen.getAllByText(/Evaluación:/);
      expect(assessmentDates.length).toBeGreaterThan(0);
    });
  });

  it('handles location card click', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, json: async () => mockLocations })
      .mockResolvedValueOnce({ ok: true, json: async () => mockComplianceData });

    render(<MultiLocationDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Hospital Norte')).toBeInTheDocument();
    });

    const hospitalCard = screen.getByText('Hospital Norte').closest('.location-compliance-card');
    fireEvent.click(hospitalCard!);

    // Location selector should update
    await waitFor(() => {
      const selector = screen.getByDisplayValue(/Hospital Norte/);
      expect(selector).toBeInTheDocument();
    });
  });

  it('shows "no data" message when compliance data is empty', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, json: async () => mockLocations })
      .mockResolvedValueOnce({ ok: true, json: async () => [] });

    render(<MultiLocationDashboard />);

    await waitFor(() => {
      expect(screen.getByText(/No hay datos de cumplimiento/)).toBeInTheDocument();
    });
  });
});
