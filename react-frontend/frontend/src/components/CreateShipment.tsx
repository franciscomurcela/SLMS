import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useKeycloak } from "../context/keycloakHooks";
import { API_ENDPOINTS } from "../config/api.config";
import Header from "./Header";
import Roles from "./UtilsRoles";
import Paths from "./UtilsPaths";
import "./CreateShipment.css";

const role: string = Roles.ROLE_WAREHOUSE;
const href: string = Paths.PATH_WAREHOUSE;

interface Order {
  orderId: string;
  customerId: string;
  customerName?: string;
  originAddress: string;
  destinationAddress: string;
  weight: number;
  status: string;
  orderDate: string;
  shipmentId?: string;
}

interface Carrier {
  carrier_id: string;
  name: string;
  avg_cost: number;
  on_time_rate: number;
  success_rate: number;
}

interface GroupedOrders {
  destination: string;
  orders: Order[];
  totalWeight: number;
}

function CreateShipment() {
  const { keycloak } = useKeycloak();
  const navigate = useNavigate();
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [selectedCarrierId, setSelectedCarrierId] = useState<string>("");
  const [groupByDestination, setGroupByDestination] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      if (!keycloak || !keycloak.token || !keycloak.authenticated) {
        console.log("[CreateShipment] Waiting for Keycloak...");
        setLoading(true);
        return;
      }

      console.log("[CreateShipment] Loading pending orders and carriers");
      setLoading(true);
      setError(null);
      
      try {
        // Fetch pending orders
        const ordersResp = await fetch(API_ENDPOINTS.ORDERS, {
          headers: {
            'Authorization': `Bearer ${keycloak.token}`,
            'Content-Type': 'application/json'
          }
        });
        if (!ordersResp.ok) throw new Error(`Orders fetch failed: ${ordersResp.status}`);
        const ordersData = await ordersResp.json();
        
        // Filter only Pending orders without shipment assignment
        const pendingOrders = (Array.isArray(ordersData) ? ordersData : [])
          .filter((order: Order) => order.status === "Pending" && !order.shipmentId);
        
        // Fetch carriers
        const carriersResp = await fetch(API_ENDPOINTS.CARRIERS, {
          headers: {
            'Authorization': `Bearer ${keycloak.token}`,
            'Content-Type': 'application/json'
          }
        });
        if (!carriersResp.ok) throw new Error(`Carriers fetch failed: ${carriersResp.status}`);
        const carriersData = await carriersResp.json();
        
        if (mounted) {
          setOrders(pendingOrders);
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

  const toggleOrderSelection = (orderId: string) => {
    const newSelected = new Set(selectedOrders);
    if (newSelected.has(orderId)) {
      newSelected.delete(orderId);
    } else {
      newSelected.add(orderId);
    }
    setSelectedOrders(newSelected);
  };

  const toggleGroupSelection = (groupOrders: Order[]) => {
    const groupOrderIds = groupOrders.map(o => o.orderId);
    const allSelected = groupOrderIds.every(id => selectedOrders.has(id));
    
    const newSelected = new Set(selectedOrders);
    if (allSelected) {
      // Deselect all in group
      groupOrderIds.forEach(id => newSelected.delete(id));
    } else {
      // Select all in group
      groupOrderIds.forEach(id => newSelected.add(id));
    }
    setSelectedOrders(newSelected);
  };

  const getGroupedOrders = (): GroupedOrders[] => {
    if (!groupByDestination) {
      return [{
        destination: "Todas as encomendas",
        orders: orders,
        totalWeight: orders.reduce((sum, o) => sum + o.weight, 0)
      }];
    }

    const grouped = new Map<string, Order[]>();
    orders.forEach(order => {
      const dest = order.destinationAddress;
      if (!grouped.has(dest)) {
        grouped.set(dest, []);
      }
      grouped.get(dest)!.push(order);
    });

    return Array.from(grouped.entries()).map(([destination, orders]) => ({
      destination,
      orders,
      totalWeight: orders.reduce((sum, o) => sum + o.weight, 0)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedOrders.size === 0) {
      alert("Por favor, selecione pelo menos uma encomenda.");
      return;
    }

    if (!selectedCarrierId) {
      alert("Por favor, selecione uma transportadora.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(API_ENDPOINTS.CREATE_SHIPMENT, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${keycloak?.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          orderIds: Array.from(selectedOrders),
          carrierId: selectedCarrierId
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert(`Shipment criado com sucesso! ID: ${data.shipmentId.slice(0, 8)}`);
        navigate("/warehouse");
      } else {
        throw new Error(data.message || 'Erro ao criar shipment');
      }
    } catch (e) {
      console.error('Erro ao criar shipment:', e);
      setError(String(e));
      alert(`Erro ao criar shipment: ${e}`);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-PT", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatWeight = (weight: number) => {
    if (!weight) return "—";
    return `${weight.toFixed(2)} kg`;
  };

  if (loading) {
    return (
      <>
        <Header role={role} href={href} />
        <main className="flex-grow-1 p-4" style={{ backgroundColor: "#f8f9fa" }}>
          <div className="container">
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "400px" }}>
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Carregando...</span>
              </div>
            </div>
          </div>
        </main>
      </>
    );
  }

  const groupedOrders = getGroupedOrders();
  const selectedOrdersList = orders.filter(o => selectedOrders.has(o.orderId));
  const totalWeight = selectedOrdersList.reduce((sum, o) => sum + o.weight, 0);

  return (
    <>
      <Header role={role} href={href} />
      <main className="flex-grow-1 p-4" style={{ backgroundColor: "#f8f9fa" }}>
        <div className="container-fluid">
          <div className="row mb-4">
            <div className="col">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h2 className="mb-0">
                    <i className="bi bi-truck me-2 text-success"></i>
                    Criar Novo Shipment
                  </h2>
                  <p className="text-muted">Selecione as encomendas e a transportadora</p>
                </div>
                <button
                  className="btn btn-outline-secondary"
                  onClick={() => navigate("/warehouse")}
                >
                  <i className="bi bi-arrow-left me-2"></i>
                  Voltar
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="alert alert-danger" role="alert">
              <i className="bi bi-exclamation-triangle-fill me-2"></i>
              <strong>Erro:</strong> {error}
            </div>
          )}

          {orders.length === 0 && (
            <div className="alert alert-info">
              <i className="bi bi-info-circle-fill me-2"></i>
              Não há encomendas pendentes disponíveis para criar shipment.
            </div>
          )}

          {orders.length > 0 && (
            <div className="row">
              {/* Orders Selection Panel */}
              <div className="col-lg-8">
                <div className="card shadow-sm mb-4">
                  <div className="card-header bg-primary text-white">
                    <div className="d-flex justify-content-between align-items-center">
                      <h5 className="mb-0">
                        <i className="bi bi-box-seam me-2"></i>
                        Encomendas Pendentes
                      </h5>
                      <div className="form-check form-switch">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="groupByDestSwitch"
                          checked={groupByDestination}
                          onChange={(e) => setGroupByDestination(e.target.checked)}
                        />
                        <label className="form-check-label text-white" htmlFor="groupByDestSwitch">
                          Agrupar por destino
                        </label>
                      </div>
                    </div>
                  </div>
                  <div className="card-body" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                    {groupedOrders.map((group, groupIdx) => (
                      <div key={groupIdx} className="mb-4">
                        {groupByDestination && (
                          <div className="d-flex justify-content-between align-items-center mb-3 p-3 bg-light rounded">
                            <div>
                              <h6 className="mb-1">
                                <i className="bi bi-geo-alt-fill text-danger me-2"></i>
                                {group.destination}
                              </h6>
                              <small className="text-muted">
                                {group.orders.length} encomenda(s) • {formatWeight(group.totalWeight)}
                              </small>
                            </div>
                            <button
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => toggleGroupSelection(group.orders)}
                            >
                              {group.orders.every(o => selectedOrders.has(o.orderId)) 
                                ? "Desselecionar Grupo" 
                                : "Selecionar Grupo"}
                            </button>
                          </div>
                        )}

                        <div className="list-group">
                          {group.orders.map((order) => (
                            <div
                              key={order.orderId}
                              className={`list-group-item list-group-item-action ${
                                selectedOrders.has(order.orderId) ? "active" : ""
                              }`}
                              style={{ cursor: "pointer" }}
                              onClick={() => toggleOrderSelection(order.orderId)}
                            >
                              <div className="d-flex w-100 justify-content-between align-items-center">
                                <div className="form-check">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                    checked={selectedOrders.has(order.orderId)}
                                    onChange={() => {}}
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                  <label className="form-check-label">
                                    <strong>#{order.orderId.slice(0, 8)}</strong>
                                    {order.customerName && (
                                      <span className="ms-2 text-muted">• {order.customerName}</span>
                                    )}
                                  </label>
                                </div>
                                <small className="text-muted">{formatWeight(order.weight)}</small>
                              </div>
                              {!groupByDestination && (
                                <p className="mb-1 mt-2 small">
                                  <i className="bi bi-geo-alt me-1"></i>
                                  {order.destinationAddress}
                                </p>
                              )}
                              <small className="text-muted">
                                <i className="bi bi-calendar me-1"></i>
                                {formatDate(order.orderDate)}
                              </small>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Shipment Configuration Panel */}
              <div className="col-lg-4">
                <div className="card shadow-sm sticky-top" style={{ top: '20px' }}>
                  <div className="card-header bg-success text-white">
                    <h5 className="mb-0">
                      <i className="bi bi-gear me-2"></i>
                      Configuração do Shipment
                    </h5>
                  </div>
                  <div className="card-body">
                    <form onSubmit={handleSubmit}>
                      {/* Summary */}
                      <div className="mb-4 p-3 bg-light rounded">
                        <h6 className="mb-3">Resumo</h6>
                        <div className="d-flex justify-content-between mb-2">
                          <span>Encomendas selecionadas:</span>
                          <strong>{selectedOrders.size}</strong>
                        </div>
                        <div className="d-flex justify-content-between">
                          <span>Peso total:</span>
                          <strong>{formatWeight(totalWeight)}</strong>
                        </div>
                      </div>

                      {/* Carrier Selection */}
                      <div className="mb-4">
                        <label htmlFor="carrierSelect" className="form-label fw-bold">
                          <i className="bi bi-building me-2"></i>
                          Transportadora *
                        </label>
                        <select
                          id="carrierSelect"
                          className="form-select"
                          value={selectedCarrierId}
                          onChange={(e) => setSelectedCarrierId(e.target.value)}
                          required
                        >
                          <option value="">Selecione uma transportadora</option>
                          {carriers.map((carrier) => (
                            <option key={carrier.carrier_id} value={carrier.carrier_id}>
                              {carrier.name} (On-time: {(carrier.on_time_rate * 100).toFixed(0)}%)
                            </option>
                          ))}
                        </select>
                        {selectedCarrierId && (
                          <small className="text-muted d-block mt-2">
                            <i className="bi bi-info-circle me-1"></i>
                            Um motorista desta transportadora será atribuído automaticamente
                          </small>
                        )}
                      </div>

                      {/* Info Alert */}
                      <div className="alert alert-info small">
                        <i className="bi bi-info-circle-fill me-2"></i>
                        O status inicial do shipment será <strong>"Pending"</strong>.
                        As datas de partida e chegada serão definidas posteriormente.
                      </div>

                      {/* Submit Button */}
                      <button
                        type="submit"
                        className="btn btn-success w-100"
                        disabled={submitting || selectedOrders.size === 0 || !selectedCarrierId}
                      >
                        {submitting ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Criando...
                          </>
                        ) : (
                          <>
                            <i className="bi bi-check-circle me-2"></i>
                            Criar Shipment
                          </>
                        )}
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}

export default CreateShipment;
