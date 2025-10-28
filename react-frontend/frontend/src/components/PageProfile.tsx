import Header from "./Header";
import Roles from "./UtilsRoles";
import Paths from "./UtilsPaths";
import { useNavigate } from "react-router-dom";
import { useKeycloak } from "../context/KeycloakContext";
import { getRouteForRole } from "../config/roles.config";
import { useEffect, useState } from "react";

const role: string = Roles.ROLE_PROFILE;
const href: string = Paths.PATH_PROFILE;

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

function Profile() {
  const navigate = useNavigate();
  const { primaryRole, userInfo, hasRole } = useKeycloak();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user has Customer role
  const isCustomer = hasRole("Customer");

  useEffect(() => {
    let mounted = true;

    async function loadOrders() {
      // Only load orders if user is a customer
      if (!isCustomer) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const ordersResp = await fetch("/api/orders").catch(() =>
          fetch("http://localhost:8081/api/orders")
        );
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
  }, [isCustomer]);

  const handleBackToRole = () => {
    if (primaryRole) {
      const targetRoute = getRouteForRole(primaryRole);
      if (targetRoute) {
        navigate(targetRoute);
      }
    }
  };

  // Get the user's name from Keycloak, with fallbacks
  const displayName =
    userInfo?.name || userInfo?.preferred_username || "Utilizador";

  return (
    <>
      <Header role={role} href={href} />

      <div className="d-grid gap-2 col-6 mx-auto">
        {primaryRole && (
          <button
            type="button"
            className="btn btn-primary mb-3"
            onClick={handleBackToRole}
            style={{ justifySelf: "start" }}
          >
            <i className="bi bi-arrow-left me-2"></i>
            Voltar para {primaryRole}
          </button>
        )}
        <div className="row mb-4">
          <div className="card bg-light h-100">
            <div className="card-body">
              <h5 className="card-title text-end">
                <i className="bi bi-person-fill me-2 text-primary"></i>
                {primaryRole}
              </h5>
              <h4 className="text-end fw-bold text-dark">{displayName}</h4>
              <p className="text-end text-muted mb-1">
                {userInfo?.email && (
                  <small>
                    <i className="bi bi-envelope me-1"></i>
                    {userInfo.email}
                  </small>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Order History Section - Only visible for Customer role */}
        {isCustomer && (
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

                {!loading &&
                  !error &&
                  orders.filter(
                    (order) =>
                      order.status === "Delivered" || order.status === "Pending"
                  ).length === 0 && (
                    <div className="alert alert-info" role="alert">
                      <i className="bi bi-info-circle-fill me-2"></i>
                      Nenhum pedido encontrado.
                    </div>
                  )}

                {!loading &&
                  !error &&
                  orders.filter(
                    (order) =>
                      order.status === "Delivered" || order.status === "Pending"
                  ).length > 0 && (
                    <div className="list-group">
                      {orders
                        .filter(
                          (order) =>
                            order.status === "Delivered" ||
                            order.status === "Pending"
                        )
                        .map((order) => (
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

export default Profile;
