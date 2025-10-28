import { createContext, useContext, useState, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import Keycloak from 'keycloak-js';
import { keycloakConfig, keycloakInitOptions, BACKEND_URL } from '../config/keycloak.config';

interface KeycloakContextType {
  keycloak: Keycloak | null;
  authenticated: boolean;
  loading: boolean;
  login: () => void;
  logout: () => void;
  token: string | undefined;
  userInfo: any;
  roles: string[];
  hasRole: (role: string) => boolean;
  primaryRole: string | undefined;
}

const KeycloakContext = createContext<KeycloakContextType>({
  keycloak: null,
  authenticated: false,
  loading: true,
  login: () => {},
  logout: () => {},
  token: undefined,
  userInfo: null,
  roles: [],
  hasRole: () => false,
  primaryRole: undefined,
});

export const useKeycloak = () => useContext(KeycloakContext);

interface KeycloakProviderProps {
  children: ReactNode;
}

// Role priority order (higher index = higher priority)
const ROLE_PRIORITY = [
  'Customer',
  'Csr',
  'Warehouse_Staff',
  'Driver', 
  'Logistics_Manager',
] as const;

export const KeycloakProvider = ({ children }: KeycloakProviderProps) => {
  const [keycloak, setKeycloak] = useState<Keycloak | null>(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const initializingRef = useRef(false);
  const initializedRef = useRef(false);

  useEffect(() => {
    // Prevent re-initialization using ref (more reliable than state)
    if (initializedRef.current || initializingRef.current) {
      console.log('Keycloak already initialized or initializing, skipping...');
      return;
    }

    initializingRef.current = true;

    const initKeycloak = async () => {
      try {
        console.log('Initializing Keycloak...');
        setLoading(true);
        
        // WORKAROUND: Mock Web Crypto API if not available (HTTP context)
        // This prevents Keycloak from crashing when trying to use PKCE
        if (!window.crypto || !window.crypto.subtle) {
          console.warn('⚠️ Web Crypto API not available (HTTP), using mock');
          (window as any).crypto = {
            subtle: {},
            getRandomValues: (arr: any) => {
              for (let i = 0; i < arr.length; i++) {
                arr[i] = Math.floor(Math.random() * 256);
              }
              return arr;
            }
          };
        }
        
        const keycloakInstance = new Keycloak(keycloakConfig);
        
        const auth = await keycloakInstance.init(keycloakInitOptions);
        
        console.log('Keycloak initialized, authenticated:', auth);
        
        setKeycloak(keycloakInstance);
        setAuthenticated(auth);
        initializedRef.current = true;
        setLoading(false);

        if (auth) {
          // Debug: Log the entire token to see structure
          console.log('🔍 Full token parsed:', keycloakInstance.tokenParsed);
          console.log('🔍 Realm access:', keycloakInstance.tokenParsed?.realm_access);
          console.log('🔍 Resource access:', keycloakInstance.tokenParsed?.resource_access);
          
          // Extract roles from token
          const userRoles = keycloakInstance.tokenParsed?.realm_access?.roles || [];
          const appRoles = userRoles.filter((role: string) => 
            ROLE_PRIORITY.includes(role as typeof ROLE_PRIORITY[number])
          );
          setRoles(appRoles);
          console.log('User roles:', appRoles);

          // 🔄 SYNC USER TO SUPABASE AUTOMATICALLY
          // Call /user/whoami to trigger UserSyncFilter on backend
          // This ensures the user exists in Supabase database
          const syncUserToSupabase = async () => {
            try {
              console.log('🔄 Syncing user to Supabase...');
              const response = await fetch(`${BACKEND_URL}/user/whoami`, {
                headers: {
                  'Authorization': `Bearer ${keycloakInstance.token}`,
                  'Content-Type': 'application/json',
                },
              });

              if (response.ok) {
                const data = await response.json();
                console.log('✅ User synced to Supabase:', data);
              } else {
                console.warn('⚠️ User sync request failed:', response.status, response.statusText);
              }
            } catch (error) {
              console.error('❌ Error syncing user to Supabase:', error);
              // Don't block authentication if sync fails
            }
          };

          // Sync user in background (non-blocking)
          syncUserToSupabase();

          // Load user info (but don't block on it)
          keycloakInstance.loadUserInfo()
            .then((info) => {
              setUserInfo(info);
              console.log('User info loaded:', info);
            })
            .catch((err) => {
              console.warn('Failed to load user info from endpoint, extracting from token:', err);
              // Fallback: extract user info from token claims
              if (keycloakInstance.tokenParsed) {
                const tokenInfo = {
                  sub: keycloakInstance.tokenParsed.sub,
                  email: keycloakInstance.tokenParsed.email,
                  preferred_username: keycloakInstance.tokenParsed.preferred_username,
                  name: keycloakInstance.tokenParsed.name,
                  given_name: keycloakInstance.tokenParsed.given_name,
                  family_name: keycloakInstance.tokenParsed.family_name,
                };
                setUserInfo(tokenInfo);
                console.log('User info extracted from token:', tokenInfo);
              }
            });
          
          console.log('User authenticated, token:', keycloakInstance.token?.substring(0, 50) + '...');
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

      } catch (error) {
        console.error('Failed to initialize Keycloak:', error);
        setLoading(false);
        initializedRef.current = true;
      } finally {
        initializingRef.current = false;
      }
    };

    initKeycloak();
  }, []); // Empty dependency array - run only once on mount

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

  const hasRole = (role: string): boolean => {
    return roles.includes(role);
  };

  // Get the highest priority role
  const primaryRole = ROLE_PRIORITY
    .slice()
    .reverse()
    .find(role => roles.includes(role));

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
        roles,
        hasRole,
        primaryRole,
      }}
    >
      {children}
    </KeycloakContext.Provider>
  );
};
