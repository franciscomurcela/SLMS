import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import Paths from './UtilsPaths';

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
  const [shipments, setShipments] = useState<ShipmentWithOrders[]>([]);
  const [expandedShipmentId, setExpandedShipmentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadShipments();
  }, []);

  const loadShipments = async () => {
    try {
      setLoading(true);
      
      // TODO: Implementar os endpoints reais no backend
      // Dados mock temporários para testes - agrupados por cliente
      const mockShipmentsData: ShipmentWithOrders[] = [
        {
          shipmentId: '550e8400-e29b-41d4-a716-446655440000',
          carrierId: 'carrier-001',
          driverId: 'driver-001',
          departureTime: '2025-10-15T08:00:00',
          arrivalTime: '2025-10-15T18:00:00',
          status: 'InTransit',
          orders: [
            // Múltiplas encomendas do mesmo cliente (customer-001)
            {
              orderId: 'order-001',
              originAddress: 'Armazém Central, Aveiro',
              destinationAddress: 'Rua das Flores, 123, Porto',
              status: 'InTransit',
              orderDate: '2025-10-14T10:00:00',
              weight: 15.5,
              shipmentId: '550e8400-e29b-41d4-a716-446655440000',
              customerId: 'customer-001'
            },
            {
              orderId: 'order-002',
              originAddress: 'Armazém Central, Aveiro',
              destinationAddress: 'Rua das Flores, 123, Porto',
              status: 'InTransit',
              orderDate: '2025-10-14T11:00:00',
              weight: 8.2,
              shipmentId: '550e8400-e29b-41d4-a716-446655440000',
              customerId: 'customer-001'  // Mesmo cliente!
            },
            {
              orderId: 'order-003',
              originAddress: 'Armazém Central, Aveiro',
              destinationAddress: 'Rua das Flores, 123, Porto',
              status: 'InTransit',
              orderDate: '2025-10-14T12:00:00',
              weight: 5.0,
              shipmentId: '550e8400-e29b-41d4-a716-446655440000',
              customerId: 'customer-001'  // Mesmo cliente!
            }
          ]
        },
        {
          shipmentId: '650e8400-e29b-41d4-a716-446655440001',
          carrierId: 'carrier-001',
          driverId: 'driver-001',
          departureTime: '2025-10-15T09:00:00',
          arrivalTime: '2025-10-15T19:00:00',
          status: 'InTransit',
          orders: [
            // Múltiplas encomendas de outro cliente (customer-002)
            {
              orderId: 'order-004',
              originAddress: 'Armazém Central, Aveiro',
              destinationAddress: 'Av. da Liberdade, 456, Lisboa',
              status: 'InTransit',
              orderDate: '2025-10-14T13:00:00',
              weight: 12.0,
              shipmentId: '650e8400-e29b-41d4-a716-446655440001',
              customerId: 'customer-002'
            },
            {
              orderId: 'order-005',
              originAddress: 'Armazém Central, Aveiro',
              destinationAddress: 'Av. da Liberdade, 456, Lisboa',
              status: 'InTransit',
              orderDate: '2025-10-14T14:00:00',
              weight: 7.5,
              shipmentId: '650e8400-e29b-41d4-a716-446655440001',
              customerId: 'customer-002'  // Mesmo cliente!
            }
          ]
        },
        {
          shipmentId: '750e8400-e29b-41d4-a716-446655440002',
          carrierId: 'carrier-001',
          driverId: 'driver-001',
          departureTime: '2025-10-14T09:00:00',
          arrivalTime: '2025-10-14T17:00:00',
          status: 'Delivered',
          orders: [
            // Encomenda já entregue (customer-003)
            {
              orderId: 'order-006',
              originAddress: 'Armazém Central, Aveiro',
              destinationAddress: 'Praça do Comércio, 789, Coimbra',
              status: 'Delivered',
              orderDate: '2025-10-13T09:00:00',
              weight: 20.0,
              shipmentId: '750e8400-e29b-41d4-a716-446655440002',
              customerId: 'customer-003'
            }
          ]
        }
      ];
      
      setShipments(mockShipmentsData);
      
      /* Código real - descomentar quando os endpoints estiverem prontos:
      const shipmentsResponse = await fetch('/api/shipments/driver/');
      const driverShipments: Shipment[] = await shipmentsResponse.json();
      
      const ordersResponse = await fetch('/api/orders');
      const allOrders: Order[] = await ordersResponse.json();
      
      const shipmentsWithOrders: ShipmentWithOrders[] = driverShipments.map(shipment => ({
        ...shipment,
        orders: allOrders.filter(order => order.shipmentId === shipment.shipmentId)
      }));
      
      setShipments(shipmentsWithOrders);
      */
    } catch (error) {
      console.error('Error loading shipments:', error);
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
      Delivered: 'bg-success'
    };
    const statusText = {
      Pending: 'Pendente',
      InTransit: 'Em Trânsito',
      Delivered: 'Entregue'
    };
    return <span className={`badge ${badges[status as keyof typeof badges]}`}>{statusText[status as keyof typeof statusText] || status}</span>;
  };

  return (
    <>
      <Header role={role} href={Paths.PATH_DRIVER} />
      <div className='container mt-5'>
        <h1 className='text-center mb-4'>Manifesto de Carga</h1>

        {loading && <div className='text-center'><div className='spinner-border'></div></div>}

        {!loading && shipments.length === 0 && (
          <div className='alert alert-info text-center'>Nenhum shipment encontrado</div>
        )}

        {!loading && shipments.length > 0 && (
          <div>
            <h5>Total de Shipments: <span className='badge bg-primary'>{shipments.length}</span></h5>
            
            {shipments.map((shipment) => (
              <div key={shipment.shipmentId} className='card mb-3'>
                <div className='card-header bg-light' onClick={() => toggleShipment(shipment.shipmentId)} style={{ cursor: 'pointer' }}>
                  <div className='d-flex justify-content-between align-items-center'>
                    <div>
                      <h5><i className='bi bi-truck'></i> Shipment #{shipment.shipmentId.substring(0, 8)}... {getStatusBadge(shipment.status)}</h5>
                      <small className='text-muted'>Partida: {formatDate(shipment.departureTime)} | Chegada: {formatDate(shipment.arrivalTime)}</small>
                    </div>
                    <div>
                      <span className='badge bg-secondary'>{shipment.orders.length} encomendas</span>
                      <i className='bi bi-chevron-down ms-2'></i>
                    </div>
                  </div>
                </div>

                {expandedShipmentId === shipment.shipmentId && (
                  <div className='card-body'>
                    {shipment.orders.length === 0 ? (
                      <div className='alert alert-warning'>Nenhuma encomenda</div>
                    ) : (
                      <div className='row'>
                        {shipment.orders.map((order) => (
                          <div key={order.orderId} className='col-md-6 mb-3'>
                            <div className='card border-primary'>
                              <div className='card-body'>
                                <div className='d-flex justify-content-between mb-2'>
                                  <h6><i className='bi bi-box'></i> #{order.orderId.substring(0, 8)}...</h6>
                                  {getStatusBadge(order.status)}
                                </div>
                                <div className='mb-2'><strong>Origem:</strong><p className='text-muted'>{order.originAddress}</p></div>
                                <div className='mb-2'><strong>Destino:</strong><p className='text-muted'>{order.destinationAddress}</p></div>
                                <div className='row'>
                                  <div className='col-6'><small><strong>Data:</strong> {formatDate(order.orderDate)}</small></div>
                                  <div className='col-6'><small><strong>Peso:</strong> {order.weight} kg</small></div>
                                </div>
                                <button className='btn btn-sm btn-outline-primary mt-2 w-100'><i className='bi bi-geo-alt'></i> Ver Mapa</button>
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
            <i className='bi bi-arrow-left'></i> Voltar
          </button>
        </div>
      </div>
    </>
  );
}

export default DriverCargoManifest;
