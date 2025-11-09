import Header from "./Header";
import qr_code from "../assets/qr_code.svg";
import map from "../assets/map.svg";
import { useNavigate } from "react-router-dom";
import Paths from "./UtilsPaths";

const role: string = "Driver";

function Driver() {
  const navigate = useNavigate();

  const handleManifestClick = () => {
    navigate("/driver/manifest");
  };

  return (
    <>
      <Header role={role} href={Paths.PATH_DRIVER} />

      <div className="container text-center">
        <div className="row">
          <div className="col">
            <div className="d-grid gap-2 col-6 mx-auto">
              <button
                className="btn btn-primary"
                type="button"
                onClick={handleManifestClick}
                style={{ backgroundColor: "#007bff", borderColor: "#007bff" }}
              >
                Manifesto de Carga
              </button>
              <button
                className="btn btn-primary"
                type="button"
                style={{ backgroundColor: "#007bff", borderColor: "#007bff" }}
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
                style={{ backgroundColor: "#007bff", borderColor: "#007bff" }}
              >
                Profile
              </button>
              <button
                className="btn btn-primary"
                type="button"
                style={{ backgroundColor: "#007bff", borderColor: "#007bff" }}
              >
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

export default Driver;
