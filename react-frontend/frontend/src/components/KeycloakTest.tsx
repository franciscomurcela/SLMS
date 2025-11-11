import { useState, useEffect } from 'react';
import { useKeycloak } from '../context/keycloakHooks';
import { BACKEND_URL, keycloakConfig } from '../config/keycloak.config';
import './KeycloakTest.css';

interface WhoAmIResponse {
  sub: string;
  claims: Record<string, unknown>;
}

const KeycloakTest = () => {
  const { authenticated, token, userInfo, logout } = useKeycloak();
  const [whoami, setWhoami] = useState<WhoAmIResponse | null>(null);
  const [userMeData, setUserMeData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const callWhoAmI = async () => {
    if (!token) {
      setError('No token available');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${BACKEND_URL}/whoami`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setWhoami(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to call /whoami');
      console.error('Error calling /whoami:', err);
    } finally {
      setLoading(false);
    }
  };

  const callUserMe = async () => {
    if (!token) {
      setError('No token available');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${BACKEND_URL}/user/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setUserMeData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to call /user/me');
      console.error('Error calling /user/me:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Auto-call on mount if authenticated
    if (authenticated && token) {
      callWhoAmI();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authenticated, token]);

  if (!authenticated) {
    return (
      <div className="keycloak-test-container">
        <div className="keycloak-test-card">
          <h2>Not Authenticated</h2>
          <p>Please login to access this page</p>
        </div>
      </div>
    );
  }

  return (
    <div className="keycloak-test-container">
      <div className="keycloak-test-card">
        <h1>🔐 Keycloak Integration Test</h1>
        
        <div className="test-section">
          <h2>User Information</h2>
          <div className="info-box">
            <p><strong>Username:</strong> {typeof userInfo?.preferred_username === 'string' ? userInfo.preferred_username : ''}</p>
            <p><strong>Email:</strong> {typeof userInfo?.email === 'string' ? userInfo.email : ''}</p>
            <p><strong>Name:</strong> {typeof userInfo?.name === 'string' ? userInfo.name : (typeof userInfo?.given_name === 'string' ? userInfo.given_name : '')}</p>
            <p><strong>Subject (sub):</strong> {typeof userInfo?.sub === 'string' ? userInfo.sub : ''}</p>
          </div>
        </div>

        <div className="test-section">
          <h2>Access Token</h2>
          <div className="token-box">
            <code>{token?.substring(0, 100)}...</code>
          </div>
          <button 
            className="copy-button"
            onClick={() => {
              if (token) {
                navigator.clipboard.writeText(token);
                alert('Token copied to clipboard!');
              }
            }}
          >
            📋 Copy Full Token
          </button>
        </div>

        <div className="test-section">
          <h2>Backend API Tests</h2>
          
          <div className="api-test">
            <button 
              className="test-button"
              onClick={callWhoAmI}
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Test /whoami endpoint'}
            </button>
            
            {whoami && (
              <div className="result-box success">
                <h3>✅ /whoami Response:</h3>
                <pre>{JSON.stringify(whoami, null, 2)}</pre>
              </div>
            )}
          </div>

          <div className="api-test">
            <button 
              className="test-button"
              onClick={callUserMe}
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Test /user/me endpoint'}
            </button>
            
            {userMeData && (
              <div className="result-box success">
                <h3>✅ /user/me Response:</h3>
                <pre>{JSON.stringify(userMeData, null, 2)}</pre>
              </div>
            )}
          </div>

          {error && (
            <div className="result-box error">
              <h3>❌ Error:</h3>
              <p>{error}</p>
            </div>
          )}
        </div>

        <div className="test-section">
          <h2>Configuration</h2>
          <div className="info-box">
            <p><strong>Backend URL:</strong> {BACKEND_URL}</p>
            <p><strong>Keycloak URL:</strong> {keycloakConfig.url}</p>
            <p><strong>Realm:</strong> {keycloakConfig.realm}</p>
            <p><strong>Client ID:</strong> {keycloakConfig.clientId}</p>
          </div>
        </div>

        <div className="logout-section">
          <button className="logout-button" onClick={logout}>
            🚪 Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default KeycloakTest;
