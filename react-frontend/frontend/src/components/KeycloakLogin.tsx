import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useKeycloak } from '../context/KeycloakContext';
import './KeycloakLogin.css';

const KeycloakLogin = () => {
  const { authenticated, loading, login, userInfo } = useKeycloak();
  const navigate = useNavigate();

  useEffect(() => {
    // If already authenticated, redirect to main page
    if (authenticated) {
      navigate('/tracking-portal');
    }
  }, [authenticated, navigate]);

  if (loading) {
    return (
      <div className="keycloak-login-container">
        <div className="keycloak-login-card">
          <h2>Loading...</h2>
          <p>Initializing authentication...</p>
        </div>
      </div>
    );
  }

  const handleLogin = () => {
    login();
  };

  return (
    <div className="keycloak-login-container">
      <div className="keycloak-login-card">
        <h1>SLMS - Shipping & Logistics Management System</h1>
        <h2>Welcome</h2>
        
        {!authenticated ? (
          <>
            <p>Please sign in to access the system</p>
            <button className="keycloak-login-button" onClick={handleLogin}>
              Sign In with Keycloak
            </button>
            <div className="keycloak-info">
              <p><small>Authentication powered by Keycloak</small></p>
            </div>
          </>
        ) : (
          <>
            <p>You are already logged in</p>
            <p>Username: {userInfo?.preferred_username}</p>
            <p>Email: {userInfo?.email}</p>
          </>
        )}
      </div>
    </div>
  );
};

export default KeycloakLogin;
