import { useState } from "react";
import { useKeycloak } from "../context/KeycloakContext";
import { useFeatureFlags } from "../context/FeatureFlagsContext";
import { API_ENDPOINTS } from "../config/api.config";
import "./TrackingPortal.css";

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
}

interface OrderStep {
  id: number;
  label: string;
  icon: string;
  status: 'completed' | 'active' | 'pending';
  date?: string;
}

function TrackingPortalCSR() {
  const { keycloak } = useKeycloak();
  const { isFeatureEnabled } = useFeatureFlags();
  const [trackingId, setTrackingId] = useState("");
  const [trackingResult, setTrackingResult] = useState<TrackingResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Feature flag para histórico de pedidos
  const showOrderHistory = isFeatureEnabled('csr-order-history');

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
      Assigned: { class: "bg-info", text: "Despachado" },
      Dispatched: { class: "bg-info", text: "Despachado" },
      InTransit: { class: "bg-primary", text: "Em Trânsito" },
      Delivered: { class: "bg-success", text: "Entregue" },
      Failed: { class: "bg-danger", text: "Falhada" },
      Cancelled: { class: "bg-danger", text: "Cancelada" },
    };

    const statusInfo = statusMap[status] || { class: "bg-secondary", text: status };
    return <span className={`badge ${statusInfo.class}`}>{statusInfo.text}</span>;
  };

  const getOrderSteps = (status: string, orderDate: string, actualDeliveryTime: string | null): OrderStep[] => {
    // If order failed/cancelled, show different timeline
    if (status === 'Failed' || status === 'Cancelled') {
      return [
        {
          id: 1,
          label: "Pedido Criado",
          icon: "bi-box-seam",
          status: "completed",
          date: formatDate(orderDate),
        },
        {
          id: 2,
          label: status === 'Failed' ? "Falhou" : "Cancelada",
          icon: "bi-x-circle",
          status: "completed",
          date: status === 'Failed' ? "Entrega falhada" : "Pedido cancelado",
        },
      ];
    }

    // Determine step statuses based on current order status
    // Note: "Assigned" is equivalent to "Dispatched" in the schema
    const isPending = status === 'Pending';
    const isDispatched = status === 'Dispatched' || status === 'Assigned';
    const isInTransit = status === 'InTransit';
    const isDelivered = status === 'Delivered';

    // Normal timeline with all steps
    const steps: OrderStep[] = [
      {
        id: 1,
        label: "Pedido Criado",
        icon: "bi-box-seam",
        status: isPending ? "active" : "completed",
        date: formatDate(orderDate),
      },
      {
        id: 2,
        label: "Despachado",
        icon: "bi-send-check",
        status: isPending ? "pending" : isDispatched ? "active" : "completed",
        date: !isPending ? "Preparado para envio" : undefined,
      },
      {
        id: 3,
        label: "Em Trânsito",
        icon: "bi-truck",
        status: (isPending || isDispatched) ? "pending" : isInTransit ? "active" : "completed",
        date: (isInTransit || isDelivered) ? "A caminho do destino" : undefined,
      },
      {
        id: 4,
        label: "Entregue",
        icon: "bi-check-circle",
        status: isDelivered ? "completed" : "pending",
        date: actualDeliveryTime ? formatDate(actualDeliveryTime) : undefined,
      },
    ];

    return steps;
  };

  return (
    <div className="tracking-portal-container">
      <div className="tracking-search-card">
        <div className="tracking-header">
          <i className="bi bi-box-seam tracking-icon"></i>
          <h2>Portal de Rastreamento</h2>
          <p className="text-muted">
            Acompanhe encomendas em tempo real
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

            {/* Order Timeline - FIRST (only if feature flag is enabled) */}
            {showOrderHistory && (
              <div className="order-timeline-section mb-4">
                <h5 className="mb-4">
                  <i className="bi bi-clock-history me-2"></i>Histórico do Pedido
                </h5>
                <div className="timeline-container">
                  {getOrderSteps(
                    trackingResult.status,
                    trackingResult.orderDate,
                    trackingResult.actualDeliveryTime
                  ).map((step, index, array) => (
                    <div key={step.id} className="timeline-step-wrapper">
                      <div className={`timeline-step ${step.status}`}>
                        <div className="step-icon-wrapper">
                          <div className={`step-icon ${step.status}`}>
                            <i className={`bi ${step.icon}`}></i>
                          </div>
                          {index < array.length - 1 && (
                            <div className={`step-line ${
                              trackingResult.status === 'Failed' && step.label === 'Pedido Criado' ? 'failed' :
                              array[index + 1].status !== 'pending' ? 'completed' : ''
                            }`}></div>
                          )}
                        </div>
                        <div className="step-content">
                          <h6 className="step-label">{step.label}</h6>
                          {step.date && (
                            <small className="step-date text-muted">
                              <i className="bi bi-calendar-event me-1"></i>
                              {step.date}
                            </small>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Informações da Encomenda */}
            <h5 className="mb-3 mt-4">
              <i className="bi bi-info-circle me-2"></i>Detalhes
            </h5>
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
          </div>
        )}
      </div>
    </div>
  );
}

export default TrackingPortalCSR;
