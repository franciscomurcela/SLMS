import Header from "./Header";
import qr_code from "../assets/qr_code.svg";
import map from "../assets/map.svg";
import { useNavigate } from "react-router-dom";
import Paths from "./UtilsPaths";
import ChatAssistant from "./ChatAssistant";
import { useKeycloak } from "../context/keycloakHooks";
import { useState, useEffect } from "react";
import { API_ENDPOINTS } from "../config/api.config";

const role: string = "Driver";

function Driver() {
  const navigate = useNavigate();
  const { keycloak } = useKeycloak();
  const [deliveryCount, setDeliveryCount] = useState<number | undefined>(
    undefined
  );

  // Fetch delivery count for the driver
  useEffect(() => {
    const fetchDeliveryCount = async () => {
      if (!keycloak?.token || !keycloak?.tokenParsed?.sub) return;

      try {
        const response = await fetch(
          `${API_ENDPOINTS.SHIPMENTS}/my-shipments/${keycloak.tokenParsed.sub}`,
          {
            headers: {
              Authorization: `Bearer ${keycloak.token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (response.ok) {
          const shipments = await response.json();
          const total = shipments.reduce(
            (sum: number, shipment: any) =>
              sum + (shipment.orders?.length || 0),
            0
          );
          setDeliveryCount(total);
        }
      } catch (error) {
        console.error("Error fetching delivery count:", error);
      }
    };

    fetchDeliveryCount();
  }, [keycloak?.token, keycloak?.tokenParsed?.sub]);

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

      {/* Chat Assistant */}
      <ChatAssistant
        authToken={keycloak?.token}
        customerId={keycloak?.tokenParsed?.sub}
        userRole={role}
        deliveryCount={deliveryCount}
      />
    </>
  );
}

export default Driver;
