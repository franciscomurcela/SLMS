import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "./Header";
import Roles from "./UtilsRoles";
import Paths from "./UtilsPaths";

const role: string = Roles.ROLE_WAREHOUSE;
const href: string = Paths.PATH_WAREHOUSE;

interface Order {
  id: string;
  customerName: string;
  status: "Pendente" | "Despachado";
  orderDate: string;
  items: number;
  priority: "Normal" | "Urgente";
  destination: string;
}

// Dados de exemplo - substitua por dados reais do backend
const mockOrders: Order[] = [
  {
    id: "ORD001",
    customerName: "João Silva",
    status: "Pendente",
    orderDate: "2025-10-08",
    items: 3,
    priority: "Normal",
    destination: "Aveiro"
  },
  {
    id: "ORD002",
    customerName: "Maria Santos",
    status: "Pendente",
    orderDate: "2025-10-09",
    items: 7,
    priority: "Urgente",
    destination: "Porto"
  },
  {
    id: "ORD003",
    customerName: "Carlos Oliveira",
    status: "Despachado",
    orderDate: "2025-10-07",
    items: 2,
    priority: "Normal",
    destination: "Lisboa"
  },
  {
    id: "ORD004",
    customerName: "Ana Costa",
    status: "Pendente",
    orderDate: "2025-10-09",
    items: 5,
    priority: "Urgente",
    destination: "Coimbra"
  },
  {
    id: "ORD005",
    customerName: "Pedro Fernandes",
    status: "Despachado",
    orderDate: "2025-10-06",
    items: 1,
    priority: "Normal",
    destination: "Braga"
  },
  {
    id: "ORD006",
    customerName: "Sofia Ribeiro",
    status: "Pendente",
    orderDate: "2025-10-10",
    items: 4,
    priority: "Normal",
    destination: "Faro"
  }
];

