package com.shipping.orderservice.controller;

import java.io.ByteArrayOutputStream;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.properties.TextAlignment;
import org.springframework.web.bind.annotation.RestController;

import com.shipping.orderservice.model.Order;
import com.shipping.orderservice.repository.OrderRepository;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderRepository repository;
    private final JdbcTemplate jdbcTemplate;

    public OrderController(OrderRepository repository, JdbcTemplate jdbcTemplate) {
        this.repository = repository;
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping
    public List<Map<String, Object>> getAllOrders() {
        // Use JdbcTemplate directly to execute the custom query with JOINs
        String sql = """
            SELECT 
                o.order_id::text as "orderId",
                o.costumer_id::text as "customerId",
                TRIM(CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, ''))) as "customerName",
                o.carrier_id::text as "carrierId",
                o.origin_address as "originAddress",
                o.destination_address as "destinationAddress",
                o.weight as "weight",
                o.status as "status",
                o.order_date as "orderDate"
            FROM "Orders" o
            LEFT JOIN "Costumer" c ON o.costumer_id = c.user_id
            LEFT JOIN "Users" u ON c.user_id = u.id
            ORDER BY o.order_date DESC
            """;
        
        List<Map<String, Object>> orders = jdbcTemplate.queryForList(sql);
        System.out.println("=== DEBUG: Orders fetched: " + orders.size());
        if (!orders.isEmpty()) {
            System.out.println("Sample order: " + orders.get(0));
        }
        return orders;
    }

    @GetMapping("/native")
    public List<Map<String, Object>> getAllOrdersNative() {
        // Use a literal query to the case-sensitive table name created in Supabase
        return jdbcTemplate.queryForList("SELECT * FROM \"Orders\" LIMIT 100");
    }

    @PostMapping
    public Order createOrder(@RequestBody Order order) {
        return repository.save(order);
    }

    @PatchMapping("/{orderId}/assign")
    public Order assignCarrier(
            @PathVariable UUID orderId,
            @RequestParam UUID carrierId) {
        Order order = repository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));
        
        // Validate that order doesn't already have a carrier assigned
        if (order.getCarrierId() != null) {
            throw new RuntimeException("Order already has a carrier assigned");
        }
        
        order.setCarrierId(carrierId);
        // Keep status as Pending - only changes to InTransit when dispatched
        order.setStatus("Pending");
        return repository.save(order);
    }

    @PutMapping("/{orderId}")
    public Order updateOrder(@PathVariable UUID orderId, @RequestBody Order updatedOrder) {
        Order order = repository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));
        
        // Update fields
        order.setOriginAddress(updatedOrder.getOriginAddress());
        order.setDestinationAddress(updatedOrder.getDestinationAddress());
        order.setWeight(updatedOrder.getWeight());
        order.setCarrierId(updatedOrder.getCarrierId());
        order.setStatus(updatedOrder.getStatus());
        
        return repository.save(order);
    }

    @GetMapping("/track/{trackingId}")
    public ResponseEntity<Map<String, Object>> trackOrder(@PathVariable UUID trackingId) {
        try {
            String sql = """
                SELECT 
                    o.tracking_id::text as "trackingId",
                    o.order_date as "orderDate",
                    o.origin_address as "originAddress",
                    o.destination_address as "destinationAddress",
                    o.weight as "weight",
                    o.status as "status",
                    o.shipment_id::text as "shipmentId",
                    o.actual_delivery_time as "actualDeliveryTime",
                    o.pod as "proofOfDelivery",
                    c.name as "carrierName",
                    c.carrier_id::text as "carrierId"
                FROM "Orders" o
                LEFT JOIN "Carrier" c ON o.carrier_id = c.carrier_id
                WHERE o.tracking_id = ?
                """;
            
            List<Map<String, Object>> results = jdbcTemplate.queryForList(sql, trackingId);
            
            if (results.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            
            return ResponseEntity.ok(results.get(0));
            
        } catch (Exception e) {
            throw new RuntimeException("Error tracking order: " + e.getMessage());
        }
    }

    @GetMapping("/{orderId}/packing-slip")
    public ResponseEntity<byte[]> generatePackingSlip(@PathVariable UUID orderId) {
        try {
            Order order = repository.findById(orderId)
                    .orElseThrow(() -> new RuntimeException("Order not found"));
            
            // Get carrier name
            String carrierName = "Unknown";
            if (order.getCarrierId() != null) {
                List<Map<String, Object>> carriers = jdbcTemplate.queryForList(
                    "SELECT name FROM \"Carrier\" WHERE carrier_id = ?", 
                    order.getCarrierId()
                );
                if (!carriers.isEmpty()) {
                    carrierName = (String) carriers.get(0).get("name");
                }
            }
            
            // Generate PDF
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            PdfWriter writer = new PdfWriter(baos);
            PdfDocument pdf = new PdfDocument(writer);
            Document document = new Document(pdf);
            
            // Add content
            document.add(new Paragraph("PACKING SLIP")
                    .setFontSize(20)
                    .setBold()
                    .setTextAlignment(TextAlignment.CENTER));
            document.add(new Paragraph("\n"));
            
            document.add(new Paragraph("Order ID: " + order.getOrderId()));
            document.add(new Paragraph("Date: " + order.getOrderDate()));
            document.add(new Paragraph("Status: " + order.getStatus()));
            document.add(new Paragraph("\n"));
            
            document.add(new Paragraph("SHIPPING DETAILS").setBold());
            document.add(new Paragraph("From: " + order.getOriginAddress()));
            document.add(new Paragraph("To: " + order.getDestinationAddress()));
            document.add(new Paragraph("Weight: " + order.getWeight() + " kg"));
            document.add(new Paragraph("Carrier: " + carrierName));
            document.add(new Paragraph("\n"));
            
            document.add(new Paragraph("Customer ID: " + order.getCustomerId()));
            
            document.close();
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("attachment", 
                "packing-slip-" + order.getOrderId() + ".pdf");
            
            return ResponseEntity.ok()
                    .headers(headers)
                    .body(baos.toByteArray());
                    
        } catch (Exception e) {
            throw new RuntimeException("Error generating packing slip: " + e.getMessage());
        }
    }
}
