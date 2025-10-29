package com.shipping.orderservice.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.shipping.orderservice.model.Shipment;
import com.shipping.orderservice.model.Shipment.ShipmentStatus;

@Repository
public interface ShipmentRepository extends JpaRepository<Shipment, UUID> {
    
    /**
     * Find all shipments assigned to a specific driver
     */
    List<Shipment> findByDriverId(UUID driverId);
    
    /**
     * Find all shipments for a specific driver with a specific status
     */
    List<Shipment> findByDriverIdAndStatus(UUID driverId, ShipmentStatus status);
    
    /**
     * Find all shipments by status
     */
    List<Shipment> findByStatus(ShipmentStatus status);
    
    /**
     * Find all shipments for a specific carrier
     */
    List<Shipment> findByCarrierId(UUID carrierId);
    
    /**
     * Find InTransit shipments for a user (navigating through Users and Driver tables)
     * Navigation: keycloakId (JWT sub) → Users.keycloak_id → Users.id → Driver.user_id → Driver.driver_id → Shipments.driver_id
     * 
     * @param keycloakId The keycloak_id (which comes from JWT sub claim)
     * @return List of InTransit shipments for the driver associated with this user
     */
    @Query(value = """
        SELECT s.* 
        FROM "Shipments" s
        INNER JOIN "Driver" d ON s.driver_id = d.driver_id
        INNER JOIN "Users" u ON d.user_id = u.id
        WHERE u.keycloak_id::text = :keycloakId
        AND s.status = 'InTransit'
        ORDER BY s.departure_time DESC
        """, nativeQuery = true)
    List<Shipment> findInTransitShipmentsByKeycloakId(@Param("keycloakId") String keycloakId);
}