import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Header from "./Header";
import Roles from "./UtilsRoles";
import Paths from "./UtilsPaths";

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

const role: string = Roles.ROLE_WAREHOUSE;
const href: string = Paths.PATH_WAREHOUSE;

export default function PageProcessOrder() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();

  const [order, setOrder] = useState<Order | null>(null);
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    originAddress: "",
    destinationAddress: "",
    weight: 0,
    carrierId: "",
  });

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        
        // Fetch order details
        const orderResp = await fetch(`/api/orders`).catch(() =>
          fetch(`http://localhost:8081/api/orders`)
        );
        if (!orderResp.ok) throw new Error("Failed to fetch orders");
        const orders: Order[] = await orderResp.json();
        const foundOrder = orders.find((o) => o.orderId === orderId);
        
        if (!foundOrder) {
          setError("Pedido não encontrado");
          return;
        }
        
        setOrder(foundOrder);
        setFormData({
          originAddress: foundOrder.originAddress,
          destinationAddress: foundOrder.destinationAddress,
          weight: foundOrder.weight,
          carrierId: foundOrder.carrierId || "",
        });

        // Fetch carriers
        const carriersResp = await fetch("/carriers").catch(() =>
          fetch("http://localhost:8080/carriers")
        );
        if (!carriersResp.ok) throw new Error("Failed to fetch carriers");
        const carriersData = await carriersResp.json();
        setCarriers(carriersData);
      } catch (e) {
        console.error("Load error:", e);
        setError(String(e));
      } finally {
        setLoading(false);
      }
    }

    if (orderId) loadData();
  }, [orderId]);

  const handleInputChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleDispatch = async () => {
    if (!order) return;
    
    // Validate carrier is selected
    if (!formData.carrierId) {
      alert("Por favor, selecione uma transportadora antes de despachar.");
      return;
    }

    setSubmitting(true);
    try {
      // Update order via PUT endpoint - only send updatable fields
      const updatePayload = {
        customerId: order.customerId,
        carrierId: formData.carrierId,
        originAddress: formData.originAddress,
        destinationAddress: formData.destinationAddress,
        weight: formData.weight,
        status: "InTransit", // Change to InTransit on dispatch
      };

      const resp = await fetch(`/api/orders/${order.orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatePayload),
      }).catch(() =>
        fetch(`http://localhost:8081/api/orders/${order.orderId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatePayload),
        })
      );

      if (!resp.ok) {
        const errorText = await resp.text();
        throw new Error(`Erro ao despachar: ${errorText}`);
      }

      // Successfully dispatched - navigate back to warehouse
      alert("✅ Pedido despachado com sucesso!");
      navigate(Paths.PATH_WAREHOUSE);
    } catch (e) {
      console.error("Dispatch error:", e);
      alert(`Erro ao despachar pedido: ${e}`);
    } finally {
      setSubmitting(false);
    }
  };

  const getCarrierName = (carrierId: string): string => {
    const carrier = carriers.find((c) => c.carrier_id === carrierId);
    return carrier?.name || "Desconhecido";
  };

  if (loading) {
    return (
      <>
        <Header role={role} href={href} />
        <div className="container mt-5 text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Carregando...</span>
          </div>
        </div>
      </>
    );
  }

  if (error || !order) {
    return (
      <>
        <Header role={role} href={href} />
        <div className="container mt-5">
          <div className="alert alert-danger">
            <strong>Erro:</strong> {error || "Pedido não encontrado"}
          </div>
          <button className="btn btn-secondary" onClick={() => navigate(href)}>
            Voltar
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <Header role={role} href={href} />
      <div className="container mt-4">
        <div className="row mb-4">
          <div className="col">
            <button
              className="btn btn-outline-secondary mb-3"
              onClick={() => navigate(href)}
            >
              ← Voltar
            </button>
            <h2>
              <i className="bi bi-box-seam me-2 text-primary"></i>
              Processar Pedido #{order.orderId.slice(0, 8)}
            </h2>
            <p className="text-muted">
              Edite as informações e atribua uma transportadora para despachar
            </p>
          </div>
        </div>

        <div className="card shadow">
          <div className="card-header bg-primary text-white">
            <h5 className="mb-0">Detalhes do Pedido</h5>
          </div>
          <div className="card-body">
            <form>
              {/* Order ID (read-only) */}
              <div className="mb-3 row">
                <label className="col-sm-3 col-form-label fw-bold">
                  ID do Pedido:
                </label>
                <div className="col-sm-9">
                  <input
                    type="text"
                    className="form-control-plaintext"
                    readOnly
                    value={order.orderId}
                  />
                </div>
              </div>

              {/* Customer ID (read-only) */}
              <div className="mb-3 row">
                <label className="col-sm-3 col-form-label fw-bold">
                  ID do Cliente:
                </label>
                <div className="col-sm-9">
                  <input
                    type="text"
                    className="form-control-plaintext"
                    readOnly
                    value={order.customerId}
                  />
                </div>
              </div>

              {/* Origin Address */}
              <div className="mb-3 row">
                <label className="col-sm-3 col-form-label fw-bold">
                  Endereço de Origem:
                </label>
                <div className="col-sm-9">
                  <input
                    type="text"
                    className="form-control"
                    value={formData.originAddress}
                    onChange={(e) =>
                      handleInputChange("originAddress", e.target.value)
                    }
                  />
                </div>
              </div>

              {/* Destination Address */}
              <div className="mb-3 row">
                <label className="col-sm-3 col-form-label fw-bold">
                  Endereço de Destino:
                </label>
                <div className="col-sm-9">
                  <input
                    type="text"
                    className="form-control"
                    value={formData.destinationAddress}
                    onChange={(e) =>
                      handleInputChange("destinationAddress", e.target.value)
                    }
                  />
                </div>
              </div>

              {/* Weight */}
              <div className="mb-3 row">
                <label className="col-sm-3 col-form-label fw-bold">
                  Peso (kg):
                </label>
                <div className="col-sm-9">
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    value={formData.weight}
                    onChange={(e) =>
                      handleInputChange("weight", parseFloat(e.target.value))
                    }
                  />
                </div>
              </div>

              {/* Carrier Dropdown */}
              <div className="mb-3 row">
                <label className="col-sm-3 col-form-label fw-bold">
                  Transportadora: <span className="text-danger">*</span>
                </label>
                <div className="col-sm-9">
                  <select
                    className="form-select"
                    value={formData.carrierId}
                    onChange={(e) =>
                      handleInputChange("carrierId", e.target.value)
                    }
                    required
                  >
                    <option value="">-- Selecione uma transportadora --</option>
                    {carriers.map((carrier) => (
                      <option key={carrier.carrier_id} value={carrier.carrier_id}>
                        {carrier.name} (Sucesso: {(carrier.success_rate * 100).toFixed(0)}
                        %, Pontualidade: {(carrier.on_time_rate * 100).toFixed(0)}%)
                      </option>
                    ))}
                  </select>
                  {formData.carrierId && (
                    <small className="text-muted">
                      Selecionado: {getCarrierName(formData.carrierId)}
                    </small>
                  )}
                </div>
              </div>

              {/* Status (read-only) */}
              <div className="mb-3 row">
                <label className="col-sm-3 col-form-label fw-bold">
                  Status Atual:
                </label>
                <div className="col-sm-9">
                  <span className="badge bg-warning text-dark fs-6">
                    {order.status}
                  </span>
                  <small className="text-muted d-block mt-1">
                    Após despachar, o status mudará para "InTransit"
                  </small>
                </div>
              </div>

              {/* Order Date (read-only) */}
              <div className="mb-3 row">
                <label className="col-sm-3 col-form-label fw-bold">
                  Data do Pedido:
                </label>
                <div className="col-sm-9">
                  <input
                    type="text"
                    className="form-control-plaintext"
                    readOnly
                    value={new Date(order.orderDate).toLocaleString("pt-PT")}
                  />
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="d-flex justify-content-end gap-3 mt-4 mb-5">
          <button
            className="btn btn-secondary btn-lg"
            onClick={() => navigate(href)}
            disabled={submitting}
          >
            Cancelar
          </button>
          <button
            className="btn btn-success btn-lg"
            onClick={handleDispatch}
            disabled={submitting || !formData.carrierId}
          >
            {submitting ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" />
                Despachando...
              </>
            ) : (
              <>
                <i className="bi bi-send-check me-2"></i>
                Despachar Pedido
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
}
