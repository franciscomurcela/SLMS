package main.java.es204.notification_service.model;

public enum NotificationType {
    ORDER_CREATED("Novo Pedido"),
    CARRIER_CHANGED("Transportadora Alterada"),
    SHIPMENT_STATUS_UPDATED("Estado da Encomenda Atualizado"),
    DELIVERY_EXCEPTION("Exceção de Entrega"),
    ORDER_ASSIGNED("Pedido Atribuído"),
    ORDER_DISPATCHED("Pedido Despachado");
    
    private final String displayName;
    
    NotificationType(String displayName) {
        this.displayName = displayName;
    }
    
    public String getDisplayName() {
        return displayName;
    }
}
