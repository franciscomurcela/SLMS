import { useKeycloak } from "../context/keycloakHooks";
import { BACKEND_URL } from "../config/keycloak.config";
import { useState, useEffect } from "react";

function AuthTest() {
  const { authenticated, loading, userInfo, token, logout } = useKeycloak();
  const [backendResponse, setBackendResponse] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  // Safety timeout: if loading for more than 10 seconds, show error
  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => {
        setLoadingTimeout(true);
      }, 10000);
      return () => clearTimeout(timer);
    } else {
      setLoadingTimeout(false);
    }
  }, [loading]);

  const testBackendCall = async () => {
    try {
      setError(null);
      setBackendResponse(null);

      const response = await fetch(`${BACKEND_URL}/api/users/whoami`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Backend error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      setBackendResponse(data);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Erro desconhecido');
      }
    }
  };

  if (loading && !loadingTimeout) {
    return (
      <div className="container mt-5">
        <div className="alert alert-info">
          <div className="spinner-border spinner-border-sm me-2" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          A carregar Keycloak...
        </div>
      </div>
    );
  }

  if (loadingTimeout) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger">
          ❌ Erro: Keycloak demorou muito tempo a carregar. 
          <br/>
          Por favor, recarregue a página ou verifique se o Keycloak está a correr (porta 8083).
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="container mt-5">
        <div className="alert alert-warning">
          ❌ Não autenticado. Por favor, faça login primeiro.
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-5">
      <div className="card">
        <div className="card-header bg-success text-white">
          <h4>✅ Autenticação bem-sucedida!</h4>
        </div>
        <div className="card-body">
          <h5>Informação do utilizador:</h5>
          <pre className="bg-light p-3 rounded">
            {JSON.stringify(userInfo, null, 2)}
          </pre>

          <h5 className="mt-4">Token JWT:</h5>
          <div className="bg-light p-3 rounded" style={{ wordBreak: 'break-all', fontSize: '0.8rem' }}>
            {token?.substring(0, 100)}...
          </div>

          <div className="mt-4">
            <button 
              className="btn btn-primary me-2" 
              onClick={testBackendCall}
            >
              Testar chamada ao Backend (/api/users/whoami)
            </button>
            <button 
              className="btn btn-danger" 
              onClick={logout}
            >
              Logout
            </button>
          </div>

          {backendResponse && (
            <div className="mt-4">
              <h5>✅ Resposta do Backend:</h5>
              <pre className="bg-light p-3 rounded">
                {JSON.stringify(backendResponse, null, 2)}
              </pre>
            </div>
          )}

          {error && (
            <div className="mt-4 alert alert-danger">
              ❌ Erro: {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AuthTest;
