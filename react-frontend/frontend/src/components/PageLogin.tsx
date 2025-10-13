import Header from "./Header";
import Roles from "./UtilsRoles";
import Paths from "./UtilsPaths";
import { useKeycloak } from "../context/KeycloakContext";

const role: string = Roles.ROLE_LOGIN;
const href: string = Paths.PATH_LOGIN;

function Login() {
  const { login, authenticated, loading } = useKeycloak();

  // Se já estiver autenticado, mostra mensagem
  if (authenticated) {
    return (
      <>
        <Header role={role} href={href} />
        <div className="container text-center mt-5">
          <h3>Já está autenticado!</h3>
          <p>Pode navegar para outras páginas da aplicação.</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Header role={role} href={href} />

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
