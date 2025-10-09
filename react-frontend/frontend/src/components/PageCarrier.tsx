import Header from "./Header";
import qr_code from "../assets/qr_code.svg";
import map from "../assets/map.svg";
import { Navigate } from "react-router-dom";
import { useState } from "react";
import Roles from "./UtilsRoles";
import Paths from "./UtilsPaths";

const role: string = Roles.ROLE_CARRIER;
const href: string = Paths.PATH_CARRIER;

function Carrier() {
  const [goToCargoManifest, setGoToCargoManifest] = useState(false);
  const [goToTrackingPortal, setGoToTrackingPortal] = useState(false);
  const [goToProfile, setGoToProfile] = useState(false);

  if (goToCargoManifest) {
    return <Navigate to={Paths.PATH_CARRIER_CARGO_MANIFEST} />;
  }
  if (goToTrackingPortal) {
    return <Navigate to={Paths.PATH_TRACKING_PORTAL} />;
  }
  if (goToProfile) {
    return <Navigate to={Paths.PATH_PROFILE} />;
  }

  return (
    <>
      <Header role={role} href={href} />

      <div className="container text-center">
        <div className="row">
          <div className="col">
            <div className="d-grid gap-2 col-6 mx-auto">
              <button
                className="btn btn-primary"
                type="button"
                onClick={() => {
                  setGoToCargoManifest(true);
                }}
              >
                Manifesto de Carga
              </button>
              <button
                className="btn btn-primary"
                type="button"
                onClick={() => {
                  setGoToTrackingPortal(true);
                }}
              >
                Scan QR code
                <figure className="figure">
                  <img
                    src={qr_code}
                    className="figure-img img-fluid rounded"
                    width="500"
                  ></img>
                </figure>
              </button>
            </div>
          </div>
          <div className="col">
            <div className="d-grid gap-2 col-6 mx-auto">
              <button
                className="btn btn-primary"
                type="button"
                onClick={() => {
                  setGoToProfile(true);
                }}
              >
                Profile
              </button>
              <button className="btn btn-primary" type="button">
                Mapa Rota
                <figure className="figure">
                  <img
                    src={map}
                    className="figure-img img-fluid rounded"
                    width="500"
                  ></img>
                </figure>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Carrier;
