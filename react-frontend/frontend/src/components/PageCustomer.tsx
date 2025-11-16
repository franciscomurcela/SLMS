import Header from "./Header";
import Roles from "./UtilsRoles";
import Paths from "./UtilsPaths";
import { useKeycloak } from "../context/keycloakHooks";
import { useEffect, useState } from "react";
import { API_ENDPOINTS } from "../config/api.config";

const role: string = Roles.ROLE_CUSTOMER;
const href: string = Paths.PATH_CUSTOMER;

interface Order {
  orderId: string;
  customerId: string;
  customerName?: string;
  carrierId: string | null;
  originAddress: string;
  destinationAddress: string;
  weight: number;
  status: string;
  orderDate: string;
  departureDate?: string;
  arrivalDate?: string;
  shippingLabelId?: string;
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

function Customer() {
  const { primaryRole, userInfo, hasRole, keycloak } = useKeycloak();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showOrderHistory, setShowOrderHistory] = useState<boolean>(false);

  // Check if user has Customer role
  const isCustomer = hasRole("Customer");

  useEffect(() => {
    let mounted = true;

    async function loadOrders() {
      // Only load orders if user is a customer and history is being shown
      if (!isCustomer || !showOrderHistory || !keycloak?.tokenParsed?.sub) {
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const keycloakId = keycloak.tokenParsed.sub;
        
        // Use direct order service API endpoint
        const ordersResp = await fetch(`${API_ENDPOINTS.ORDERS}/my-orders/${keycloakId}`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${keycloak.token}`,
          },
        });
        
        if (!ordersResp.ok)
          throw new Error(`Orders fetch failed: ${ordersResp.status}`);
        const ordersData = await ordersResp.json();

        if (mounted) {
          setOrders(Array.isArray(ordersData) ? ordersData : []);
        }
      } catch (e) {
        console.error("Data fetch failed", e);
        if (mounted) setError(String(e));
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadOrders();
    return () => {
      mounted = false;
    };
  }, [isCustomer, showOrderHistory, keycloak]);

  // Get the user's name from Keycloak, with fallbacks
  const displayName = String(
    userInfo?.name || userInfo?.preferred_username || "Utilizador"
  );

  return (
    <>
      <Header role={role} href={href} />

      <div className="d-grid gap-2 col-6 mx-auto">
        <div className="row mb-4">
          <div className="card bg-light h-100">
            <div className="card-body">
              <h5 className="card-title text-end">
                <i className="bi bi-person-fill me-2 text-primary"></i>
                {primaryRole}
              </h5>
              <h4 className="text-end fw-bold text-dark">{displayName}</h4>
              <p className="text-end text-muted mb-1">
                {userInfo?.email ? (
                  <small>
                    <i className="bi bi-envelope me-1"></i>
                    {String(userInfo.email)}
                  </small>
                ) : null}
              </p>
            </div>
          </div>
        </div>

        {/* Button to show/hide Order History - Only visible for Customer role */}
        {isCustomer && (
          <div className="row mb-3">
            <div className="col">
              <button
                type="button"
                className="btn btn-primary w-100"
                onClick={() => setShowOrderHistory(!showOrderHistory)}
              >
                <i
                  className={`bi ${
                    showOrderHistory ? "bi-eye-slash" : "bi-clock-history"
                  } me-2`}
                ></i>
                {showOrderHistory
                  ? "Ocultar Histórico de Pedidos"
                  : "Ver Histórico de Pedidos"}
              </button>
            </div>
          </div>
        )}

        {/* Order History Section - Only visible when button is clicked */}
        {isCustomer && showOrderHistory && (
          <div className="row mb-4">
            <div className="card shadow-sm">
              <div className="card-header bg-primary text-white">
                <h5 className="mb-0">
                  <i className="bi bi-clock-history me-2"></i>
                  Histórico de Pedidos
                </h5>
              </div>
              <div className="card-body">
                {loading && (
                  <div
                    className="d-flex justify-content-center align-items-center"
                    style={{ minHeight: "200px" }}
                  >
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading orders...</span>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="alert alert-danger" role="alert">
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    <strong>Error:</strong> {error}
                  </div>
                )}

                {!loading && !error && orders.length === 0 && (
                  <div className="alert alert-info" role="alert">
                    <i className="bi bi-info-circle-fill me-2"></i>
                    Nenhum pedido encontrado.
                  </div>
                )}

                {!loading && !error && orders.length > 0 && (
                  <div className="list-group">
                    {orders.map((order) => (
                          <div
                            key={order.orderId}
                            className="list-group-item list-group-item-action"
                          >
                            <div className="d-flex w-100 justify-content-between align-items-start">
                              <div className="flex-grow-1">
                                <h6 className="mb-1">
                                  <i className="bi bi-box-seam me-2"></i>
                                  Pedido #{order.orderId.slice(0, 8)}
                                </h6>
                                <p className="mb-1">
                                  <small className="text-muted">
                                    <i className="bi bi-geo-alt me-1"></i>
                                    {order.originAddress}
                                    <i className="bi bi-arrow-right mx-2"></i>
                                    {order.destinationAddress}
                                  </small>
                                </p>
                                <p className="mb-1">
                                  <small className="text-muted">
                                    <i className="bi bi-calendar3 me-1"></i>
                                    {formatDate(order.orderDate)}
                                    <span className="mx-2">•</span>
                                    <i className="bi bi-box me-1"></i>
                                    {order.weight.toFixed(2)} kg
                                  </small>
                                </p>
                              </div>
                              <div className="text-end">
                                <span className={getStatusBadge(order.status)}>
                                  {order.status}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default Customer;
