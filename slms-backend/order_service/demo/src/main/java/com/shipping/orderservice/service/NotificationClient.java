package com.shipping.orderservice.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
public class NotificationClient {
    
    private final RestTemplate restTemplate;
    private final String notificationServiceUrl;
    
    public NotificationClient(
            RestTemplate restTemplate,
            @Value("${notification.service.url:http://notification-service:8084}") String notificationServiceUrl) {
        this.restTemplate = restTemplate;
        this.notificationServiceUrl = notificationServiceUrl;
    }
    
    /**
     * Notify warehouse staff about a new order
     */
    public void notifyNewOrder(UUID orderId, String customerName, UUID warehouseStaffId) {
        try {
            Map<String, Object> notification = new HashMap<>();
            notification.put("userId", warehouseStaffId);
            notification.put("type", "ORDER_CREATED");
            notification.put("title", "Novo Pedido Recebido");
            notification.put("message", String.format("Um novo pedido foi registado por %s. Preparação necessária.", customerName));
            notification.put("relatedEntityType", "ORDER");
            notification.put("relatedEntityId", orderId);
            notification.put("severity", "INFO");
            
            sendNotification(notification);
            System.out.println("Sent new order notification for order " + orderId);
        } catch (Exception e) {
            System.err.println("Failed to send new order notification: " + e.getMessage());
        }
    }
    
    /**
     * Notify warehouse staff about carrier change
     */
    public void notifyCarrierChange(UUID orderId, String oldCarrierName, String newCarrierName, UUID warehouseStaffId) {
        try {
            Map<String, Object> notification = new HashMap<>();
            notification.put("userId", warehouseStaffId);
            notification.put("type", "CARRIER_CHANGED");
            notification.put("title", "Transportadora Alterada");
            notification.put("message", String.format("A transportadora do pedido foi alterada de %s para %s. Ajuste o despacho.", 
                    oldCarrierName, newCarrierName));
            notification.put("relatedEntityType", "ORDER");
            notification.put("relatedEntityId", orderId);
            notification.put("severity", "WARNING");
            
            Map<String, String> metadata = new HashMap<>();
            metadata.put("oldCarrier", oldCarrierName);
            metadata.put("newCarrier", newCarrierName);
            notification.put("metadata", metadata);
            
            sendNotification(notification);
            System.out.println("Sent carrier change notification for order " + orderId);
        } catch (Exception e) {
            System.err.println("Failed to send carrier change notification: " + e.getMessage());
        }
    }
    
    /**
     * Notify all warehouse staff about a new order
     */
    public void notifyAllWarehouseStaff(UUID orderId, String customerName, java.util.List<UUID> warehouseStaffIds) {
        for (UUID staffId : warehouseStaffIds) {
            notifyNewOrder(orderId, customerName, staffId);
        }
    }
    
    /**
     * Notify customer about order creation
     */
    public void notifyOrderCreated(UUID orderId, UUID customerId) {
        try {
            Map<String, Object> notification = new HashMap<>();
            notification.put("userId", customerId);
            notification.put("type", "ORDER_CREATED");
            notification.put("title", "Pedido Criado com Sucesso");
            notification.put("message", "O seu pedido foi registado e está a ser processado.");
            notification.put("relatedEntityType", "ORDER");
            notification.put("relatedEntityId", orderId);
            notification.put("severity", "INFO");
            
            sendNotification(notification);
            System.out.println("Sent order created notification to customer for order " + orderId);
        } catch (Exception e) {
            System.err.println("Failed to send order created notification to customer: " + e.getMessage());
        }
    }
    
    /**
     * Notify customer about order status change
     */
    public void notifyOrderStatusChange(UUID orderId, String oldStatus, String newStatus, UUID customerId) {
        try {
            Map<String, Object> notification = new HashMap<>();
            notification.put("userId", customerId);
            notification.put("type", "SHIPMENT_STATUS_UPDATED");
            notification.put("title", "Estado do Pedido Atualizado");
            notification.put("message", String.format("O seu pedido mudou de %s para %s.", oldStatus, newStatus));
            notification.put("relatedEntityType", "ORDER");
            notification.put("relatedEntityId", orderId);
            notification.put("severity", "INFO");
            
            Map<String, String> metadata = new HashMap<>();
            metadata.put("oldStatus", oldStatus);
            metadata.put("newStatus", newStatus);
            notification.put("metadata", metadata);
            
            sendNotification(notification);
            System.out.println("Sent status change notification to customer for order " + orderId);
        } catch (Exception e) {
            System.err.println("Failed to send status change notification to customer: " + e.getMessage());
        }
    }
    
