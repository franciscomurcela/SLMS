import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "./Header";
import map from "../assets/map.svg";
import Paths from "./UtilsPaths";

const role: string = "Driver";

interface Package {
  id: string;
  deliveryLocation: string;
  recipient: string;
  status: "Pendente" | "Entregue";
  details?: string;
  orderDate: string;
  distanceKm: number;
}

// Dados de exemplo - substitua por dados reais do backend
const mockPackages: Package[] = [
  {
    id: "PKG001",
    deliveryLocation: "Rua das Flores, 123, Aveiro",
    recipient: "João Silva",
    status: "Pendente",
    details: "Fragil - Cuidado no manuseamento",
    orderDate: "2025-10-08",
    distanceKm: 2.5
  },
  {
    id: "PKG002",
    deliveryLocation: "Av. Central, 456, Porto",
    recipient: "Maria Santos",
    status: "Pendente",
    details: "Entrega até às 18h",
    orderDate: "2025-10-09",
    distanceKm: 45.2
  },
  {
    id: "PKG003",
    deliveryLocation: "Praça da República, 789, Lisboa",
    recipient: "Carlos Oliveira",
    status: "Entregue",
    details: "Entregue com sucesso",
    orderDate: "2025-10-07",
    distanceKm: 120.8
  },
  {
    id: "PKG004",
    deliveryLocation: "Rua do Comércio, 321, Coimbra",
    recipient: "Ana Costa",
    status: "Pendente",
    details: "Contactar antes da entrega",
    orderDate: "2025-10-09",
    distanceKm: 15.7
  },
  {
    id: "PKG005",
    deliveryLocation: "Rua da Liberdade, 88, Braga",
    recipient: "Pedro Fernandes",
    status: "Entregue",
    details: "Entregue no porteiro",
    orderDate: "2025-10-06",
    distanceKm: 35.3
  }
];

