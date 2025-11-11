package com.shipping.orderservice.model;

import java.time.LocalDateTime;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
// Map to exact case-sensitive table name created in Supabase
@Table(name = "\"Orders\"")
public class Order {

    @Id
    @GeneratedValue
    @Column(name = "order_id")
    private UUID orderId;

    // Note: the Supabase table uses the column name "costumer_id" (typo). Map to it explicitly.
    @Column(name = "costumer_id", nullable = false)
    private UUID customerId;

    @Column(name = "carrier_id")
    private UUID carrierId;

    @Column(name = "origin_address")
    private String originAddress;

    @Column(name = "destination_address")
    private String destinationAddress;

    @Column(name = "weight")
    private float weight;

    @Column(name = "status")
    private String status;

    @Column(name = "order_date", nullable = false)
    private LocalDateTime orderDate = LocalDateTime.now();

    @Column(name = "tracking_id")
    private String trackingId;  // Changed from UUID to String to match PostgreSQL text type

    @Column(name = "shipment_id")
    private UUID shipmentId;

    @Column(name = "actual_delivery_time")
    private LocalDateTime actualDeliveryTime;

    @Column(name = "pod")
    private byte[] pod; // Proof of Delivery (binary data - image/PDF)

    @Column(name = "error_message")
    private String errorMessage; // Error message for failed deliveries

    // Getters e Setters
    public UUID getOrderId() { return orderId; }
    public void setOrderId(UUID orderId) { this.orderId = orderId; }

    public UUID getCustomerId() { return customerId; }
    public void setCustomerId(UUID customerId) { this.customerId = customerId; }

    public UUID getCarrierId() { return carrierId; }
    public void setCarrierId(UUID carrierId) { this.carrierId = carrierId; }

    public String getOriginAddress() { return originAddress; }
    public void setOriginAddress(String originAddress) { this.originAddress = originAddress; }

    public String getDestinationAddress() { return destinationAddress; }
    public void setDestinationAddress(String destinationAddress) { this.destinationAddress = destinationAddress; }

    public float getWeight() { return weight; }
    public void setWeight(float weight) { this.weight = weight; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getOrderDate() { return orderDate; }
    public void setOrderDate(LocalDateTime orderDate) { this.orderDate = orderDate; }

    public String getTrackingId() { return trackingId; }
    public void setTrackingId(String trackingId) { this.trackingId = trackingId; }

    public UUID getShipmentId() { return shipmentId; }
    public void setShipmentId(UUID shipmentId) { this.shipmentId = shipmentId; }

    public LocalDateTime getActualDeliveryTime() { return actualDeliveryTime; }
    public void setActualDeliveryTime(LocalDateTime actualDeliveryTime) { this.actualDeliveryTime = actualDeliveryTime; }

    public byte[] getPod() { return pod; }
    public void setPod(byte[] pod) { this.pod = pod; }

    public String getErrorMessage() { return errorMessage; }
    public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }
}
