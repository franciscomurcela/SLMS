import React, { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import flagsmith from 'flagsmith';

interface FeatureFlagsContextType {
  isFeatureEnabled: (flagKey: string) => boolean;
  isLoading: boolean;
  error: string | null;
}

const FeatureFlagsContext = createContext<FeatureFlagsContextType | undefined>(undefined);

interface FeatureFlagsProviderProps {
  children: ReactNode;
}

// Environment Key do Flagsmith (substitua pela sua Environment Key real)
const FLAGSMITH_ENVIRONMENT_KEY = import.meta.env.VITE_FLAGSMITH_ENVIRONMENT_KEY;

export const FeatureFlagsProvider: React.FC<FeatureFlagsProviderProps> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeFlagsmith = async () => {
      try {
        setIsLoading(true);
        setError(null);

        if (!FLAGSMITH_ENVIRONMENT_KEY) {
          throw new Error('VITE_FLAGSMITH_ENVIRONMENT_KEY não configurada no arquivo .env');
        }

        console.log('🚩 Inicializando Flagsmith com Environment Key:', FLAGSMITH_ENVIRONMENT_KEY);

        await flagsmith.init({
          environmentID: FLAGSMITH_ENVIRONMENT_KEY,
          cacheFlags: true,
          onChange: (_oldFlags: any, params: any) => {
            console.log('🔄 Feature flags atualizadas pelo Flagsmith:', params.flags);
          },
        });

        // Obter flags iniciais
        const allFlags = flagsmith.getAllFlags();
        console.log('✅ Flagsmith inicializado com sucesso!');
        console.log('🏁 Flags disponíveis:', allFlags);
        
      } catch (err) {
        console.error('❌ Erro ao inicializar Flagsmith:', err);
        setError(err instanceof Error ? err.message : 'Erro ao carregar configurações de features');
      } finally {
        setIsLoading(false);
      }
    };

    initializeFlagsmith();
  }, []);

  const isFeatureEnabled = (flagKey: string): boolean => {
    try {
      const isEnabled = flagsmith.hasFeature(flagKey);
      console.log(`🔍 Verificando feature flag '${flagKey}':`, isEnabled);
      return isEnabled;
    } catch (err) {
      console.warn(`⚠️ Erro ao verificar flag '${flagKey}':`, err);
      return false; // Fallback seguro - feature desabilitada por padrão
    }
  };

  const contextValue: FeatureFlagsContextType = {
    isFeatureEnabled,
    isLoading,
    error,
  };

  return (
    <FeatureFlagsContext.Provider value={contextValue}>
      {children}
    </FeatureFlagsContext.Provider>
  );
};

export const useFeatureFlags = (): FeatureFlagsContextType => {
  const context = useContext(FeatureFlagsContext);
  if (context === undefined) {
    throw new Error('useFeatureFlags deve ser usado dentro de um FeatureFlagsProvider');
  }
  return context;
};

// Hook específico para verificar uma feature
export const useFeatureFlag = (flagKey: string): boolean => {
  const { isFeatureEnabled } = useFeatureFlags();
  return isFeatureEnabled(flagKey);
};