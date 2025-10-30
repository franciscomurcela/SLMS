import { createContext } from 'react';
import type { KeycloakContextType } from './KeycloakContext';
export const KeycloakContext = createContext<KeycloakContextType | undefined>(undefined);