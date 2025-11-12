import { createContext } from 'react';
import type { FeatureFlagsContextType } from './FeatureFlagsContext';
export const FeatureFlagsContext = createContext<FeatureFlagsContextType | undefined>(undefined);