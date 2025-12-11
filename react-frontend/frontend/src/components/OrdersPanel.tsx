import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useKeycloak } from "../context/keycloakHooks";
import { useFeatureFlag } from "../context/featureFlagsHooks";
import { API_ENDPOINTS } from "../config/api.config";

interface Order {
  orderId: string;
  customerId: string;
  customerName?: string;  // Nome completo do cliente
  carrierId: string | null;
  originAddress: string;
  destinationAddress: string;
  weight: number;
  status: string;
  orderDate: string;
  errorMessage?: string | null;  // Mensagem de erro para pedidos Failed
}

interface Carrier {
  carrier_id: string;
  name: string;
  avg_cost: number;
  on_time_rate: number;
  success_rate: number;
}

const CARRIER_COLORS: Record<string, string> = {
  'FedEx': '#8a17eeff',
  'UPS': '#ebbe0aff',
  'DPD': '#D32F2F',
  'DHL': '#ff9d00ff'
};

function getStatusBadge(status: string) {
  const statusMap: Record<string, string> = {
    Pending: "warning",
    InTransit: "primary",
    Delivered: "success",
    Failed: "danger",
  };
  const variant = statusMap[status] || "secondary";
  return `badge bg-${variant}`;
}

function formatDate(dateString: string) {
  if (!dateString) return "—";
  const date = new Date(dateString);
  return date.toLocaleDateString("pt-PT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatWeight(weight: number) {
  if (!weight) return "—";
  return `${weight.toFixed(2)} kg`;
}

export default function OrdersPanel() {
  const { keycloak } = useKeycloak();
  const navigate = useNavigate();
  const isCreateShipmentEnabled = useFeatureFlag("wh-same-client-shipment");
  const [orders, setOrders] = useState<Order[]>([]);
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("All");

  const loadOrders = async () => {
    if (!keycloak || !keycloak.token || !keycloak.authenticated) {
      console.log("[OrdersPanel] Waiting for Keycloak...");
      setLoading(true);
      return;
    }

    console.log("[OrdersPanel] Keycloak ready, fetching orders with token");
    setLoading(true);
    setError(null);
    try {
      // Fetch orders with Authorization header
      const ordersResp = await fetch(API_ENDPOINTS.ORDERS, {
        headers: {
          'Authorization': `Bearer ${keycloak.token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!ordersResp.ok) throw new Error(`Orders fetch failed: ${ordersResp.status}`);
      const ordersData = await ordersResp.json();
      
      // Fetch carriers with Authorization header
      const carriersResp = await fetch(API_ENDPOINTS.CARRIERS, {
        headers: {
          'Authorization': `Bearer ${keycloak.token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!carriersResp.ok) throw new Error(`Carriers fetch failed: ${carriersResp.status}`);
      const carriersData = await carriersResp.json();
      
      setOrders(Array.isArray(ordersData) ? ordersData : []);
      setCarriers(Array.isArray(carriersData) ? carriersData : []);
    } catch (e) {
      console.error("Data fetch failed", e);
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keycloak]);

  const getCarrierName = (carrierId: string | null): string => {
    if (!carrierId) return "Sem atribuição";
    const carrier = carriers.find((c) => c.carrier_id === carrierId);
    return carrier?.name || `Carrier #${carrierId.slice(0, 8)}`;
  };

  const getCarrierColor = (carrierId: string | null): string => {
    if (!carrierId) return '#6c757d'; // secondary gray for no assignment
    const carrier = carriers.find((c) => c.carrier_id === carrierId);
    return carrier?.name ? (CARRIER_COLORS[carrier.name] || '#6f42c1') : '#6f42c1';
  };

  const downloadPackingSlip = async (orderId: string) => {
    try {
      const url = API_ENDPOINTS.PACKING_SLIP(orderId);
      const resp = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${keycloak?.token}`,
        }
      });
      
      if (!resp.ok) throw new Error("Failed to download packing slip");
      
      const blob = await resp.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `packing-slip-${orderId.slice(0, 8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (e) {
      console.error("Download error:", e);
      alert(`Erro ao fazer download: ${e}`);
    }
  };

  const downloadShippingLabel = async (orderId: string) => {
    try {
      const url = API_ENDPOINTS.SHIPPING_LABEL(orderId);
      const resp = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${keycloak?.token}`,
        }
      });
      
      if (!resp.ok) throw new Error("Failed to download shipping label");
      
      const blob = await resp.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `shipping-label-${orderId.slice(0, 8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (e) {
      console.error("Download error:", e);
      alert(`Erro ao fazer download da etiqueta: ${e}`);
    }
  };

  const handleReprocess = async (order: Order) => {
    if (!confirm(`Reprocessar o pedido #${order.orderId.slice(0, 8)}?\n\nIsto irá limpar a mensagem de erro e marcar o pedido como "Pending" novamente.`)) {
      return;
    }

    try {
      const updatePayload = {
        customerId: order.customerId,
        carrierId: null,  // Remove carrier assignment
        originAddress: order.originAddress,
        destinationAddress: order.destinationAddress,
        weight: order.weight,
        status: "Pending",
        errorMessage: null,  // Clear error message
      };

      const resp = await fetch(`${API_ENDPOINTS.ORDERS}/${order.orderId}`, {
        method: "PUT",
        headers: {
          'Authorization': `Bearer ${keycloak?.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatePayload),
      });

      if (!resp.ok) {
        const errorText = await resp.text();
        throw new Error(`Erro ao reprocessar: ${errorText}`);
      }

      alert("✅ Pedido reprocessado com sucesso! Status alterado para Pending.");
      // Reload orders to reflect changes
      loadOrders();
    } catch (e) {
      console.error("Reprocess error:", e);
      alert(`Erro ao reprocessar pedido: ${e}`);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "200px" }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading orders...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        <i className="bi bi-exclamation-triangle-fill me-2"></i>
        <strong>Error:</strong> {error}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="alert alert-info" role="alert">
        <i className="bi bi-info-circle-fill me-2"></i>
        Nenhum pedido encontrado.
      </div>
    );
  }

  const filteredOrders = filter === "All" 
    ? orders 
    : orders.filter((o) => o.status === filter);

  const statusCounts = {
    All: orders.length,
    Pending: orders.filter((o) => o.status === "Pending").length,
    InTransit: orders.filter((o) => o.status === "InTransit").length,
    Delivered: orders.filter((o) => o.status === "Delivered").length,
    Failed: orders.filter((o) => o.status === "Failed").length,
  };

  return (
    <div className="card shadow-sm">
      <div className="card-header bg-primary text-white">
        <h5 className="mb-0">
          <i className="bi bi-box-seam me-2"></i>
          Gestão de Pedidos
        </h5>
      </div>
      <div className="card-body">
        {/* Action Buttons */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div className="btn-group" role="group" aria-label="Order status filter">
            {["All", "Pending", "InTransit", "Delivered"].map((status) => (
              <button
                key={status}
                type="button"
                className={`btn ${filter === status ? "btn-primary" : "btn-outline-primary"}`}
                onClick={() => setFilter(status)}
              >
                {status === "All" ? "Todos" : status}{" "}
                <span className="badge bg-light text-dark">{statusCounts[status as keyof typeof statusCounts]}</span>
              </button>
            ))}
            <button
              type="button"
              className={`btn ${filter === "Failed" ? "btn-danger" : "btn-outline-danger"}`}
              onClick={() => setFilter("Failed")}
            >
              Failed{" "}
              <span className="badge bg-light text-dark">{statusCounts.Failed}</span>
            </button>
          </div>
          
          {isCreateShipmentEnabled && (
            <button
              className="btn btn-success"
              onClick={() => navigate("/warehouse/create-shipment")}
              disabled={statusCounts.Pending === 0}
              title={statusCounts.Pending === 0 ? "Nenhum pedido pendente disponível" : "Criar novo shipment"}
            >
              <i className="bi bi-truck me-2"></i>
              Criar Shipment
            </button>
          )}
        </div>

        {/* Orders Table */}
        <div className="table-responsive">
          <table className="table table-hover table-striped align-middle">
            <thead className="table-dark">
              <tr>
                <th>ID</th>
                <th>Cliente</th>
                <th>Transportadora</th>
                <th>Origem</th>
                <th>Destino</th>
                <th>Peso</th>
                <th>Status</th>
                <th>Data</th>
                <th>Ação</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.orderId}>
                  <td className="fw-bold">
                    <small>#{order.orderId.slice(0, 8)}</small>
                  </td>
                  <td>
                    {order.customerName ? (
                      <small>{order.customerName}</small>
                    ) : (
                      <small className="text-muted">Cliente {order.customerId.slice(0, 8)}</small>
                    )}
                  </td>
                  <td>
                    {order.carrierId ? (
                      <span 
                        className="badge"
                        style={{ 
                          backgroundColor: getCarrierColor(order.carrierId), 
                          color: '#ffffff' 
                        }}
                      >
                        {getCarrierName(order.carrierId)}
                      </span>
                    ) : (
                      <span className="badge bg-secondary">Sem atribuição</span>
                    )}
                  </td>
                  <td><small className="text-muted">{order.originAddress}</small></td>
                  <td><small className="text-muted">{order.destinationAddress}</small></td>
                  <td>{formatWeight(order.weight)}</td>
                  <td>
                    <span className={getStatusBadge(order.status)}>
                      {order.status}
                    </span>
                  </td>
                  <td><small>{formatDate(order.orderDate)}</small></td>
                  <td>
                    {order.status === "Pending" && (
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => navigate(`/warehouse/process/${order.orderId}`)}
                      >
                        <i className="bi bi-pencil-square me-1"></i>
                        Processar
                      </button>
                    )}
                    {order.status === "Failed" && (
                      <div className="d-flex flex-column gap-2">
                        {order.errorMessage && (
                          <div className="alert alert-danger mb-0 py-1 px-2" style={{ fontSize: '0.85rem' }}>
                            <i className="bi bi-exclamation-circle me-1"></i>
                            <strong>Erro:</strong> {order.errorMessage}
                          </div>
                        )}
                        <button
                          className="btn btn-sm btn-warning"
                          onClick={() => handleReprocess(order)}
                          title="Reprocessar pedido - volta a Pending"
                        >
                          <i className="bi bi-arrow-clockwise me-1"></i>
                          Reprocessar
                        </button>
                      </div>
                    )}
                    {(order.status === "InTransit" || order.status === "Delivered") && (
                      <div className="btn-group" role="group">
                        <button
                          className="btn btn-sm btn-success"
                          onClick={() => downloadPackingSlip(order.orderId)}
                          title="Download Packing Slip"
                        >
                          <i className="bi bi-file-text me-1"></i>
                          Packing Slip
                        </button>
                        <button
                          className="btn btn-sm btn-info"
                          onClick={() => downloadShippingLabel(order.orderId)}
                          title="Download Etiqueta de Envio"
                        >
                          <i className="bi bi-qr-code me-1"></i>
                          Etiqueta
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredOrders.length === 0 && (
          <div className="alert alert-warning text-center">
            Nenhum pedido com status "{filter}".
          </div>
        )}
      </div>
    </div>
  );
}
