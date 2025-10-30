import { useContext } from 'react';
import { FeatureFlagsContextType } from './FeatureFlagsContext';
import { FeatureFlagsContext } from './FeatureFlagsContextDef';

export const useFeatureFlags = (): FeatureFlagsContextType => {
  const context = useContext(FeatureFlagsContext);
  if (context === undefined) {
    throw new Error('useFeatureFlags deve ser usado dentro de um FeatureFlagsProvider');
  }
  return context;
};

export const useFeatureFlag = (flagKey: string): boolean => {
  const { isFeatureEnabled } = useFeatureFlags();
  return isFeatureEnabled(flagKey);
};