function Warehouse() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<"Pendente" | "Despachado" | "Todos">("Todos");
  const [sortBy, setSortBy] = useState<"orderDate" | "priority" | "customerName">("orderDate");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Filtrar pedidos
  const filteredOrders = filter === "Todos" 
    ? mockOrders 
    : mockOrders.filter(order => order.status === filter);

  // Ordenar pedidos
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    // Se mostrar todos, pendentes primeiro
    if (filter === "Todos") {
      if (a.status !== b.status) {
        return a.status === "Pendente" ? -1 : 1;
      }
    }
    
    // Depois ordenar pelo critério selecionado
    if (sortBy === "orderDate") {
      return new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime(); // Mais recente primeiro
    } else if (sortBy === "priority") {
      // Urgente primeiro
      if (a.priority !== b.priority) {
        return a.priority === "Urgente" ? -1 : 1;
      }
      return new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime();
    } else {
      return a.customerName.localeCompare(b.customerName); // Alfabética
    }
  });

  const handleOrderClick = (order: Order) => {
    // Redirecionar para a página de detalhes do pedido
    navigate(`/warehouse/order/${order.id}`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-PT', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  };

  const handleSortChange = (newSortBy: "orderDate" | "priority" | "customerName") => {
    setSortBy(newSortBy);
    setIsDropdownOpen(false);
  };

  const getSortLabel = (sortType: string) => {
    switch(sortType) {
      case "orderDate": return "Data do Pedido";
      case "priority": return "Prioridade";
      case "customerName": return "Nome do Cliente";
      default: return "Data do Pedido";
    }
  };

  return (
    <>
      <Header role={role} href={href} />
      
      <div className="container mt-4">
        <div className="row">
          <div className="col-12">
            <h2 className="text-center mb-4" style={{color: '#2c3e50'}}>
              <i className="bi bi-box-seam me-2"></i>
              Gestão de Pedidos
            </h2>
            
            {/* Filtros e Ordenação */}
            <div className="row mb-4">
              <div className="col-md-6">
                <div className="d-flex justify-content-center justify-content-md-start">
                  <div className="btn-group" role="group">
                    <button
                      type="button"
                      className={`btn ${filter === "Pendente" ? "btn-warning" : "btn-outline-warning"}`}
                      onClick={() => setFilter("Pendente")}
                      style={{backgroundColor: filter === "Pendente" ? "#ffc107" : "transparent"}}
                    >
                      <i className="bi bi-clock me-1"></i>
                      Pendentes ({mockOrders.filter(o => o.status === "Pendente").length})
                    </button>
                    <button
                      type="button"
                      className={`btn ${filter === "Despachado" ? "btn-success" : "btn-outline-success"}`}
                      onClick={() => setFilter("Despachado")}
                      style={{backgroundColor: filter === "Despachado" ? "#28a745" : "transparent"}}
                    >
                      <i className="bi bi-check-circle me-1"></i>
                      Despachados ({mockOrders.filter(o => o.status === "Despachado").length})
                    </button>
                    <button
                      type="button"
                      className={`btn ${filter === "Todos" ? "btn-primary" : "btn-outline-primary"}`}
                      onClick={() => setFilter("Todos")}
                      style={{backgroundColor: filter === "Todos" ? "#007bff" : "transparent"}}
                    >
                      <i className="bi bi-list me-1"></i>
                      Todos ({mockOrders.length})
                    </button>
                  </div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="d-flex justify-content-center justify-content-md-end">
                  <div className="dropdown position-relative">
                    <button 
                      className="btn btn-outline-secondary dropdown-toggle" 
                      type="button" 
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      style={{minWidth: '200px'}}
                    >
                      <i className="bi bi-sort-down me-2"></i>
                      Ordenar por: {getSortLabel(sortBy)}
                    </button>
                    {isDropdownOpen && (
                      <ul 
                        className="dropdown-menu show position-absolute" 
                        style={{top: '100%', left: 0, zIndex: 1000}}
                      >
                        <li>
                          <button 
                            className={`dropdown-item ${sortBy === "orderDate" ? "active" : ""}`}
                            onClick={() => handleSortChange("orderDate")}
                          >
                            <i className="bi bi-calendar me-2"></i>
                            Data do Pedido
                          </button>
                        </li>
                        <li>
                          <button 
                            className={`dropdown-item ${sortBy === "priority" ? "active" : ""}`}
                            onClick={() => handleSortChange("priority")}
                          >
                            <i className="bi bi-exclamation-triangle me-2"></i>
                            Prioridade
                          </button>
                        </li>
                        <li>
                          <button 
                            className={`dropdown-item ${sortBy === "customerName" ? "active" : ""}`}
                            onClick={() => handleSortChange("customerName")}
                          >
                            <i className="bi bi-person me-2"></i>
                            Nome do Cliente
                          </button>
                        </li>
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Lista de Pedidos */}
            <div className="row">
              {sortedOrders.map((order) => (
                <div key={order.id} className="col-md-6 col-lg-4 mb-3">
                  <div 
                    className="card shadow-sm h-100" 
                    style={{
                      cursor: 'pointer', 
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      borderLeft: order.status === "Despachado" ? "4px solid #28a745" : 
                                 order.priority === "Urgente" ? "4px solid #dc3545" : "4px solid #ffc107"
                    }}
                    onClick={() => handleOrderClick(order)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.02)';
                      e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = '';
                    }}
                  >
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <h6 className="card-title text-primary mb-0" style={{ fontSize: "1.1rem", fontWeight: "bold" }}>
                          <i className="bi bi-hash me-1"></i>
                          {order.id}
                        </h6>
                        <div className="d-flex flex-column align-items-end">
                          <span className={`badge mb-1 ${
                            order.status === "Despachado" ? "bg-success" : "bg-warning text-dark"
                          }`}>
                            {order.status}
                          </span>
                          {order.priority === "Urgente" && (
                            <span className="badge bg-danger">
                              <i className="bi bi-exclamation-triangle-fill me-1"></i>
                              Urgente
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <p className="card-text mb-2" style={{ fontSize: "1.1rem", fontWeight: "bold" }}>
                        <i className="bi bi-person-fill me-2 text-primary"></i>
                        <strong>Cliente:</strong> {order.customerName}
                      </p>
                      
                      <p className="card-text mb-2">
                        <i className="bi bi-geo-alt-fill me-2 text-success"></i>
                        <strong>Destino:</strong> {order.destination}
                      </p>
                      
                      <div className="row mb-3">
                        <div className="col-6">
                          <small className="text-muted">
                            <i className="bi bi-calendar-event me-1"></i>
                            <strong>Data:</strong><br />
                            {formatDate(order.orderDate)}
                          </small>
                        </div>
                        <div className="col-6">
                          <small className="text-muted">
                            <i className="bi bi-box me-1"></i>
                            <strong>Items:</strong><br />
                            {order.items} produtos
                          </small>
                        </div>
                      </div>
                      
                      <button
                        className="btn btn-primary btn-sm w-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOrderClick(order);
                        }}
                        style={{
                          backgroundColor: "#007bff", 
                          borderColor: "#007bff",
                          fontSize: "1rem",
                          fontWeight: "bold"
                        }}
                      >
                        <i className="bi bi-eye me-2"></i>
                        Ver Detalhes
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {sortedOrders.length === 0 && (
              <div className="text-center mt-4">
                <div className="alert alert-info">
                  <i className="bi bi-info-circle-fill me-2"></i>
                  <h5>Nenhum pedido {filter.toLowerCase()} encontrado</h5>
                  <p className="mb-0">
                    {filter === "Pendente" 
                      ? "Todos os pedidos foram despachados!" 
                      : filter === "Despachado"
                      ? "Ainda não há pedidos despachados."
                      : "Não há pedidos no sistema."}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default Warehouse;
