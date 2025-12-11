import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "./Header";
import Roles from "./UtilsRoles";
import Paths from "./UtilsPaths";
import { useKeycloak } from "../context/keycloakHooks";
import { getRouteForRole } from "../config/roles.config";

const role: string = Roles.ROLE_LOGIN;
const href: string = Paths.PATH_LOGIN;

function Login() {
  const { login, authenticated, loading, primaryRole } = useKeycloak();
  const navigate = useNavigate();

  // Redirect to role-specific page after authentication
  useEffect(() => {
    if (authenticated && primaryRole) {
      const targetRoute = getRouteForRole(primaryRole);
      if (targetRoute) {
        console.log(`Redirecting user with role ${primaryRole} to ${targetRoute}`);
        navigate(targetRoute);
      } else {
        console.warn(`No route configured for role: ${primaryRole}`);
      }
    }
  }, [authenticated, primaryRole, navigate]);

  // Se já estiver autenticado mas sem role definida
  if (authenticated && !primaryRole) {
    return (
      <>
        <Header role={role} href={href} showNavButtons={false} />
        <div className="container text-center mt-5">
          <h3>Já está autenticado!</h3>
          <p className="text-warning">Nenhuma role atribuída. Contacte o administrador.</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Header role={role} href={href} showNavButtons={false} />

      <div className="container text-center mt-5">
        <div className="row justify-content-center">
          <div className="col-md-6">
            <h2 className="mb-4">Bem-vindo ao SLMS</h2>
            <p className="mb-4">Por favor, faça login para continuar</p>
            <button 
              onClick={login} 
              className="btn btn-primary btn-lg"
              disabled={loading}
            >
              {loading ? "A carregar..." : "Login com Keycloak"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default Login;
