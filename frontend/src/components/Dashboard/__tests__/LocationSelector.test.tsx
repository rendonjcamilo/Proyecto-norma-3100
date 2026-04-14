/**
 * Location Selector Tests
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { LocationSelector } from '../LocationSelector';

const mockLocations = [
  { id: '1', name: 'Clínica Centro', city: 'Bogotá', state: 'Cundinamarca' },
  { id: '2', name: 'Hospital Norte', city: 'Medellín', state: 'Antioquia' },
  { id: '3', name: 'Centro Diagnóstico', city: 'Cali', state: 'Valle' },
];

describe('LocationSelector', () => {
  it('renders select element', () => {
    const mockChange = jest.fn();
    const { container } = render(
      <LocationSelector
        locations={mockLocations}
        selectedLocationId="1"
        onChange={mockChange}
      />
    );

    const select = container.querySelector('select');
    expect(select).toBeInTheDocument();
  });

  it('displays all locations as options', () => {
    const mockChange = jest.fn();
    render(
      <LocationSelector
        locations={mockLocations}
        selectedLocationId="1"
        onChange={mockChange}
      />
    );

    expect(screen.getByDisplayValue('Clínica Centro (Bogotá)')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Hospital Norte (Medellín)')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Centro Diagnóstico (Cali)')).toBeInTheDocument();
  });

  it('displays placeholder option', () => {
    const mockChange = jest.fn();
    render(
      <LocationSelector
        locations={mockLocations}
        selectedLocationId={null}
        onChange={mockChange}
      />
    );

    expect(screen.getByText('-- Seleccionar una ubicación --')).toBeInTheDocument();
  });

  it('calls onChange with selected location id', () => {
    const mockChange = jest.fn();
    render(
      <LocationSelector
        locations={mockLocations}
        selectedLocationId="1"
        onChange={mockChange}
      />
    );

    const select = screen.getByDisplayValue('Clínica Centro (Bogotá)');
    fireEvent.change(select, { target: { value: '2' } });

    expect(mockChange).toHaveBeenCalledWith('2');
  });

  it('displays selected location', () => {
    const mockChange = jest.fn();
    render(
      <LocationSelector
        locations={mockLocations}
        selectedLocationId="2"
        onChange={mockChange}
      />
    );

    const select = screen.getByDisplayValue('Hospital Norte (Medellín)');
    expect(select).toBeInTheDocument();
  });

  it('handles empty locations list', () => {
    const mockChange = jest.fn();
    render(
      <LocationSelector
        locations={[]}
        selectedLocationId={null}
        onChange={mockChange}
      />
    );

    expect(screen.getByText('No hay ubicaciones disponibles')).toBeInTheDocument();
  });

  it('displays correct location format (name with city)', () => {
    const mockChange = jest.fn();
    render(
      <LocationSelector
        locations={mockLocations}
        selectedLocationId="1"
        onChange={mockChange}
      />
    );

    // Verify format is "name (city)"
    expect(screen.getByDisplayValue(/Clínica Centro \(Bogotá\)/)).toBeInTheDocument();
  });

  it('applies correct CSS class', () => {
    const mockChange = jest.fn();
    const { container } = render(
      <LocationSelector
        locations={mockLocations}
        selectedLocationId="1"
        onChange={mockChange}
      />
    );

    const select = container.querySelector('.location-selector');
    expect(select).toBeInTheDocument();
  });

  it('has proper accessibility', () => {
    const mockChange = jest.fn();
    const { container } = render(
      <LocationSelector
        locations={mockLocations}
        selectedLocationId="1"
        onChange={mockChange}
      />
    );

    const select = container.querySelector('select');
    expect(select).not.toBeDisabled();
  });

  it('updates when locations prop changes', () => {
    const mockChange = jest.fn();
    const { rerender } = render(
      <LocationSelector
        locations={mockLocations}
        selectedLocationId="1"
        onChange={mockChange}
      />
    );

    const newLocations = [
      ...mockLocations,
      { id: '4', name: 'Clínica Nueva', city: 'Cartagena', state: 'Bolívar' },
    ];

    rerender(
      <LocationSelector
        locations={newLocations}
        selectedLocationId="1"
        onChange={mockChange}
      />
    );

    expect(screen.getByDisplayValue('Clínica Nueva (Cartagena)')).toBeInTheDocument();
  });

  it('updates when selectedLocationId prop changes', () => {
    const mockChange = jest.fn();
    const { rerender } = render(
      <LocationSelector
        locations={mockLocations}
        selectedLocationId="1"
        onChange={mockChange}
      />
    );

    rerender(
      <LocationSelector
        locations={mockLocations}
        selectedLocationId="3"
        onChange={mockChange}
      />
    );

    const select = screen.getByDisplayValue('Centro Diagnóstico (Cali)');
    expect(select).toBeInTheDocument();
  });

  it('handles null selectedLocationId', () => {
    const mockChange = jest.fn();
    render(
      <LocationSelector
        locations={mockLocations}
        selectedLocationId={null}
        onChange={mockChange}
      />
    );

    const select = screen.getByDisplayValue('-- Seleccionar una ubicación --');
    expect(select).toBeInTheDocument();
  });

  it('preserves location data structure', () => {
    const mockChange = jest.fn();
    const testLocation = {
      id: 'test-id-123',
      name: 'Test Location',
      city: 'Test City',
      state: 'Test State',
    };

    render(
      <LocationSelector
        locations={[testLocation]}
        selectedLocationId="test-id-123"
        onChange={mockChange}
      />
    );

    const select = screen.getByDisplayValue('Test Location (Test City)');
    fireEvent.change(select, { target: { value: 'test-id-123' } });

    expect(mockChange).toHaveBeenCalledWith('test-id-123');
  });
});
