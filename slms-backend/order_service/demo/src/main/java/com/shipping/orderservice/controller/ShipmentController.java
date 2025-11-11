package com.shipping.orderservice.controller;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.shipping.orderservice.dto.ShipmentWithOrdersDTO;
import com.shipping.orderservice.model.Order;
import com.shipping.orderservice.model.Shipment;
import com.shipping.orderservice.model.Shipment.ShipmentStatus;
import com.shipping.orderservice.repository.OrderRepository;
import com.shipping.orderservice.repository.ShipmentRepository;

/**
 * REST Controller for managing Shipments
 * Provides endpoints to query shipments by driver, carrier, status, etc.
 */
@RestController
@RequestMapping("/api/shipments")
public class ShipmentController {

    @Autowired
    private ShipmentRepository shipmentRepository;
    
    @Autowired
    private OrderRepository orderRepository;

    /**
     * Get all shipments
     * @return List of all shipments
     */
    @GetMapping
    public ResponseEntity<List<Shipment>> getAllShipments() {
        try {
            List<Shipment> shipments = shipmentRepository.findAll();
            return ResponseEntity.ok(shipments);
        } catch (Exception e) {
            System.err.println("Error fetching all shipments: " + e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Get InTransit shipments for the current driver (user)
     * This endpoint extracts the keycloak ID from the JWT token automatically
     * @return List of InTransit shipments with their associated orders for the current driver
     */
    @GetMapping("/driver")
    public ResponseEntity<List<ShipmentWithOrdersDTO>> getMyShipments(Authentication authentication) {
        try {
            // Extract keycloak ID from JWT token using Spring Security
            String keycloakId = null;
            if (authentication != null && authentication.getPrincipal() instanceof Jwt jwt) {
                keycloakId = jwt.getSubject(); // The 'sub' claim contains the keycloak user ID
            }
            
            if (keycloakId == null || keycloakId.trim().isEmpty()) {
                System.err.println("=== ERROR: No keycloak ID found in JWT token");
                return ResponseEntity.badRequest().build();
            }
            
            System.out.println("=== Fetching shipments for current driver with keycloakId: " + keycloakId);
            
            // Get InTransit shipments for this user
            List<Shipment> shipments = shipmentRepository.findInTransitShipmentsByKeycloakId(keycloakId);
            
            System.out.println("=== Found " + shipments.size() + " InTransit shipments");
            
            // For each shipment, fetch its orders
            List<ShipmentWithOrdersDTO> result = new ArrayList<>();
            
            for (Shipment shipment : shipments) {
                try {
                    System.out.println("=== Processing shipment: " + shipment.getShipmentId());
                    List<Order> orders = orderRepository.findByShipmentId(shipment.getShipmentId());
                    System.out.println("    Found " + orders.size() + " orders");
                    result.add(new ShipmentWithOrdersDTO(shipment, orders));
                } catch (Exception e) {
                    System.err.println("    ERROR processing shipment " + shipment.getShipmentId() + ": " + e.getMessage());
                    e.printStackTrace();
                }
            }
            
            System.out.println("=== Returning " + result.size() + " shipments with orders");
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            System.err.println("=== ERROR fetching shipments for current driver: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Get a specific shipment by ID
     * @param shipmentId UUID of the shipment
     * @return Shipment if found, 404 otherwise
     */
    @GetMapping("/{shipmentId}")
    public ResponseEntity<Shipment> getShipmentById(@PathVariable UUID shipmentId) {
        try {
            return shipmentRepository.findById(shipmentId)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            System.err.println("Error fetching shipment " + shipmentId + ": " + e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Get all shipments assigned to a specific driver
     * @param driverId UUID of the driver
     * @return List of shipments for the driver
     */
    @GetMapping("/driver/{driverId}")
    public ResponseEntity<List<Shipment>> getShipmentsByDriver(@PathVariable UUID driverId) {
        try {
            List<Shipment> shipments = shipmentRepository.findByDriverId(driverId);
            return ResponseEntity.ok(shipments);
        } catch (Exception e) {
            System.err.println("Error fetching shipments for driver " + driverId + ": " + e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Get all shipments for a specific driver with a specific status
     * Useful for getting only InTransit shipments for a driver
     * @param driverId UUID of the driver
     * @param status Status of shipments (Pending, InTransit, Delivered, Cancelled)
     * @return List of shipments matching criteria
     */
    @GetMapping("/driver/{driverId}/status/{status}")
    public ResponseEntity<List<Shipment>> getShipmentsByDriverAndStatus(
            @PathVariable UUID driverId,
            @PathVariable String status) {
        try {
            ShipmentStatus shipmentStatus = ShipmentStatus.valueOf(status);
            List<Shipment> shipments = shipmentRepository.findByDriverIdAndStatus(driverId, shipmentStatus);
            return ResponseEntity.ok(shipments);
        } catch (IllegalArgumentException e) {
            System.err.println("Invalid status: " + status);
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            System.err.println("Error fetching shipments for driver " + driverId + " with status " + status + ": " + e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Get all shipments by status
     * @param status Status of shipments (Pending, InTransit, Delivered, Cancelled)
     * @return List of shipments with the specified status
     */
    @GetMapping("/status/{status}")
    public ResponseEntity<List<Shipment>> getShipmentsByStatus(@PathVariable String status) {
        try {
            ShipmentStatus shipmentStatus = ShipmentStatus.valueOf(status);
            List<Shipment> shipments = shipmentRepository.findByStatus(shipmentStatus);
            return ResponseEntity.ok(shipments);
        } catch (IllegalArgumentException e) {
            System.err.println("Invalid status: " + status);
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            System.err.println("Error fetching shipments with status " + status + ": " + e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Get all shipments for a specific carrier
     * @param carrierId UUID of the carrier
     * @return List of shipments for the carrier
     */
    @GetMapping("/carrier/{carrierId}")
    public ResponseEntity<List<Shipment>> getShipmentsByCarrier(@PathVariable UUID carrierId) {
        try {
            List<Shipment> shipments = shipmentRepository.findByCarrierId(carrierId);
            return ResponseEntity.ok(shipments);
        } catch (Exception e) {
            System.err.println("Error fetching shipments for carrier " + carrierId + ": " + e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * Driver Manifest Endpoint
     * Get InTransit shipments with their orders for a specific user
     * Navigation: keycloakId (JWT sub) → Users.keycloak_id → Users.id → Driver.user_id → Driver.driver_id → Shipments
     * 
     * @param keycloakId The keycloak_id (comes from JWT sub claim)
     * @return List of InTransit shipments with their associated orders
     */
    @GetMapping("/my-shipments/{keycloakId}")
    public ResponseEntity<List<ShipmentWithOrdersDTO>> getMyShipmentsWithOrders(@PathVariable String keycloakId) {
        try {
            System.out.println("=== Fetching shipments for keycloakId: " + keycloakId);
            
            // Get InTransit shipments for this user (navigating through Users and Driver tables)
            List<Shipment> shipments = shipmentRepository.findInTransitShipmentsByKeycloakId(keycloakId);
            
            System.out.println("=== Found " + shipments.size() + " InTransit shipments");
            
            // For each shipment, fetch its orders
            List<ShipmentWithOrdersDTO> result = new ArrayList<>();
            
            for (Shipment shipment : shipments) {
                try {
                    System.out.println("=== Processing shipment: " + shipment.getShipmentId());
                    List<Order> orders = orderRepository.findByShipmentId(shipment.getShipmentId());
                    System.out.println("    Found " + orders.size() + " orders");
                    result.add(new ShipmentWithOrdersDTO(shipment, orders));
                } catch (Exception e) {
                    System.err.println("    ERROR processing shipment " + shipment.getShipmentId() + ": " + e.getMessage());
                    e.printStackTrace();
                    // Continue with next shipment instead of failing completely
                }
            }
            
            System.out.println("=== Returning " + result.size() + " shipments with orders");
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            System.err.println("=== ERROR fetching shipments for keycloakId " + keycloakId + ": " + e.getClass().getName() + " - " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }
}

