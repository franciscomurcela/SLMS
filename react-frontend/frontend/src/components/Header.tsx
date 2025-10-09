import { Navigate } from "react-router-dom";
import { useState } from "react";
import Roles from "./UtilsRoles";
import Paths from "./UtilsPaths";

function Header({ role, href }: { role: string; href: string }) {
  const [goToProfile, setGoToProfile] = useState(false);
  const [goToCarrier, setGoToCarrier] = useState(false);
  const [goToTrackingPortal, setGoToTrackingPortal] = useState(false);
  const [goToWarehouse, setGoToWarehouse] = useState(false);
  const [goToCustomerServiceRep, setGoToCustomerServiceRep] = useState(false);
  const [goToLogisticsManager, setGoToLogisticsManager] = useState(false);

  if (goToProfile && href != Paths.PATH_PROFILE) {
    return <Navigate to={Paths.PATH_PROFILE} />;
  }
  if (goToCarrier && href != Paths.PATH_CARRIER) {
    return <Navigate to={Paths.PATH_CARRIER} />;
  }
  if (goToTrackingPortal && href != Paths.PATH_TRACKING_PORTAL) {
    return <Navigate to={Paths.PATH_TRACKING_PORTAL} />;
  }
  if (goToWarehouse && href != Paths.PATH_WAREHOUSE) {
    return <Navigate to={Paths.PATH_WAREHOUSE} />;
  }
  if (goToCustomerServiceRep && href != Paths.PATH_CUSTOMER_SERVICE_REP) {
    return <Navigate to={Paths.PATH_CUSTOMER_SERVICE_REP} />;
  }

  if (goToLogisticsManager && href != Paths.PATH_LOGISTICS_MANAGER) {
    return <Navigate to={Paths.PATH_LOGISTICS_MANAGER} />;
  }

  return (
    <>
      <nav className="navbar navbar-expand-lg bg-body-tertiary">
        <div className="container-fluid">
          <a className="navbar-brand" href={href}>
            SLMS {role}
          </a>
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          onClick={() => {
            setGoToProfile(true);
          }}
        >
          {Roles.ROLE_PROFILE}
        </button>
        <button
          type="button"
          className="btn btn-success"
          onClick={() => {
            setGoToCarrier(true);
          }}
        >
          {Roles.ROLE_CARRIER}
        </button>
        <button
          type="button"
          className="btn btn-danger"
          onClick={() => {
            setGoToTrackingPortal(true);
          }}
        >
          {Roles.ROLE_TRACKING_PORTAL}
        </button>
        <button
          type="button"
          className="btn btn-warning"
          onClick={() => {
            setGoToCustomerServiceRep(true);
          }}
        >
          {Roles.ROLE_CUSTOMER_SERVICE_REP}
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => {
            setGoToWarehouse(true);
          }}
        >
          {Roles.ROLE_WAREHOUSE}
        </button>

        <button
          type="button"
          className="btn btn-info"
          onClick={() => {
            setGoToLogisticsManager(true);
          }}
        >
          {Roles.ROLE_LOGISTICS_MANAGER}
        </button>
      </nav>
    </>
  );
}

export default Header;
