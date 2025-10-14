import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import Keycloak from 'keycloak-js';
import { keycloakConfig, keycloakInitOptions } from '../config/keycloak.config';

interface KeycloakContextType {
  keycloak: Keycloak | null;
  authenticated: boolean;
  loading: boolean;
  login: () => void;
  logout: () => void;
  token: string | undefined;
  userInfo: any;
}

const KeycloakContext = createContext<KeycloakContextType>({
  keycloak: null,
  authenticated: false,
  loading: true,
  login: () => {},
  logout: () => {},
  token: undefined,
  userInfo: null,
});

export const useKeycloak = () => useContext(KeycloakContext);

interface KeycloakProviderProps {
  children: ReactNode;
}

export const KeycloakProvider = ({ children }: KeycloakProviderProps) => {
  const [keycloak, setKeycloak] = useState<Keycloak | null>(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // Prevent re-initialization
    if (initialized) {
      console.log('Keycloak already initialized, skipping...');
      return;
    }

    const initKeycloak = async () => {
      try {
        console.log('Initializing Keycloak...');
        const keycloakInstance = new Keycloak(keycloakConfig);
        
        const auth = await keycloakInstance.init(keycloakInitOptions);
        
        console.log('Keycloak initialized, authenticated:', auth);
        
        setKeycloak(keycloakInstance);
        setAuthenticated(auth);
        setInitialized(true);

        if (auth) {
          // Load user info
          const info = await keycloakInstance.loadUserInfo();
          setUserInfo(info);
          
          console.log('User authenticated:', info);
          console.log('Token:', keycloakInstance.token);
        } else {
          console.log('User not authenticated');
        }

        // Setup token refresh
        keycloakInstance.onTokenExpired = () => {
          console.log('Token expired, refreshing...');
          keycloakInstance.updateToken(30).then((refreshed: boolean) => {
            if (refreshed) {
              console.log('Token refreshed');
              setAuthenticated(true);
            } else {
              console.warn('Token not refreshed, still valid');
            }
          }).catch(() => {
            console.error('Failed to refresh token');
            setAuthenticated(false);
            keycloakInstance.login();
          });
        };

        setLoading(false);
      } catch (error) {
        console.error('Failed to initialize Keycloak:', error);
        setLoading(false);
        setInitialized(true);
      }
    };

    initKeycloak();
  }, [initialized]);

  const login = () => {
    if (keycloak) {
      keycloak.login();
    }
  };

  const logout = () => {
    if (keycloak) {
      keycloak.logout();
    }
  };

  return (
    <KeycloakContext.Provider
      value={{
        keycloak,
        authenticated,
        loading,
        login,
        logout,
        token: keycloak?.token,
        userInfo,
      }}
    >
      {children}
    </KeycloakContext.Provider>
  );
};
