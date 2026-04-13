/**
 * Provider Selector Component
 * Allows users to switch between different providers/hospitals
 */

import React, { useState } from 'react';
import { Provider } from '../../context/ProviderContext';
import './ProviderSelector.css';

interface ProviderSelectorProps {
  providers: Provider[];
  selectedProvider: Provider | null;
  onSelectProvider: (provider: Provider) => void;
}

export const ProviderSelector: React.FC<ProviderSelectorProps> = ({
  providers,
  selectedProvider,
  onSelectProvider,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (providerId: string) => {
    const provider = providers.find(p => p.id === providerId);
    if (provider) {
      onSelectProvider(provider);
      setIsOpen(false);
    }
  };

  return (
    <div className="provider-selector">
      <button
        className="provider-selector-btn"
        onClick={() => setIsOpen(!isOpen)}
        title="Cambiar proveedor"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 21h18" />
          <path d="M5 21V7l8-4v18" />
          <path d="M19 21V11l-6-4" />
          <line x1="9" y1="9" x2="9" y2="9.01" />
          <line x1="9" y1="12" x2="9" y2="12.01" />
          <line x1="9" y1="15" x2="9" y2="15.01" />
          <line x1="9" y1="18" x2="9" y2="18.01" />
        </svg>
        <div className="provider-info">
          <div className="provider-name">{selectedProvider?.legalName}</div>
          <div className="provider-city">{selectedProvider?.city}</div>
        </div>
      </button>

      {isOpen && (
        <div className="provider-dropdown">
          <div className="dropdown-header">Seleccionar Proveedor</div>
          <ul className="provider-list">
            {providers.map(provider => (
              <li key={provider.id}>
                <button
                  className={`provider-item ${
                    selectedProvider?.id === provider.id ? 'active' : ''
                  }`}
                  onClick={() => handleSelect(provider.id)}
                >
                  <div className="item-main">
                    <div className="item-name">{provider.legalName}</div>
                    <div className="item-meta">
                      {provider.city} • {provider.rut}
                    </div>
                  </div>
                  {selectedProvider?.id === provider.id && (
                    <svg
                      className="checkmark"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ProviderSelector;
