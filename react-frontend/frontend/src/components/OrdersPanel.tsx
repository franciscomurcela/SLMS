import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useKeycloak } from "../context/keycloakHooks";
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
}

interface Carrier {
  carrier_id: string;
  name: string;
  avg_cost: number;
  on_time_rate: number;
  success_rate: number;
}

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
  const [orders, setOrders] = useState<Order[]>([]);
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("All");

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      // Wait for Keycloak to be ready
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
        
        if (mounted) {
          setOrders(Array.isArray(ordersData) ? ordersData : []);
          setCarriers(Array.isArray(carriersData) ? carriersData : []);
        }
      } catch (e) {
        console.error("Data fetch failed", e);
        if (mounted) setError(String(e));
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadData();
    return () => {
      mounted = false;
    };
  }, [keycloak]);

  const getCarrierName = (carrierId: string | null): string => {
    if (!carrierId) return "Sem atribuição";
    const carrier = carriers.find((c) => c.carrier_id === carrierId);
    return carrier?.name || `Carrier #${carrierId.slice(0, 8)}`;
  };

  const downloadPackingSlip = async (orderId: string) => {
    try {
      const url = `${API_ENDPOINTS.ORDERS}/${orderId}/packing-slip`;
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
      const url = `${API_ENDPOINTS.ORDERS}/${orderId}/shipping-label`;
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
        {/* Status Filter Buttons */}
        <div className="btn-group mb-3" role="group" aria-label="Order status filter">
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
                      <span className="badge bg-info text-dark">
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
                    {order.status !== "Pending" && order.status !== "InTransit" && order.status !== "Delivered" && (
                      <span className="text-muted">—</span>
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
