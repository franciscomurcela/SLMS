package com.shipping.orderservice.dto;

public class ConfirmDeliveryRequest {
    private String orderId;
    private String proofType; // "photo" ou "signature"
    private String proofData; // base64 encoded data
    private String timestamp;
    private Location location;
    
    public static class Location {
        private double latitude;
        private double longitude;
        
        public double getLatitude() { return latitude; }
        public void setLatitude(double latitude) { this.latitude = latitude; }
        
        public double getLongitude() { return longitude; }
        public void setLongitude(double longitude) { this.longitude = longitude; }
    }
    
    // Getters e Setters
    public String getOrderId() { return orderId; }
    public void setOrderId(String orderId) { this.orderId = orderId; }
    
    public String getProofType() { return proofType; }
    public void setProofType(String proofType) { this.proofType = proofType; }
    
    public String getProofData() { return proofData; }
    public void setProofData(String proofData) { this.proofData = proofData; }
    
    public String getTimestamp() { return timestamp; }
    public void setTimestamp(String timestamp) { this.timestamp = timestamp; }
    
    public Location getLocation() { return location; }
    public void setLocation(Location location) { this.location = location; }
}