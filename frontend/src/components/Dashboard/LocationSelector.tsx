/**
 * Location Selector Component
 * Dropdown for selecting a location
 */

import React from 'react';
import './LocationSelector.css';

export interface Location {
  id: string;
  name: string;
  city: string;
  state: string;
}

interface LocationSelectorProps {
  locations: Location[];
  selectedLocationId: string | null;
  onChange: (locationId: string) => void;
}

export const LocationSelector: React.FC<LocationSelectorProps> = ({
  locations,
  selectedLocationId,
  onChange,
}) => {
  return (
    <select
      className="location-selector"
      value={selectedLocationId || ''}
      onChange={e => onChange(e.target.value)}
    >
      {locations.length === 0 ? (
        <option value="">No hay ubicaciones disponibles</option>
      ) : (
        <>
          <option value="">-- Seleccionar una ubicación --</option>
          {locations.map(location => (
            <option key={location.id} value={location.id}>
              {location.name} ({location.city})
            </option>
          ))}
        </>
      )}
    </select>
  );
};

export default LocationSelector;
