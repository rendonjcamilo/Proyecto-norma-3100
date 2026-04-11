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
export declare const LocationSelector: React.FC<LocationSelectorProps>;
export default LocationSelector;
//# sourceMappingURL=LocationSelector.d.ts.map