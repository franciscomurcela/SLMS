import { useContext } from 'react';
import { KeycloakContext } from './KeycloakContext';

export const useKeycloak = () => useContext(KeycloakContext);