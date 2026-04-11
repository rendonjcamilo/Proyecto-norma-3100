/**
 * Multi-Location Compliance Dashboard
 * Displays compliance status across all provider locations
 * Shows semáforo colors (verde/naranja/rojo) and allows location comparison
 */

import React, { useEffect, useState } from 'react';
import { LocationComplianceCard } from './LocationComplianceCard';
import { LocationSelector } from './LocationSelector';
import { ComplianceCharts } from './ComplianceCharts';
import './MultiLocationDashboard.css';

export interface Location {
  id: string;
  name: string;
  city: string;
  state: string;
}

export interface LocationCompliance {
  locationId: string;
  locationName: string;
  overallCompliance: number;
  semaforo: 'verde' | 'naranja' | 'rojo';
  hallazgosCount: number;
  lastAssessmentDate?: string;
  perStandardMetrics: {
    name: string;
    code: string;
    percent: number;
    color: 'verde' | 'naranja' | 'rojo';
  }[];
}

const API_BASE_URL = '/api';

export const MultiLocationDashboard: React.FC = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [complianceData, setComplianceData] = useState<LocationCompliance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'all' | 'selected'>('all');

  // Fetch locations
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/providers/locations`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          },
        });
        if (!response.ok) throw new Error('Error al cargar ubicaciones');
        const data: Location[] = await response.json();
        setLocations(data);
        if (data.length > 0) {
          setSelectedLocationId(data[0].id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      }
    };

    fetchLocations();
  }, []);

  // Fetch compliance data for all locations
  useEffect(() => {
    const fetchCompliance = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/assessments/locations/compliance`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          },
        });
        if (!response.ok) throw new Error('Error al cargar datos de cumplimiento');
        const data: LocationCompliance[] = await response.json();
        setComplianceData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };

    if (locations.length > 0) {
      fetchCompliance();
    }
  }, [locations]);

  const getSemaforoColor = (percent: number): 'verde' | 'naranja' | 'rojo' => {
    if (percent >= 80) return 'verde';
    if (percent >= 50) return 'naranja';
    return 'rojo';
  };

  const selectedLocation = locations.find(loc => loc.id === selectedLocationId);
  const selectedCompliance = complianceData.find(
    comp => comp.locationId === selectedLocationId
  );

  const displayedCompliance = viewMode === 'selected' && selectedCompliance
    ? [selectedCompliance]
    : complianceData;

  if (loading && complianceData.length === 0) {
    return (
      <div className="multi-location-dashboard loading">
        <div className="loading-spinner">Cargando datos de cumplimiento...</div>
      </div>
    );
  }

  return (
    <div className="multi-location-dashboard">
      <div className="dashboard-header">
        <h1>Cumplimiento por Ubicación</h1>
        <p className="dashboard-subtitle">
          Visualización del estado de cumplimiento Norma 3100 en todas las ubicaciones
        </p>
      </div>

      {error && (
        <div className="error-message">
          <strong>Error:</strong> {error}
        </div>
      )}

      <div className="dashboard-controls">
        <div className="control-group">
          <label htmlFor="location-selector">Seleccionar Ubicación:</label>
          <LocationSelector
            locations={locations}
            selectedLocationId={selectedLocationId}
            onChange={setSelectedLocationId}
          />
        </div>

        <div className="control-group view-mode">
          <label>Modo de Vista:</label>
          <div className="view-buttons">
            <button
              className={`view-btn ${viewMode === 'all' ? 'active' : ''}`}
              onClick={() => setViewMode('all')}
            >
              Todas las Ubicaciones
            </button>
            <button
              className={`view-btn ${viewMode === 'selected' ? 'active' : ''}`}
              onClick={() => setViewMode('selected')}
            >
              Solo Seleccionada
            </button>
          </div>
        </div>
      </div>

      {selectedCompliance && (
        <div className="selected-location-info">
          <div className="location-header">
            <h2>{selectedLocation?.name}</h2>
            <p className="location-details">
              {selectedLocation?.city}, {selectedLocation?.state}
            </p>
          </div>
          {selectedCompliance.lastAssessmentDate && (
            <p className="last-assessment">
              Última evaluación: {new Date(selectedCompliance.lastAssessmentDate).toLocaleDateString('es-CO')}
            </p>
          )}
        </div>
      )}

      {displayedCompliance.length === 0 ? (
        <div className="no-data">
          <p>No hay datos de cumplimiento disponibles</p>
        </div>
      ) : (
        <>
          <div className="locations-grid">
            {displayedCompliance.map(compliance => (
              <LocationComplianceCard
                key={compliance.locationId}
                compliance={compliance}
                isSelected={compliance.locationId === selectedLocationId}
                onClick={() => setSelectedLocationId(compliance.locationId)}
              />
            ))}
          </div>

          {displayedCompliance.length > 1 && (
            <ComplianceCharts data={displayedCompliance} />
          )}
        </>
      )}
    </div>
  );
};

export default MultiLocationDashboard;
