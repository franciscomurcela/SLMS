import { useContext } from 'react';
import { KeycloakContext } from './KeycloakContextDef';
import type { KeycloakContextType } from './KeycloakContext';

export const useKeycloak = (): KeycloakContextType => {
	const ctx = useContext(KeycloakContext);
	if (!ctx) throw new Error('useKeycloak must be used within a KeycloakProvider');
	return ctx;
};