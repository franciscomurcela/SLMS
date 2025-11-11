import { Navigate } from "react-router-dom";
import { useState } from "react";
import Roles from "./UtilsRoles";
import Paths from "./UtilsPaths";
import { useKeycloak } from "../context/keycloakHooks";

function Header({ 
  role, 
  href, 
  showNavButtons = true 
}: { 
  role: string; 
  href: string; 
  showNavButtons?: boolean;
}) {
  const { logout, authenticated } = useKeycloak();
  const [goToProfile, setGoToProfile] = useState(false);
  const [goToTrackingPortal, setGoToTrackingPortal] = useState(false);

  if (goToProfile && href != Paths.PATH_PROFILE) {
    return <Navigate to={Paths.PATH_PROFILE} />;
  }
  if (goToTrackingPortal && href != Paths.PATH_TRACKING_PORTAL) {
    return <Navigate to={Paths.PATH_TRACKING_PORTAL} />;
  }

  return (
    <>
      <nav className="navbar navbar-expand-lg bg-body-tertiary">
        <div className="container-fluid">
          <a className="navbar-brand" href={href}>
            SLMS {role}
          </a>
        </div>

        {showNavButtons && (
          <>
            <button
              type="submit"
              className="btn btn-primary"
              onClick={() => {
                setGoToProfile(true);
              }}
              style={{ minWidth: '120px', height: '38px' }}
            >
              {Roles.ROLE_PROFILE}
            </button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => {
                setGoToTrackingPortal(true);
              }}
              style={{ minWidth: '120px', height: '38px' }}
            >
              {Roles.ROLE_TRACKING_PORTAL}
            </button>
          </>
        )}

        {authenticated && (
          <button
            type="button"
            className="btn btn-danger ms-2"
            onClick={logout}
            title="Fazer logout do Keycloak"
          >
            <i className="bi bi-box-arrow-right me-1"></i>
            Logout
          </button>
        )}
      </nav>
    </>
  );
}

export default Header;
