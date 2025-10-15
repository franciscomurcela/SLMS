package com.shipping.orderservice.repository;

import com.shipping.orderservice.model.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public interface OrderRepository extends JpaRepository<Order, UUID> {
    
    @Query(value = """
        SELECT 
            o.order_id as "orderId",
            o.costumer_id as "customerId",
            CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, '')) as "customerName",
            o.carrier_id as "carrierId",
            o.origin_address as "originAddress",
            o.destination_address as "destinationAddress",
            o.weight as "weight",
            o.status as "status",
            o.order_date as "orderDate"
        FROM "Orders" o
        LEFT JOIN "Costumer" c ON o.costumer_id = c.user_id
        LEFT JOIN "Users" u ON c.user_id = u.id
        ORDER BY o.order_date DESC
        """, nativeQuery = true)
    List<Map<String, Object>> findAllOrdersWithCustomerNames();
}
