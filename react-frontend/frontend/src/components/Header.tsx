import { Navigate } from "react-router-dom";
import { useState } from "react";
import Roles from "./UtilsRoles";
import Paths from "./UtilsPaths";
import { useKeycloak } from "../context/keycloakHooks";
import { NotificationBell } from "./NotificationBell";

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
      <nav className="navbar navbar-expand-lg shadow-sm" style={{ backgroundColor: '#fff', borderBottom: '2px solid #e9ecef' }}>
        <div className="container-fluid px-4">
          <a className="navbar-brand fw-bold d-flex align-items-center" href={href} style={{ fontSize: '1.5rem', color: '#2c3e50' }}>
            <i className="bi bi-boxes me-2" style={{ fontSize: '1.8rem', color: '#0d6efd' }}></i>
            SLMS <span className="text-primary ms-1">{role}</span>
          </a>

          <div className="d-flex align-items-center gap-2">
            {showNavButtons && (
              <>
                <button
                  type="submit"
                  className="btn btn-outline-primary d-flex align-items-center gap-2"
                  onClick={() => {
                    setGoToProfile(true);
                  }}
                  style={{ minWidth: '100px', fontWeight: '500' }}
                >
                  <i className="bi bi-person-circle"></i>
                  {Roles.ROLE_PROFILE}
                </button>
                <button
                  type="button"
                  className="btn btn-danger d-flex align-items-center gap-2"
                  onClick={() => {
                    setGoToTrackingPortal(true);
                  }}
                  style={{ minWidth: '140px', fontWeight: '500' }}
                >
                  <i className="bi bi-geo-alt-fill"></i>
                  {Roles.ROLE_TRACKING_PORTAL}
                </button>
              </>
            )}

            {authenticated && (
              <>
                <div className="border-start ps-3 ms-2 me-3" style={{ height: '40px' }}>
                  <NotificationBell />
                </div>
                <button
                  type="button"
                  className="btn btn-outline-danger d-flex align-items-center justify-content-center"
                  onClick={logout}
                  title="Fazer logout"
                  style={{ width: '44px', height: '44px', padding: '0' }}
                >
                  <i className="bi bi-box-arrow-right" style={{ fontSize: '1.2rem' }}></i>
                </button>
              </>
            )}
          </div>
        </div>
      </nav>
    </>
  );
}

export default Header;
