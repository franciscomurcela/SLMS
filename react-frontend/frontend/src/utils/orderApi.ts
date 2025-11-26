/**
 * Order API utilities for fetching order details
 */

export interface OrderDetails {
  id: string;
  tracking_id: string;
  status: string;
  origin: string;
  destination: string;
  weight: number;
  carrier_id: string | null;
  carrier_name?: string;
  customer_id: string;
  created_at: string;
  updated_at: string;
}

/**
 * Fetch order details by tracking ID
 */
export async function fetchOrderByTrackingId(trackingId: string, authToken?: string, customerId?: string): Promise<OrderDetails | null> {
  try {
    // Use the same endpoint as the order history page
    // We'll fetch all orders and filter by tracking_id
    const url = customerId ? `/api/orders/my-orders/${customerId}` : `/api/orders`;
    const token = authToken;
    
    console.log('[DEBUG] fetchOrderByTrackingId called with:', trackingId);
    console.log('[DEBUG] Customer ID:', customerId);
    console.log('[DEBUG] API URL:', url);
    console.log('[DEBUG] Token available:', !!token);
    
    // Call backend API to get order details
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Include authentication token if available
        ...(token && {
          'Authorization': `Bearer ${token}`
        })
      }
    });

    console.log('[DEBUG] Response status:', response.status);
    console.log('[DEBUG] Response ok:', response.ok);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[DEBUG] Failed to fetch orders:', response.status, errorText);
      return null;
    }

    // The endpoint returns an array of orders
    const orders = await response.json();
    console.log('[DEBUG] Orders received:', orders);
    
    // Find the order with matching orderId OR trackingId
    // In the database: order_id and tracking_id are different fields
    const order = orders.find((o: any) => 
      o.orderId === trackingId || 
      o.trackingId === trackingId
    );
    console.log('[DEBUG] Matching order:', order);
    
    if (order) {
      return {
        id: order.orderId,
        tracking_id: order.trackingId || order.orderId,
        status: order.status,
        origin: order.originAddress,
        destination: order.destinationAddress,
        weight: order.weight,
        carrier_id: order.carrierId,
        carrier_name: order.carrierName,
        customer_id: order.customerId,
        created_at: order.orderDate,
        updated_at: order.orderDate
      };
    }
    
    return null;
  } catch (error) {
    console.error('[DEBUG] Error fetching order:', error);
    return null;
  }
}

/**
 * Format order details into a user-friendly message
 */
export function formatOrderDetails(order: OrderDetails): string {
  const statusEmoji = {
    'Pending': '🟡',
    'Assigned': '🟢',
    'In Transit': '🚚',
    'Delivered': '✅',
    'Cancelled': '❌',
    'Failed': '⚠️'
  };

  const emoji = statusEmoji[order.status as keyof typeof statusEmoji] || '📦';
  
  // Use carrier name if available, otherwise show waiting message
  const carrierInfo = order.carrier_name || (order.carrier_id ? `ID: ${order.carrier_id}` : 'Aguardando atribuição');

  return `${emoji} Informações da Encomenda

Tracking ID: \`${order.tracking_id}\`
Status: ${order.status}
Origem: ${order.origin}
Destino: ${order.destination}
Peso: ${order.weight} kg
Transportadora: ${carrierInfo}
Criado em: ${new Date(order.created_at).toLocaleString('pt-PT')}
Atualizado em: ${new Date(order.updated_at).toLocaleString('pt-PT')}

${getStatusDescription(order.status)}`;
}

function getStatusDescription(status: string): string {
  switch (status) {
    case 'Pending':
      return '⏳ Próximo passo: Aguardando atribuição de transportadora (1-2 horas)';
    case 'Assigned':
      return '📋 Próximo passo: Transportadora irá recolher a encomenda em breve';
    case 'In Transit':
      return '🚚 Próximo passo: Encomenda a caminho do destino. Acompanhe as atualizações!';
    case 'Delivered':
      return '✅ Encomenda entregue com sucesso! Obrigado por usar o SLMS.';
    case 'Cancelled':
      return '❌ Encomenda cancelada. Entre em contacto com o suporte para mais informações.';
    case 'Failed':
      return '⚠️ Problema na entrega. Entre em contacto com o suporte: suporte@slms.pt';
    default:
      return '';
  }
}