    /**
     * Notify customer about order dispatch
     */
    public void notifyOrderDispatched(UUID orderId, String carrierName, UUID customerId) {
        try {
            Map<String, Object> notification = new HashMap<>();
            notification.put("userId", customerId);
            notification.put("type", "ORDER_DISPATCHED");
            notification.put("title", "Pedido Despachado");
            notification.put("message", String.format("O seu pedido foi despachado via %s.", carrierName));
            notification.put("relatedEntityType", "ORDER");
            notification.put("relatedEntityId", orderId);
            notification.put("severity", "INFO");
            
            Map<String, String> metadata = new HashMap<>();
            metadata.put("carrier", carrierName);
            notification.put("metadata", metadata);
            
            sendNotification(notification);
            System.out.println("Sent dispatch notification to customer for order " + orderId);
        } catch (Exception e) {
            System.err.println("Failed to send dispatch notification to customer: " + e.getMessage());
        }
    }
    
    /**
     * Notify CSR about delivery anomaly with customer email
     */
    public void notifyAnomalyReported(UUID orderId, String anomalyType, String description, String customerEmail, UUID csrId) {
        try {
            Map<String, Object> notification = new HashMap<>();
            notification.put("userId", csrId);
            notification.put("type", "DELIVERY_EXCEPTION");
            notification.put("title", "Anomalia Reportada");
            notification.put("message", String.format("Order de Cliente (%s) tem uma anomalia: %s - %s", customerEmail, anomalyType, description));
            notification.put("relatedEntityType", "ORDER");
            notification.put("relatedEntityId", orderId);
            notification.put("severity", "ERROR");
            
            Map<String, String> metadata = new HashMap<>();
            metadata.put("anomalyType", anomalyType);
            metadata.put("description", description);
            metadata.put("customerEmail", customerEmail);
            notification.put("metadata", metadata);
            
            sendNotification(notification);
            System.out.println("Sent anomaly notification to CSR for order " + orderId);
        } catch (Exception e) {
            System.err.println("Failed to send anomaly notification to CSR: " + e.getMessage());
        }
    }
    
    /**
     * Notify all CSRs about delivery anomaly with customer email
     */
    public void notifyAllCSRs(UUID orderId, String anomalyType, String description, String customerEmail, java.util.List<UUID> csrIds) {
        for (UUID csrId : csrIds) {
            notifyAnomalyReported(orderId, anomalyType, description, customerEmail, csrId);
        }
    }
    
    /**
     * Notify customer about order failure
     */
    public void notifyOrderFailed(UUID orderId, String errorMessage, UUID customerId) {
        try {
            Map<String, Object> notification = new HashMap<>();
            notification.put("userId", customerId);
            notification.put("type", "DELIVERY_EXCEPTION");
            notification.put("title", "Problema com o Pedido");
            notification.put("message", String.format("O seu pedido falhou. Motivo: %s", errorMessage));
            notification.put("relatedEntityType", "ORDER");
            notification.put("relatedEntityId", orderId);
            notification.put("severity", "ERROR");
            
            Map<String, String> metadata = new HashMap<>();
            metadata.put("errorMessage", errorMessage);
            notification.put("metadata", metadata);
            
            sendNotification(notification);
            System.out.println("Sent order failure notification to customer for order " + orderId);
        } catch (Exception e) {
            System.err.println("Failed to send order failure notification to customer: " + e.getMessage());
        }
    }
    
    /**
     * Notify warehouse staff about order failure
     */
    public void notifyWarehouseStaffOrderFailed(UUID orderId, String errorMessage, UUID warehouseStaffId) {
        try {
            Map<String, Object> notification = new HashMap<>();
            notification.put("userId", warehouseStaffId);
            notification.put("type", "DELIVERY_EXCEPTION");
            notification.put("title", "Pedido Falhado");
            notification.put("message", String.format("O pedido falhou. Motivo: %s", errorMessage));
            notification.put("relatedEntityType", "ORDER");
            notification.put("relatedEntityId", orderId);
            notification.put("severity", "ERROR");
            
            Map<String, String> metadata = new HashMap<>();
            metadata.put("errorMessage", errorMessage);
            notification.put("metadata", metadata);
            
            sendNotification(notification);
            System.out.println("Sent order failure notification to warehouse staff for order " + orderId);
        } catch (Exception e) {
            System.err.println("Failed to send order failure notification to warehouse staff: " + e.getMessage());
        }
    }
    
    /**
     * Notify all warehouse staff about order failure
     */
    public void notifyAllWarehouseStaffOrderFailed(UUID orderId, String errorMessage, java.util.List<UUID> warehouseStaffIds) {
        for (UUID staffId : warehouseStaffIds) {
            notifyWarehouseStaffOrderFailed(orderId, errorMessage, staffId);
        }
    }
    
    /**
     * Send notification to notification service
     */
    private void sendNotification(Map<String, Object> notification) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(notification, headers);
            
            restTemplate.postForEntity(
                    notificationServiceUrl + "/api/notifications",
                    request,
                    Map.class
            );
        } catch (Exception e) {
            System.err.println("Error sending notification to notification service: " + e.getMessage());
            // Don't throw - notifications are non-critical
        }
    }
}
