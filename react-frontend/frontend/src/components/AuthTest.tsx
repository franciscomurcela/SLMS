import { useKeycloak } from "../context/KeycloakContext";
import { BACKEND_URL } from "../config/keycloak.config";
import { useState } from "react";

function AuthTest() {
  const { keycloak, authenticated, loading, userInfo, token, logout } = useKeycloak();
  const [backendResponse, setBackendResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const testBackendCall = async () => {
    try {
      setError(null);
      setBackendResponse(null);

      const response = await fetch(`${BACKEND_URL}/user/whoami`, {
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
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return <div className="container mt-5">A carregar Keycloak...</div>;
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
              Testar chamada ao Backend (/user/whoami)
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
