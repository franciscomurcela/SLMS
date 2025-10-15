import Header from "./Header";
import Roles from "./UtilsRoles";
import Paths from "./UtilsPaths";
import { useNavigate } from "react-router-dom";
import type { Session } from "./InterfaceSession";
import { useState } from "react";
import { useKeycloak } from "../context/KeycloakContext";
import { getRouteForRole } from "../config/roles.config";

const role: string = Roles.ROLE_PROFILE;
const href: string = Paths.PATH_PROFILE;

const userRole: string = Roles.ROLE_CUSTOMER_SERVICE_REP;

const session: Session = {
  role: userRole,
  token: "askjdhasd-adadasd",
  name: "João Silva",
  email: "joaosilva@email.com",
};

function Profile() {
  const navigate = useNavigate();
  const { primaryRole } = useKeycloak();

  /* implementar keycloak */
  const [isLogout, setIsLogout] = useState(false);

  if (isLogout) {
    //clear session
    navigate(Paths.PATH_LOGIN);
  }

  const handleBackToRole = () => {
    if (primaryRole) {
      const targetRoute = getRouteForRole(primaryRole);
      if (targetRoute) {
        navigate(targetRoute);
      }
    }
  };

  return (
    <>
      <Header role={role} href={href} />

      <div className="d-grid gap-2 col-6 mx-auto">
        {primaryRole && (
          <button
            type="button"
            className="btn btn-primary mb-3"
            onClick={handleBackToRole}
            style={{ justifySelf: 'start' }}
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
                {userRole}
              </h5>
              <h4 className="text-end fw-bold text-dark">{session.name}</h4>
              <p className="text-end text-muted mb-1">
                <i className="bi bi-envelope me-2"></i>
                {session.email}
              </p>
              <button
                type="button"
                className="btn btn-danger btn-lg"
                onClick={() => setIsLogout(true)}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Profile;
