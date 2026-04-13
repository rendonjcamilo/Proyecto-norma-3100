import React, { createContext, useContext, useState, useEffect } from 'react';

export interface Provider {
  id: string;
  legalName: string;
  rut: string;
  city: string;
  department: string;
}

interface ProviderContextType {
  providers: Provider[];
  selectedProvider: Provider | null;
  setSelectedProvider: (provider: Provider) => void;
  isLoading: boolean;
}

const ProviderContext = createContext<ProviderContextType | undefined>(undefined);

// Mock providers data
const MOCK_PROVIDERS: Provider[] = [
  {
    id: 'prov-001',
    legalName: 'Hospital Central de Bogotá',
    rut: '860.123.456-7',
    city: 'Bogotá',
    department: 'Cundinamarca',
  },
  {
    id: 'prov-002',
    legalName: 'Clínica San Rafael',
    rut: '860.234.567-8',
    city: 'Medellín',
    department: 'Antioquia',
  },
  {
    id: 'prov-003',
    legalName: 'Hospital Metropolitano Cali',
    rut: '860.345.678-9',
    city: 'Cali',
    department: 'Valle del Cauca',
  },
  {
    id: 'prov-004',
    legalName: 'Centro Médico Barranquilla',
    rut: '860.456.789-0',
    city: 'Barranquilla',
    department: 'Atlántico',
  },
  {
    id: 'prov-005',
    legalName: 'Hospital Universitario Bucaramanga',
    rut: '860.567.890-1',
    city: 'Bucaramanga',
    department: 'Santander',
  },
];

export const ProviderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedProvider, setSelectedProviderState] = useState<Provider | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load selected provider from localStorage on mount
  useEffect(() => {
    const savedProviderId = localStorage.getItem('selected_provider_id');
    if (savedProviderId) {
      const provider = MOCK_PROVIDERS.find(p => p.id === savedProviderId);
      if (provider) {
        setSelectedProviderState(provider);
      } else {
        setSelectedProviderState(MOCK_PROVIDERS[0]);
      }
    } else {
      setSelectedProviderState(MOCK_PROVIDERS[0]);
    }
    setIsLoading(false);
  }, []);

  const setSelectedProvider = (provider: Provider) => {
    setSelectedProviderState(provider);
    localStorage.setItem('selected_provider_id', provider.id);
  };

  return (
    <ProviderContext.Provider
      value={{
        providers: MOCK_PROVIDERS,
        selectedProvider,
        setSelectedProvider,
        isLoading,
      }}
    >
      {children}
    </ProviderContext.Provider>
  );
};

export const useProvider = () => {
  const context = useContext(ProviderContext);
  if (!context) {
    throw new Error('useProvider must be used within ProviderProvider');
  }
  return context;
};
