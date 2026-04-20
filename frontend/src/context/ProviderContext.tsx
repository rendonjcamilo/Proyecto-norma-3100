import React, { createContext, useContext, useState, useEffect } from 'react';
import { providersApi, Provider as ApiProvider } from '@services/api';
import { useAuth } from './AuthContext';

export interface Provider {
  id: string;
  legalName: string;
  rut: string;
  city: string;
  department: string;
}

interface ProviderContextType {
  providers: Provider[];
  availableProviders: Provider[];
  selectedProvider: Provider | null;
  setSelectedProvider: (provider: Provider) => void;
  isLoading: boolean;
}

const ProviderContext = createContext<ProviderContextType | undefined>(undefined);

// Transform API Provider to Context Provider
const transformProvider = (apiProvider: ApiProvider): Provider => ({
  id: apiProvider.id,
  legalName: apiProvider.legal_name,
  rut: apiProvider.rut,
  city: apiProvider.city,
  department: apiProvider.department,
});


export const ProviderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [availableProviders, setAvailableProviders] = useState<Provider[]>([]);
  const [selectedProvider, setSelectedProviderState] = useState<Provider | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load providers based on user role
  useEffect(() => {
    const loadProviders = async () => {
      try {
        setIsLoading(true);
        let providersData: Provider[] = [];

        // If auditor, load their assigned providers from API
        if (user?.role === 'auditor') {
          const response = await providersApi.getMyProviders();
          providersData = (response.providers || []).map(transformProvider);
        } else if (user?.role === 'provider_admin' && user?.provider_id) {
          // For provider_admin, load only their assigned provider
          const allProviders = await providersApi.list();
          const myProvider = (allProviders.data || []).find((p: ApiProvider) => p.id === user.provider_id);
          providersData = myProvider ? [transformProvider(myProvider)] : [];
        } else {
          // For super_admin or fallback, load all providers
          const allProviders = await providersApi.list();
          providersData = (allProviders.data || []).map(transformProvider);
        }

        setAvailableProviders(providersData);

        // Restore selected provider from localStorage
        const savedProviderId = localStorage.getItem('selected_provider_id');
        if (savedProviderId) {
          const provider = providersData.find(p => p.id === savedProviderId);
          if (provider) {
            setSelectedProviderState(provider);
          } else {
            setSelectedProviderState(providersData[0] || null);
          }
        } else {
          setSelectedProviderState(providersData[0] || null);
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      loadProviders();
    }
  }, [user?.role, user?.id]);

  const setSelectedProvider = (provider: Provider) => {
    setSelectedProviderState(provider);
    localStorage.setItem('selected_provider_id', provider.id);
  };

  return (
    <ProviderContext.Provider
      value={{
        providers: availableProviders,
        availableProviders,
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
