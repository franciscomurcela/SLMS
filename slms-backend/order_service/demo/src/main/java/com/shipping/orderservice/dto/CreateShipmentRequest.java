package com.shipping.orderservice.dto;

import java.util.List;

public class CreateShipmentRequest {
    private List<String> orderIds;
    private String carrierId;

    // Constructors
    public CreateShipmentRequest() {}

    public CreateShipmentRequest(List<String> orderIds, String carrierId) {
        this.orderIds = orderIds;
        this.carrierId = carrierId;
    }

    // Getters and Setters
    public List<String> getOrderIds() {
        return orderIds;
    }

    public void setOrderIds(List<String> orderIds) {
        this.orderIds = orderIds;
    }

    public String getCarrierId() {
        return carrierId;
    }

    public void setCarrierId(String carrierId) {
        this.carrierId = carrierId;
    }
}
