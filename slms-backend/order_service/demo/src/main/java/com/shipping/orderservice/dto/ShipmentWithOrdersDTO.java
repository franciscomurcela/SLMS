package com.shipping.orderservice.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import com.shipping.orderservice.model.Order;
import com.shipping.orderservice.model.Shipment;

/**
 * DTO for Driver Cargo Manifest
 * Returns a Shipment with its associated Orders
 */
public class ShipmentWithOrdersDTO {
    
    private UUID shipmentId;
    private UUID carrierId;
    private UUID driverId;
    private LocalDateTime departureTime;
    private LocalDateTime arrivalTime;
    private String status;
    private List<Order> orders;
    
    public ShipmentWithOrdersDTO() {}
    
    public ShipmentWithOrdersDTO(Shipment shipment, List<Order> orders) {
        this.shipmentId = shipment.getShipmentId();
        this.carrierId = shipment.getCarrierId();
        this.driverId = shipment.getDriverId();
        this.departureTime = shipment.getDepartureTime();
        this.arrivalTime = shipment.getArrivalTime();
        this.status = shipment.getStatus().name();
        this.orders = orders;
    }
    
    // Getters and Setters
    public UUID getShipmentId() {
        return shipmentId;
    }
    
    public void setShipmentId(UUID shipmentId) {
        this.shipmentId = shipmentId;
    }
    
    public UUID getCarrierId() {
        return carrierId;
    }
    
    public void setCarrierId(UUID carrierId) {
        this.carrierId = carrierId;
    }
    
    public UUID getDriverId() {
        return driverId;
    }
    
    public void setDriverId(UUID driverId) {
        this.driverId = driverId;
    }
    
    public LocalDateTime getDepartureTime() {
        return departureTime;
    }
    
    public void setDepartureTime(LocalDateTime departureTime) {
        this.departureTime = departureTime;
    }
    
    public LocalDateTime getArrivalTime() {
        return arrivalTime;
    }
    
    public void setArrivalTime(LocalDateTime arrivalTime) {
        this.arrivalTime = arrivalTime;
    }
    
    public String getStatus() {
        return status;
    }
    
    public void setStatus(String status) {
        this.status = status;
    }
    
    public List<Order> getOrders() {
        return orders;
    }
    
    public void setOrders(List<Order> orders) {
        this.orders = orders;
    }
}
