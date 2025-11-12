import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import Paths from './UtilsPaths';
import { useKeycloak } from '../context/KeycloakContext';
import { API_ENDPOINTS } from '../config/api.config';

const role: string = 'Driver';

interface Order {
  orderId: string;
  originAddress: string;
  destinationAddress: string;
  status: string;
  orderDate: string;
  weight: number;
  shipmentId?: string;
  customerId: string;
}

interface Shipment {
  shipmentId: string;
  carrierId: string;
  driverId: string;
  departureTime: string;
  arrivalTime: string;
  status: string;
}

interface ShipmentWithOrders extends Shipment {
  orders: Order[];
}

function DriverCargoManifest() {
  const navigate = useNavigate();
  const { keycloak, userInfo } = useKeycloak();
  const [shipments, setShipments] = useState<ShipmentWithOrders[]>([]);
  const [expandedShipmentId, setExpandedShipmentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userInfo?.sub) {
      loadShipments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userInfo]);

  const loadShipments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get keycloak_id from Keycloak JWT (sub claim = keycloak_id in Users table)
      const keycloakId = userInfo?.sub;
      
      if (!keycloakId) {
        console.error('Keycloak ID not found in token');
        setError('ID do utilizador não encontrado. Por favor, faça login novamente.');
        return;
      }

      console.log('🚚 Loading InTransit shipments for keycloak_id:', keycloakId);
      
      // Call optimized endpoint that navigates: keycloak_id → Users.id → Driver.user_id → Shipments
      // This endpoint returns InTransit shipments with their orders
      const response = await fetch(`${API_ENDPOINTS.SHIPMENTS}/my-shipments/${keycloakId}`, {
        headers: {
          'Authorization': `Bearer ${keycloak?.token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to load shipments: ${response.status}`);
      }
      
      const shipmentsWithOrders: ShipmentWithOrders[] = await response.json();
      console.log('✅ Shipments with orders:', shipmentsWithOrders);
      setShipments(shipmentsWithOrders);
      
    } catch (error) {
      console.error('❌ Error loading shipments:', error);
      setError('Erro ao carregar os envios. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const toggleShipment = (shipmentId: string) => {
    setExpandedShipmentId(expandedShipmentId === shipmentId ? null : shipmentId);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      Pending: 'bg-warning text-dark',
      InTransit: 'bg-primary',
      Delivered: 'bg-success',
      Failed: 'bg-danger'
    };
    const statusText = {
      Pending: 'Pendente',
      InTransit: 'Em Trânsito',
      Delivered: 'Entregue',
      Failed: 'Falhada'
    };
    return <span className={`badge ${badges[status as keyof typeof badges]}`}>{statusText[status as keyof typeof statusText] || status}</span>;
  };

  return (
    <>
      <Header role={role} href={Paths.PATH_DRIVER} />
      <div className='container mt-5'>
        <h1 className='text-center mb-4'>
          <i className='bi bi-truck'></i> Manifesto de Carga do Motorista
        </h1>
        <p className='text-center text-muted mb-4'>
          Shipments InTransit atribuídos a si
        </p>

        {loading && (
          <div className='text-center'>
            <div className='spinner-border text-primary' role='status'>
              <span className='visually-hidden'>A carregar...</span>
            </div>
            <p className='mt-2'>A carregar os seus shipments...</p>
          </div>
        )}

        {error && (
          <div className='alert alert-danger text-center' role='alert'>
            <i className='bi bi-exclamation-triangle'></i> {error}
            <button className='btn btn-sm btn-outline-danger ms-3' onClick={loadShipments}>
              Tentar novamente
            </button>
          </div>
        )}

        {!loading && !error && shipments.length === 0 && (
          <div className='alert alert-info text-center'>
            <i className='bi bi-info-circle'></i> Nenhum shipment InTransit atribuído a si no momento.
          </div>
        )}

        {!loading && !error && shipments.length > 0 && (
          <div>
            <div className='alert alert-success mb-4'>
              <strong><i className='bi bi-check-circle'></i> Total de Shipments:</strong>{' '}
              <span className='badge bg-primary ms-2'>{shipments.length}</span>
              {' • '}
              <strong>Total de Encomendas:</strong>{' '}
              <span className='badge bg-success ms-2'>
                {shipments.reduce((acc, s) => acc + s.orders.length, 0)}
              </span>
            </div>
            
            {shipments.map((shipment) => (
              <div key={shipment.shipmentId} className='card mb-3 shadow-sm'>
                <div 
                  className='card-header bg-light' 
                  onClick={() => toggleShipment(shipment.shipmentId)} 
                  style={{ cursor: 'pointer' }}
                >
                  <div className='d-flex justify-content-between align-items-center'>
                    <div>
                      <h5 className='mb-1'>
                        <i className='bi bi-truck'></i> Shipment #{shipment.shipmentId.substring(0, 8)}...{' '}
                        {getStatusBadge(shipment.status)}
                      </h5>
                      <small className='text-muted'>
                        <i className='bi bi-calendar'></i> Partida: {formatDate(shipment.departureTime)}{' | '}
                        Chegada: {formatDate(shipment.arrivalTime)}
                      </small>
                    </div>
                    <div className='d-flex align-items-center'>
                      <span className='badge bg-secondary me-2'>
                        {shipment.orders.length} encomenda{shipment.orders.length !== 1 ? 's' : ''}
                      </span>
                      <i className={`bi bi-chevron-${expandedShipmentId === shipment.shipmentId ? 'up' : 'down'}`}></i>
                    </div>
                  </div>
                </div>

                {expandedShipmentId === shipment.shipmentId && (
                  <div className='card-body'>
                    {shipment.orders.length === 0 ? (
                      <div className='alert alert-warning'>
                        <i className='bi bi-exclamation-triangle'></i> Nenhuma encomenda neste shipment
                      </div>
                    ) : (
                      <div className='row'>
                        {shipment.orders.map((order) => (
                          <div key={order.orderId} className='col-md-6 mb-3'>
                            <div className='card border-primary h-100'>
                              <div className='card-body'>
                                <div className='d-flex justify-content-between mb-3'>
                                  <h6 className='mb-0'>
                                    <i className='bi bi-box-seam'></i> Encomenda #{order.orderId.substring(0, 8)}...
                                  </h6>
                                  {getStatusBadge(order.status)}
                                </div>
                                
                                <div className='mb-2'>
                                  <strong><i className='bi bi-geo'></i> Origem:</strong>
                                  <p className='text-muted mb-0'>{order.originAddress}</p>
                                </div>
                                
                                <div className='mb-3'>
                                  <strong><i className='bi bi-geo-alt-fill'></i> Destino:</strong>
                                  <p className='text-muted mb-0'>{order.destinationAddress}</p>
                                </div>
                                
                                <div className='row text-center'>
                                  <div className='col-6'>
                                    <small className='text-muted'>Data</small>
                                    <p className='mb-0'><strong>{formatDate(order.orderDate)}</strong></p>
                                  </div>
                                  <div className='col-6'>
                                    <small className='text-muted'>Peso</small>
                                    <p className='mb-0'><strong>{order.weight} kg</strong></p>
                                  </div>
                                </div>
                                
                                {/* Botão "Ver no Mapa" */}
                                <button 
                                  className='btn btn-sm btn-outline-primary mt-3 w-100'
                                  onClick={() => navigate(`/delivery-route/${order.orderId}`)}
                                >
                                  <i className='bi bi-geo-alt'></i> Ver no Mapa
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className='text-center mt-4'>
          <button className='btn btn-secondary' onClick={() => navigate(Paths.PATH_DRIVER)}>
            <i className='bi bi-arrow-left'></i> Voltar ao Dashboard
          </button>
        </div>
      </div>
    </>
  );
}

export default DriverCargoManifest;
