import { useState } from "react";
import Header from "./Header";
import Roles from "./UtilsRoles";
import Paths from "./UtilsPaths";
import { useNavigate } from "react-router-dom";
import { useKeycloak } from "../context/keycloakHooks";
import { getRouteForRole } from "../config/roles.config";
import { API_ENDPOINTS } from "../config/api.config";
import "./TrackingPortal.css";

const role: string = Roles.ROLE_TRACKING_PORTAL;
const href: string = Paths.PATH_TRACKING_PORTAL;

interface TrackingResult {
  trackingId: string;
  orderDate: string;
  originAddress: string;
  destinationAddress: string;
  weight: number;
  status: string;
  shipmentId: string | null;
  actualDeliveryTime: string | null;
  proofOfDelivery: string | null;
  carrierName: string | null;
  carrierId: string | null;
  errorMessage: string | null;
}

function TrackingPortal() {
  const navigate = useNavigate();
  const { primaryRole, keycloak } = useKeycloak();
  const [trackingId, setTrackingId] = useState("");
  const [trackingResult, setTrackingResult] = useState<TrackingResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleBackToRole = () => {
    if (primaryRole) {
      const targetRoute = getRouteForRole(primaryRole);
      if (targetRoute) {
        navigate(targetRoute);
      }
    }
  };

  const handleSearch = async () => {
    if (!trackingId.trim()) {
      setError("Por favor, insira um Tracking ID válido");
      return;
    }

    setLoading(true);
    setError(null);
    setTrackingResult(null);

    try {
      const response = await fetch(
        `${API_ENDPOINTS.ORDERS}/track/${trackingId.trim()}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${keycloak?.token}`,
          },
        }
      );

      if (response.status === 404) {
        setError("Encomenda não encontrada. Verifique o Tracking ID.");
        return;
      }

      if (!response.ok) {
        throw new Error("Erro ao procurar encomenda");
      }

      const data = await response.json();
      setTrackingResult(data);
    } catch (err) {
      setError("Erro ao procurar encomenda. Tente novamente.");
      console.error("Tracking error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("pt-PT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    const statusMap: { [key: string]: { class: string; text: string } } = {
      Pending: { class: "bg-warning", text: "Pendente" },
      InTransit: { class: "bg-info", text: "Em Trânsito" },
      Delivered: { class: "bg-success", text: "Entregue" },
      Cancelled: { class: "bg-danger", text: "Cancelada" },
      Failed: { class: "bg-danger", text: "Falhada" },
    };

    const statusInfo = statusMap[status] || { class: "bg-secondary", text: status };
    return <span className={`badge ${statusInfo.class}`}>{statusInfo.text}</span>;
  };

  return (
    <>
      <Header role={role} href={href} />
      <div className="tracking-portal-container">
        {primaryRole && (
          <button
            type="button"
            className="btn btn-primary back-button"
            onClick={handleBackToRole}
          >
            <i className="bi bi-arrow-left me-2"></i>
            Voltar para {primaryRole}
          </button>
        )}

        <div className="tracking-search-card">
          <div className="tracking-header">
            <i className="bi bi-box-seam tracking-icon"></i>
            <h2>Portal de Rastreamento</h2>
            <p className="text-muted">
              Acompanhe sua encomenda em tempo real
            </p>
          </div>

          <div className="search-section">
            <label htmlFor="trackingInput" className="form-label">
              Tracking ID
            </label>
            <div className="input-group mb-3">
              <span className="input-group-text">
                <i className="bi bi-search"></i>
              </span>
              <input
                id="trackingInput"
                type="text"
                className="form-control form-control-lg"
                placeholder="ex. 123e4567-e89b-12d3-a456-426614174000"
                value={trackingId}
                onChange={(e) => setTrackingId(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={loading}
              />
              <button
                className="btn btn-primary btn-lg"
                type="button"
                onClick={handleSearch}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                      aria-hidden="true"
                    ></span>
                    Procurando...
                  </>
                ) : (
                  <>
                    <i className="bi bi-search me-2"></i>
                    Procurar
                  </>
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="alert alert-danger" role="alert">
              <i className="bi bi-exclamation-triangle me-2"></i>
              {error}
            </div>
          )}

          {trackingResult && (
            <div className="tracking-result">
              <div className="result-header">
                <h4>Informações da Encomenda</h4>
                {getStatusBadge(trackingResult.status)}
              </div>

              <div className="row g-3">
                {/* Tracking Info */}
                <div className="col-md-6">
                  <div className="info-card">
                    <div className="info-icon bg-primary">
                      <i className="bi bi-upc-scan"></i>
                    </div>
                    <div className="info-content">
                      <small className="text-muted">Tracking ID</small>
                      <p className="mb-0 fw-semibold">{trackingResult.trackingId}</p>
                    </div>
                  </div>
                </div>

                {/* Order Date */}
                <div className="col-md-6">
                  <div className="info-card">
                    <div className="info-icon bg-info">
                      <i className="bi bi-calendar-event"></i>
                    </div>
                    <div className="info-content">
                      <small className="text-muted">Data do Pedido</small>
                      <p className="mb-0 fw-semibold">{formatDate(trackingResult.orderDate)}</p>
                    </div>
                  </div>
                </div>

                {/* Shipment ID */}
                {trackingResult.shipmentId && (
                  <div className="col-md-6">
                    <div className="info-card">
                      <div className="info-icon bg-success">
                        <i className="bi bi-truck"></i>
                      </div>
                      <div className="info-content">
                        <small className="text-muted">Shipment ID</small>
                        <p className="mb-0 fw-semibold">{trackingResult.shipmentId}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Carrier */}
                <div className="col-md-6">
                  <div className="info-card">
                    <div className="info-icon bg-warning">
                      <i className="bi bi-building"></i>
                    </div>
                    <div className="info-content">
                      <small className="text-muted">Transportadora</small>
                      <p className="mb-0 fw-semibold">
                        {trackingResult.carrierName || "Não atribuído"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Weight */}
                <div className="col-md-6">
                  <div className="info-card">
                    <div className="info-icon bg-secondary">
                      <i className="bi bi-box"></i>
                    </div>
                    <div className="info-content">
                      <small className="text-muted">Peso</small>
                      <p className="mb-0 fw-semibold">{trackingResult.weight} kg</p>
                    </div>
                  </div>
                </div>

                {/* Delivery Time */}
                {trackingResult.actualDeliveryTime && (
                  <div className="col-md-6">
                    <div className="info-card">
                      <div className="info-icon bg-success">
                        <i className="bi bi-check-circle"></i>
                      </div>
                      <div className="info-content">
                        <small className="text-muted">Entregue em</small>
                        <p className="mb-0 fw-semibold">
                          {formatDate(trackingResult.actualDeliveryTime)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Addresses Section */}
              <div className="addresses-section mt-4">
                <h5 className="mb-3">
                  <i className="bi bi-geo-alt me-2"></i>Endereços
                </h5>
                <div className="row g-3">
                  <div className="col-md-6">
                    <div className="address-card">
                      <div className="address-label">
                        <i className="bi bi-box-arrow-up-right me-2"></i>
                        Origem
                      </div>
                      <p className="address-text">{trackingResult.originAddress}</p>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="address-card">
                      <div className="address-label">
                        <i className="bi bi-box-arrow-in-down-right me-2"></i>
                        Destino
                      </div>
                      <p className="address-text">{trackingResult.destinationAddress}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Error Message for Failed Status */}
              {trackingResult.status === 'Failed' && trackingResult.errorMessage && (
                <div className="error-section mt-4">
                  <h5 className="mb-3">
                    <i className="bi bi-exclamation-triangle me-2"></i>Motivo da Falha
                  </h5>
                  <div className="alert alert-danger">
                    <div className="d-flex align-items-center">
                      <i className="bi bi-x-circle-fill me-2"></i>
                      <strong>{trackingResult.errorMessage}</strong>
                    </div>
                  </div>
                </div>
              )}

              {/* Proof of Delivery */}
              {trackingResult.proofOfDelivery && (
                <div className="pod-section mt-4">
                  <h5 className="mb-3">
                    <i className="bi bi-file-earmark-check me-2"></i>Comprovativo de Entrega
                  </h5>
                  <div className="alert alert-success">
                    <div className="d-flex flex-column align-items-center">
                      <img 
                        src={`data:image/png;base64,${trackingResult.proofOfDelivery}`}
                        alt="Comprovativo de Entrega"
                        className="img-fluid rounded border"
                        style={{ maxWidth: '400px', maxHeight: '300px' }}
                        onError={(e) => {
                          // If image fails to load, show as text (fallback)
                          e.currentTarget.style.display = 'none';
                          const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                          if (nextElement) nextElement.style.display = 'block';
                        }}
                      />
                      <p 
                        className="mb-0 mt-2" 
                        style={{ display: 'none', fontSize: '0.8em', color: '#666' }}
                      >
                        {trackingResult.proofOfDelivery.substring(0, 100)}...
                      </p>
                      <small className="text-muted mt-2">
                        <i className="bi bi-info-circle me-1"></i>
                        Comprovativo registado pelo motorista
                      </small>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default TrackingPortal;

