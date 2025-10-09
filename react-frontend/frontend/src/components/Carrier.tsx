import Header from "./Header";
import qr_code from "../assets/qr_code.svg";
import map from "../assets/map.svg";

const role: string = "Carrier";

function Carrier() {
  return (
    <>
      <Header role={role} />

      <div className="container text-center">
        <div className="row">
          <div className="col">
            <div className="d-grid gap-2 col-6 mx-auto">
              <button className="btn btn-primary" type="button">
                Manifesto de Carga
              </button>
              <button className="btn btn-primary" type="button">
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
              <button className="btn btn-primary" type="button">
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
