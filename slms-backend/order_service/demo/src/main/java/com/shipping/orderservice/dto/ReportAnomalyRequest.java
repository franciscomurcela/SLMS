package com.shipping.orderservice.dto;

public class ReportAnomalyRequest {
    private String orderId;
    private String errorMessage;

    // Constructors
    public ReportAnomalyRequest() {}

    public ReportAnomalyRequest(String orderId, String errorMessage) {
        this.orderId = orderId;
        this.errorMessage = errorMessage;
    }

    // Getters and Setters
    public String getOrderId() {
        return orderId;
    }

    public void setOrderId(String orderId) {
        this.orderId = orderId;
    }

    public String getErrorMessage() {
        return errorMessage;
    }

    public void setErrorMessage(String errorMessage) {
        this.errorMessage = errorMessage;
    }
}