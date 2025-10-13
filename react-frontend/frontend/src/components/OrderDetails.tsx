import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "./Header";
import Roles from "./UtilsRoles";
import Paths from "./UtilsPaths";

const role: string = Roles.ROLE_WAREHOUSE;

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  weight?: number;
  dimensions?: string;
}

interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  status: "Pendente" | "Despachado";
  orderDate: string;
  items: OrderItem[];
  priority: "Normal" | "Urgente";
  destination: {
    address: string;
    city: string;
    postalCode: string;
    country: string;
  };
  totalWeight: number;
  totalValue: number;
}

interface Carrier {
  id: string;
  name: string;
  logo: string;
  estimatedDays: string;
  price: number;
}

// Dados mock - substitua por dados reais do backend
const mockOrder: Order = {
  id: "ORD001",
  customerName: "João Silva",
  customerEmail: "joao.silva@email.com",
  customerPhone: "+351 912 345 678",
  status: "Pendente",
  orderDate: "2025-10-08",
  items: [
    { id: "ITEM001", name: "Smartphone Samsung Galaxy", quantity: 1, weight: 0.2, dimensions: "15x7x1 cm" },
    { id: "ITEM002", name: "Capa Protetora", quantity: 2, weight: 0.05, dimensions: "16x8x2 cm" },
    { id: "ITEM003", name: "Carregador USB-C", quantity: 1, weight: 0.1, dimensions: "10x5x3 cm" }
  ],
  priority: "Normal",
  destination: {
    address: "Rua das Flores, 123",
    city: "Aveiro",
    postalCode: "3800-123",
    country: "Portugal"
  },
  totalWeight: 0.45,
  totalValue: 299.99
};

const carriers: Carrier[] = [
  {
    id: "ups",
    name: "UPS",
    logo: "",
    estimatedDays: "1-2 dias úteis",
    price: 12.50
  },
  {
    id: "dhl",
    name: "DHL",
    logo: "",
    estimatedDays: "1-3 dias úteis",
    price: 15.75
  },
  {
    id: "ctt",
    name: "CTT",
    logo: "",
    estimatedDays: "2-4 dias úteis",
    price: 8.90
  }
];