function DriverCargoManifest() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<"Pendente" | "Entregue" | "Todas">("Todas");
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [sortBy, setSortBy] = useState<"orderDate" | "distanceKm">("orderDate");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Filtrar pacotes
  const filteredPackages = filter === "Todas" 
    ? mockPackages 
    : mockPackages.filter(pkg => pkg.status === filter);

  // Ordenar pacotes
  const sortedPackages = [...filteredPackages].sort((a, b) => {
    // Se mostrar todas, pendentes primeiro
    if (filter === "Todas") {
      if (a.status !== b.status) {
        return a.status === "Pendente" ? -1 : 1;
      }
    }
    
    // Depois ordenar pelo critério selecionado
    if (sortBy === "orderDate") {
      return new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime(); // Mais recente primeiro
    } else {
      return a.distanceKm - b.distanceKm; // Mais próximo primeiro
    }
  });

  const handlePackageClick = (pkg: Package) => {
    setSelectedPackage(pkg);
  };

  const closeModal = () => {
    setSelectedPackage(null);
  };

  const handleMapClick = (pkg: Package) => {
    // Aqui você pode implementar a abertura do mapa
    alert(`Abrindo mapa para: ${pkg.deliveryLocation}`);
  };

  const handleMarkAsDelivered = (pkg: Package) => {
    // Redirecionar para a página de confirmação de entrega
    navigate(`/confirm-delivery?orderId=${pkg.id}`);
    closeModal();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-PT', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  };

  const handleSortChange = (newSortBy: "orderDate" | "distanceKm") => {
    setSortBy(newSortBy);
    setIsDropdownOpen(false);
  };

  return (
    <>
      <Header role={role} href={Paths.PATH_DRIVER_CARGO_MANIFEST} />
      
      <div className="container mt-4">
        <div className="row">
          <div className="col-12">
            <h2 className="text-center mb-4" style={{color: '#2c3e50'}}>Manifesto de Carga</h2>
            
            {/* Filtros e Ordenação */}
            <div className="row mb-4">
              <div className="col-md-6">
                <div className="d-flex justify-content-center justify-content-md-start">
                  <div className="btn-group" role="group">
                    <button
                      type="button"
                      className={`btn ${filter === "Pendente" ? "btn-primary" : "btn-outline-primary"}`}
                      onClick={() => setFilter("Pendente")}
                      style={{backgroundColor: filter === "Pendente" ? "#007bff" : "transparent"}}
                    >
                      Pendentes ({mockPackages.filter(p => p.status === "Pendente").length})
                    </button>
                    <button
                      type="button"
                      className={`btn ${filter === "Entregue" ? "btn-primary" : "btn-outline-primary"}`}
                      onClick={() => setFilter("Entregue")}
                      style={{backgroundColor: filter === "Entregue" ? "#007bff" : "transparent"}}
                    >
                      Entregues ({mockPackages.filter(p => p.status === "Entregue").length})
                    </button>
                    <button
                      type="button"
                      className={`btn ${filter === "Todas" ? "btn-primary" : "btn-outline-primary"}`}
                      onClick={() => setFilter("Todas")}
                      style={{backgroundColor: filter === "Todas" ? "#007bff" : "transparent"}}
                    >
                      Todas ({mockPackages.length})
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
                      style={{minWidth: '180px'}}
                    >
                      Ordenar por: {sortBy === "orderDate" ? "Data do Pedido" : "Distância"}
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
                            Data do Pedido
                          </button>
                        </li>
                        <li>
                          <button 
                            className={`dropdown-item ${sortBy === "distanceKm" ? "active" : ""}`}
                            onClick={() => handleSortChange("distanceKm")}
                          >
                            Distância ao Driver
                          </button>
                        </li>
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Lista de Encomendas */}
            <div className="row">
              {sortedPackages.map((pkg) => (
                <div key={pkg.id} className="col-md-6 col-lg-4 mb-3">
                  <div 
                    className="card shadow-sm h-100" 
                    style={{
                      cursor: 'pointer', 
                      transition: 'transform 0.2s',
                      borderLeft: pkg.status === "Entregue" ? "4px solid #28a745" : "4px solid #ffc107"
                    }}
                    onClick={() => handlePackageClick(pkg)}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <h6 className="card-title text-primary mb-0">ID: {pkg.id}</h6>
                        <span className={`badge ${pkg.status === "Entregue" ? "bg-success" : "bg-warning text-dark"}`}>
                          {pkg.status}
                        </span>
                      </div>
                      
                      <p className="card-text mb-2">
                        <strong>Local de entrega:</strong><br />
                        <small>{pkg.deliveryLocation}</small>
                      </p>
                      
                      <p className="card-text mb-2">
                        <strong>Destinatário:</strong> {pkg.recipient}
                      </p>
                      
                      <div className="row mb-3">
                        <div className="col-6">
                          <small className="text-muted">
                            <strong>Data:</strong><br />
                            {formatDate(pkg.orderDate)}
                          </small>
                        </div>
                        <div className="col-6">
                          <small className="text-muted">
                            <strong>Distância:</strong><br />
                            {pkg.distanceKm} km
                          </small>
                        </div>
                      </div>
                      
                      <button
                        className="btn btn-primary btn-sm w-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMapClick(pkg);
                        }}
                        style={{backgroundColor: "#007bff", borderColor: "#007bff"}}
                      >
                        <img src={map} alt="Mapa" width="16" height="16" className="me-2" />
                        Mapa
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {sortedPackages.length === 0 && (
              <div className="text-center mt-4">
                <div className="alert alert-info">
                  <h5>Nenhuma encomenda {filter.toLowerCase()} encontrada</h5>
                  <p className="mb-0">
                    {filter === "Pendente" 
                      ? "Todas as encomendas foram entregues!" 
                      : filter === "Entregue"
                      ? "Ainda não há encomendas entregues."
                      : "Não há encomendas no sistema."}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Detalhes da Encomenda */}
      {selectedPackage && (
        <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Detalhes da Encomenda</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={closeModal}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <strong>ID:</strong> {selectedPackage.id}
                </div>
                <div className="mb-3">
                  <strong>Local de entrega:</strong><br />
                  {selectedPackage.deliveryLocation}
                </div>
                <div className="mb-3">
                  <strong>Destinatário:</strong> {selectedPackage.recipient}
                </div>
                <div className="mb-3">
                  <strong>Data do Pedido:</strong> {formatDate(selectedPackage.orderDate)}
                </div>
                <div className="mb-3">
                  <strong>Distância:</strong> {selectedPackage.distanceKm} km
                </div>
                <div className="mb-3">
                  <strong>Status:</strong> 
                  <span className={`badge ms-2 ${selectedPackage.status === "Entregue" ? "bg-success" : "bg-warning text-dark"}`}>
                    {selectedPackage.status}
                  </span>
                </div>
                {selectedPackage.details && (
                  <div className="mb-3">
                    <strong>Detalhes:</strong><br />
                    <div className="alert alert-light">
                      {selectedPackage.details}
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={closeModal}
                >
                  Fechar
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary"
                  onClick={() => handleMapClick(selectedPackage)}
                  style={{backgroundColor: "#007bff", borderColor: "#007bff"}}
                >
                  Ver no Mapa
                </button>
                {selectedPackage.status === "Pendente" && (
                  <button 
                    type="button" 
                    className="btn btn-success"
                    onClick={() => handleMarkAsDelivered(selectedPackage)}
                  >
                    Confirmar Entrega
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default DriverCargoManifest;
