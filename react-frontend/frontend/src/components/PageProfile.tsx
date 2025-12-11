import Header from "./Header";
import Roles from "./UtilsRoles";
import Paths from "./UtilsPaths";
import { useNavigate } from "react-router-dom";
import { useKeycloak } from "../context/keycloakHooks";
import { getRouteForRole } from "../config/roles.config";

const role: string = Roles.ROLE_PROFILE;
const href: string = Paths.PATH_PROFILE;

function Profile() {
  const navigate = useNavigate();
  const { primaryRole, userInfo } = useKeycloak();

  const handleBackToRole = () => {
    if (primaryRole) {
      const targetRoute = getRouteForRole(primaryRole);
      if (targetRoute) {
        navigate(targetRoute);
      }
    }
  };

  // Get the user's name from Keycloak, with fallbacks
  const displayName = String(
    userInfo?.name || userInfo?.preferred_username || "Utilizador"
  );

  return (
    <>
      <Header role={role} href={href} />

      <div className="d-grid gap-2 col-6 mx-auto mt-4">
        {primaryRole && (
          <button
            type="button"
            className="btn btn-primary mb-3"
            onClick={handleBackToRole}
            style={{ justifySelf: "start" }}
          >
            <i className="bi bi-arrow-left me-2"></i>
            Voltar para {primaryRole}
          </button>
        )}
        <div className="row mb-4">
          <div className="card bg-light h-100">
            <div className="card-body">
              <h5 className="card-title text-end">
                <i className="bi bi-person-fill me-2 text-primary"></i>
                {primaryRole}
              </h5>
              <h4 className="text-end fw-bold text-dark">{displayName}</h4>
              <p className="text-end text-muted mb-1">
                {userInfo?.email ? (
                  <small>
                    <i className="bi bi-envelope me-1"></i>
                    {String(userInfo.email)}
                  </small>
                ) : null}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Profile;