function OrderDetails() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [selectedCarrier, setSelectedCarrier] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simular carregamento de dados do backend
    setTimeout(() => {
      if (orderId) {
        // Em produção, fazer fetch real dos dados do pedido
        setOrder({ ...mockOrder, id: orderId });
      }
      setIsLoading(false);
    }, 500);
  }, [orderId]);

  const handleCarrierChange = (carrierId: string) => {
    setSelectedCarrier(carrierId);
  };

  const handleDispatchOrder = () => {
    if (!selectedCarrier) {
      alert("Por favor, selecione uma transportadora antes de despachar.");
      return;
    }
    
    // Aqui seria implementada a lógica de despacho
    const carrier = carriers.find(c => c.id === selectedCarrier);
    alert(`Pedido ${orderId} despachado com sucesso via ${carrier?.name}!`);
    navigate("/warehouse");
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-PT', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  };

  const getSelectedCarrier = () => {
    return carriers.find(c => c.id === selectedCarrier);
  };

  if (isLoading) {
    return (
      <>
        <Header role={role} href={Paths.PATH_WAREHOUSE} />
        <div className="container mt-5">
          <div className="text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">A carregar...</span>
            </div>
            <p className="mt-3 text-muted">A carregar detalhes do pedido...</p>
          </div>
        </div>
      </>
    );
  }

  if (!order) {
    return (
      <>
        <Header role={role} href={Paths.PATH_WAREHOUSE} />
        <div className="container mt-5">
          <div className="alert alert-danger text-center">
            <h4>Pedido não encontrado</h4>
            <p>O pedido {orderId} não foi encontrado no sistema.</p>
            <button className="btn btn-primary" onClick={() => navigate("/warehouse")}>
              Voltar à Lista de Pedidos
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header role={role} href={Paths.PATH_WAREHOUSE} />
      
      <div className="container mt-4 mb-5">
        <div className="row">
          <div className="col-12">
            {/* Cabeçalho com botão de voltar */}
            <div className="d-flex align-items-center mb-4">
              <button 
                className="btn btn-outline-secondary me-3"
                onClick={() => navigate("/warehouse")}
              >
                <i className="bi bi-arrow-left me-2"></i>
                Voltar
              </button>
              <div className="flex-grow-1">
                <nav aria-label="breadcrumb">
                  <ol className="breadcrumb mb-0">
                    <li className="breadcrumb-item">
                      <a href="/warehouse" className="text-decoration-none">Pedidos</a>
                    </li>
                    <li className="breadcrumb-item active" aria-current="page">
                      Detalhes do Pedido {order.id}
                    </li>
                  </ol>
                </nav>
              </div>
            </div>

            {/* Cabeçalho Principal */}
            <div className="row mb-4">
              <div className="col-md-6">
                <div className="d-flex align-items-center">
                  <h1 className="display-4 fw-bold text-primary mb-0 me-3">
                    {order.id}
                  </h1>
                  <div>
                    <span className={`badge fs-6 ${
                      order.status === "Despachado" ? "bg-success" : 
                      order.priority === "Urgente" ? "bg-danger" : "bg-warning text-dark"
                    }`}>
                      {order.status}
                    </span>
                    {order.priority === "Urgente" && order.status === "Pendente" && (
                      <span className="badge bg-danger fs-6 ms-2">
                        <i className="bi bi-exclamation-triangle-fill me-1"></i>
                        Urgente
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-muted mb-2">
                  <i className="bi bi-calendar-event me-2"></i>
                  Pedido criado em {formatDate(order.orderDate)}
                </p>
              </div>
              <div className="col-md-6">
                <div className="card bg-light h-100">
                  <div className="card-body">
                    <h5 className="card-title text-end">
                      <i className="bi bi-person-fill me-2 text-primary"></i>
                      Cliente
                    </h5>
                    <h4 className="text-end fw-bold text-dark">{order.customerName}</h4>
                    <p className="text-end text-muted mb-1">
                      <i className="bi bi-envelope me-2"></i>
                      {order.customerEmail}
                    </p>
                    <p className="text-end text-muted mb-0">
                      <i className="bi bi-telephone me-2"></i>
                      {order.customerPhone}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Conteúdo Principal */}
            <div className="row">
              {/* Coluna Esquerda - Items e Transportadora */}
              <div className="col-lg-8 mb-4">
                {/* Lista de Items */}
                <div className="card shadow-sm mb-4">
                  <div className="card-header bg-primary text-white">
                    <h5 className="mb-0">
                      <i className="bi bi-box-seam me-2"></i>
                      Items do Pedido
                    </h5>
                  </div>
                  <div className="card-body">
                    <div className="table-responsive">
                      <table className="table table-hover mb-0">
                        <thead className="table-light">
                          <tr>
                            <th>Item</th>
                            <th className="text-center">Quantidade</th>
                            <th className="text-center">Peso</th>
                            <th className="text-center">Dimensões</th>
                          </tr>
                        </thead>
                        <tbody>
                          {order.items.map((item) => (
                            <tr key={item.id}>
                              <td>
                                <strong>{item.name}</strong>
                                <br />
                                <small className="text-muted">ID: {item.id}</small>
                              </td>
                              <td className="text-center">
                                <span className="badge bg-secondary fs-6">
                                  x{item.quantity}
                                </span>
                              </td>
                              <td className="text-center">
                                {item.weight ? `${item.weight} kg` : "N/A"}
                              </td>
                              <td className="text-center">
                                <small>{item.dimensions || "N/A"}</small>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="row mt-3 pt-3 border-top">
                      <div className="col-md-4">
                        <strong>Total de Items: </strong>
                        <span className="text-primary fs-5">
                          {order.items.reduce((total, item) => total + item.quantity, 0)}
                        </span>
                      </div>
                      <div className="col-md-4">
                        <strong>Peso Total: </strong>
                        <span className="text-success fs-5">{order.totalWeight} kg</span>
                      </div>
                      <div className="col-md-4">
                        <strong>Valor Total: </strong>
                        <span className="text-warning fs-5">€{order.totalValue}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Seleção de Transportadora */}
                <div className="card shadow-sm">
                  <div className="card-header bg-success text-white">
                    <h5 className="mb-0">
                      <i className="bi bi-truck me-2"></i>
                      Seleção de Transportadora
                    </h5>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      {carriers.map((carrier) => (
                        <div key={carrier.id} className="col-md-4 mb-3">
                          <div 
                            className={`card h-100 ${selectedCarrier === carrier.id ? 'border-success border-3' : ''}`}
                            style={{ cursor: 'pointer' }}
                            onClick={() => handleCarrierChange(carrier.id)}
                          >
                            <div className="card-body text-center">
                              <h6 className="card-title">{carrier.name}</h6>
                              <p className="card-text">
                                <small className="text-muted">{carrier.estimatedDays}</small>
                                <br />
                                <strong className="text-success">€{carrier.price}</strong>
                              </p>
                              {selectedCarrier === carrier.id && (
                                <i className="bi bi-check-circle-fill text-success fs-4"></i>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {selectedCarrier && (
                      <div className="alert alert-success mt-3">
                        <i className="bi bi-check-circle-fill me-2"></i>
                        <strong>Transportadora selecionada:</strong> {getSelectedCarrier()?.name} - 
                        Entrega em {getSelectedCarrier()?.estimatedDays} por €{getSelectedCarrier()?.price}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Coluna Direita - Documentos e Ações */}
              <div className="col-lg-4">
                {/* Informações de Destino */}
                <div className="card shadow-sm mb-4">
                  <div className="card-header bg-info text-white">
                    <h5 className="mb-0">
                      <i className="bi bi-geo-alt-fill me-2"></i>
                      Destino
                    </h5>
                  </div>
                  <div className="card-body">
                    <address className="mb-0">
                      <strong>{order.destination.address}</strong><br />
                      {order.destination.city}<br />
                      {order.destination.postalCode}<br />
                      {order.destination.country}
                    </address>
                  </div>
                </div>

                {/* Menu de Documentos */}
                <div className="card shadow-sm mb-4">
                  <div className="card-header bg-warning text-dark">
                    <h5 className="mb-0">
                      <i className="bi bi-file-earmark-text me-2"></i>
                      Documentos de Envio
                    </h5>
                  </div>
                  <div className="card-body">
                    <button 
                      className="btn btn-outline-warning w-100 mb-3"
                      type="button"
                      onClick={() => alert("Funcionalidade temporariamente indisponível")}
                      disabled={!selectedCarrier}
                    >
                      <i className="bi bi-download me-2"></i>
                      Gerar Documentos
                    </button>
                    
                    <div className="mb-2">
                      <label className="form-label d-flex align-items-center justify-content-between">
                        <span>
                          <i className="bi bi-file-earmark-text me-2"></i>
                          Notas de envio
                        </span>
                        <i className="bi bi-x text-muted"></i>
                      </label>
                    </div>
                    
                    <div className="mb-2">
                      <label className="form-label d-flex align-items-center justify-content-between">
                        <span>
                          <i className="bi bi-tag me-2"></i>
                          Etiquetas de envio
                        </span>
                        <i className="bi bi-x text-muted"></i>
                      </label>
                    </div>

                    {!selectedCarrier && (
                      <small className="text-muted mt-2 d-block">
                        Selecione uma transportadora para gerar documentos
                      </small>
                    )}
                  </div>
                </div>

                {/* Botão de Despacho */}
                <div className="card shadow-sm mt-4">
                  <div className="card-body text-center">
                    <button
                      className="btn btn-success btn-lg w-100 py-3"
                      onClick={handleDispatchOrder}
                      disabled={!selectedCarrier || order.status === "Despachado"}
                      style={{ fontSize: '1.2rem', fontWeight: 'bold', marginTop: '20px' }}
                    >
                      <i className="bi bi-send-fill me-2"></i>
                      {order.status === "Despachado" ? "Já Despachado" : "Despachar Encomenda"}
                    </button>
                    {!selectedCarrier && order.status === "Pendente" && (
                      <small className="text-muted d-block mt-2">
                        Selecione uma transportadora para despachar
                      </small>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default OrderDetails;