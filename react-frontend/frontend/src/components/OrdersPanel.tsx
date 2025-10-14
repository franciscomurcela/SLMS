import { useEffect, useState } from "react";

interface Order {
  orderId: string;
  customerId: string;
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
  const [orders, setOrders] = useState<Order[]>([]);
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("All");

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        // Fetch orders
        const ordersResp = await fetch("/api/orders").catch(() => 
          fetch("http://localhost:8081/api/orders")
        );
        if (!ordersResp.ok) throw new Error(`Orders fetch failed: ${ordersResp.status}`);
        const ordersData = await ordersResp.json();
        
        // Fetch carriers
        const carriersResp = await fetch("/carriers").catch(() =>
          fetch("http://localhost:8080/carriers")
        );
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
  }, []);

  const getCarrierName = (carrierId: string | null): string => {
    if (!carrierId) return "Sem atribuição";
    const carrier = carriers.find((c) => c.carrier_id === carrierId);
    return carrier?.name || `Carrier #${carrierId.slice(0, 8)}`;
  };

  const downloadPackingSlip = async (orderId: string) => {
    try {
      const url = `/api/orders/${orderId}/packing-slip`;
      const resp = await fetch(url).catch(() =>
        fetch(`http://localhost:8081${url}`)
      );
      
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
                    <small>Cliente {order.customerId.slice(0, 8)}</small>
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
                        onClick={() => window.location.href = `/warehouse/process/${order.orderId}`}
                      >
                        <i className="bi bi-pencil-square me-1"></i>
                        Processar
                      </button>
                    )}
                    {(order.status === "InTransit" || order.status === "Delivered") && (
                      <button
                        className="btn btn-sm btn-success"
                        onClick={() => downloadPackingSlip(order.orderId)}
                      >
                        <i className="bi bi-download me-1"></i>
                        Packing Slip
                      </button>
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
