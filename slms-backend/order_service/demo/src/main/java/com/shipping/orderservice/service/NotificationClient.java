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
