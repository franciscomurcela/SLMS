package com.shipping.orderservice.controller;

import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import javax.imageio.ImageIO;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.itextpdf.io.image.ImageDataFactory;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Image;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.properties.TextAlignment;
import com.shipping.orderservice.dto.ReportAnomalyRequest;
import com.shipping.orderservice.model.Order;
import com.shipping.orderservice.repository.OrderRepository;
import com.shipping.orderservice.service.NotificationClient;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin(origins = "*")
public class OrderController {

    private final OrderRepository repository;
    private final JdbcTemplate jdbcTemplate;
    private final NotificationClient notificationClient;

    public OrderController(OrderRepository repository, JdbcTemplate jdbcTemplate, NotificationClient notificationClient) {
        this.repository = repository;
        this.jdbcTemplate = jdbcTemplate;
        this.notificationClient = notificationClient;
    }

    @GetMapping
    public ResponseEntity<?> getAllOrders() {
        try {
            // Use JdbcTemplate directly to execute the custom query with JOINs
            String sql = """
                SELECT 
                    o.order_id::text as "orderId",
                    o.costumer_id::text as "customerId",
                    TRIM(CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, ''))) as "customerName",
                    o.carrier_id::text as "carrierId",
                    o.shipment_id::text as "shipmentId",
                    o.origin_address as "originAddress",
                    o.destination_address as "destinationAddress",
                    o.weight as "weight",
                    o.status as "status",
                    o.order_date as "orderDate",
                    o.error_message as "errorMessage"
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
            return ResponseEntity.ok(orders);
        } catch (Exception e) {
            System.err.println("=== ERROR fetching orders: " + e.getClass().getName() + " - " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of(
                "error", e.getClass().getSimpleName(),
                "message", e.getMessage() != null ? e.getMessage() : "Unknown error"
            ));
        }
    }

    @GetMapping("/health")
    public ResponseEntity<?> health() {
        try {
            jdbcTemplate.queryForObject("SELECT 1", Integer.class);
            return ResponseEntity.ok(Map.of("status", "ok"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                "status", "error",
                "details", e.getMessage()
            ));
        }
    }

    @GetMapping("/native")
    public List<Map<String, Object>> getAllOrdersNative() {
        // Use a literal query to the case-sensitive table name created in Supabase
        return jdbcTemplate.queryForList("SELECT * FROM \"Orders\" LIMIT 100");
    }

    @GetMapping("/my-shipments/{carrierId}")
    public ResponseEntity<?> getMyShipments(@PathVariable String carrierId) {
        try {
            String sql = """
                SELECT 
                    s.shipment_id::text as "shipmentId",
                    s.carrier_id::text as "carrierId",
                    s.status as "status",
                    s.origin_address as "originAddress",
                    s.destination_address as "destinationAddress",
                    s.created_at as "createdAt",
                    s.estimated_delivery as "estimatedDelivery",
                    COALESCE(
                        (SELECT COUNT(*) FROM "Orders" o WHERE o.shipment_id = s.shipment_id), 0
                    ) as "orderCount"
                FROM "Shipments" s
                WHERE s.carrier_id = ?::uuid
                ORDER BY s.created_at DESC
                """;
            
            List<Map<String, Object>> shipments = jdbcTemplate.queryForList(sql, carrierId);
            return ResponseEntity.ok(shipments);
        } catch (Exception e) {
            System.err.println("=== ERROR fetching shipments: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of(
                "error", e.getClass().getSimpleName(),
                "message", e.getMessage() != null ? e.getMessage() : "Unknown error"
            ));
        }
    }

    @PostMapping
    public Order createOrder(@RequestBody Order order) {
        Order savedOrder = repository.save(order);
        
        // Notify all warehouse staff about new order
        try {
            String customerNameSql = """
                SELECT TRIM(CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, ''))) as customer_name
                FROM "Costumer" c
                LEFT JOIN "Users" u ON c.user_id = u.id
                WHERE c.user_id = ?
                """;
            
            String customerName = "Cliente";
            try {
                Map<String, Object> customerResult = jdbcTemplate.queryForMap(customerNameSql, order.getCustomerId());
                customerName = (String) customerResult.get("customer_name");
                if (customerName == null || customerName.trim().isEmpty()) {
                    customerName = "Cliente";
                }
            } catch (Exception e) {
                System.err.println("Could not fetch customer name: " + e.getMessage());
            }
            
            // Get all warehouse staff Users.id (Notifications FK points to Users.id, not keycloak_id)
            String warehouseStaffSql = "SELECT u.id FROM \"WarehouseStaff\" ws " +
                    "JOIN \"Users\" u ON ws.user_id = u.id";
            List<UUID> warehouseStaffUserIds = jdbcTemplate.queryForList(warehouseStaffSql, UUID.class);
            
            notificationClient.notifyAllWarehouseStaff(savedOrder.getOrderId(), customerName, warehouseStaffUserIds);
            
            // Notify customer about order creation
            notificationClient.notifyOrderCreated(savedOrder.getOrderId(), order.getCustomerId());
        } catch (Exception e) {
            System.err.println("Failed to send new order notifications: " + e.getMessage());
            // Don't fail the order creation if notification fails
        }
        
        return savedOrder;
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
        
        // Track carrier change for notification
        UUID oldCarrierId = order.getCarrierId();
        UUID newCarrierId = updatedOrder.getCarrierId();
        
        // Track status change for customer notification
        String oldStatus = order.getStatus();
        String newStatus = updatedOrder.getStatus();
        boolean statusChanged = !oldStatus.equals(newStatus);
        
        // Detect carrier change: either from one carrier to another, OR from null to a carrier (first assignment)
        boolean carrierChanged = (oldCarrierId != null && newCarrierId != null && !oldCarrierId.equals(newCarrierId)) ||
                                 (oldCarrierId == null && newCarrierId != null);
        
        String oldCarrierName = null;
        String newCarrierName = null;
        
        if (carrierChanged) {
            try {
                String carrierNameSql = "SELECT name FROM \"Carrier\" WHERE carrier_id = ?";
                
                // Get old carrier name if it exists
                if (oldCarrierId != null) {
                    oldCarrierName = jdbcTemplate.queryForObject(carrierNameSql, String.class, oldCarrierId);
                } else {
                    oldCarrierName = "Não Definido";
                }
                
                // Get new carrier name
                newCarrierName = jdbcTemplate.queryForObject(carrierNameSql, String.class, newCarrierId);
            } catch (Exception e) {
                System.err.println("Could not fetch carrier names: " + e.getMessage());
            }
        }
        
        // Update fields
        order.setOriginAddress(updatedOrder.getOriginAddress());
        order.setDestinationAddress(updatedOrder.getDestinationAddress());
        order.setWeight(updatedOrder.getWeight());
        order.setCarrierId(newCarrierId);
        order.setStatus(updatedOrder.getStatus());
        
        Order savedOrder = repository.save(order);
        
        // Notify warehouse staff about carrier change or assignment
        if (carrierChanged && newCarrierName != null) {
            try {
                // Get Users.id from Users table (Notifications FK points to Users.id, not keycloak_id)
                String warehouseStaffSql = "SELECT u.id FROM \"WarehouseStaff\" ws " +
                        "JOIN \"Users\" u ON ws.user_id = u.id";
                List<UUID> warehouseStaffUserIds = jdbcTemplate.queryForList(warehouseStaffSql, UUID.class);
                
                for (UUID userId : warehouseStaffUserIds) {
                    notificationClient.notifyCarrierChange(orderId, oldCarrierName, newCarrierName, userId);
                }
                
                System.out.println("Sent carrier change notifications: " + oldCarrierName + " -> " + newCarrierName);
            } catch (Exception e) {
                System.err.println("Failed to send carrier change notifications: " + e.getMessage());
                e.printStackTrace();
            }
        }
        
        // Notify customer about status change
        if (statusChanged) {
            try {
                notificationClient.notifyOrderStatusChange(orderId, oldStatus, newStatus, order.getCustomerId());
                
                // If status changed to InTransit, also send dispatch notification
                if ("InTransit".equals(newStatus) && newCarrierName != null) {
                    notificationClient.notifyOrderDispatched(orderId, newCarrierName, order.getCustomerId());
                }
                
                // If status changed to Failed, send failure notification to customer and warehouse staff
                if ("Failed".equals(newStatus)) {
                    String errorMessage = updatedOrder.getErrorMessage();
                    if (errorMessage == null || errorMessage.trim().isEmpty()) {
                        errorMessage = "Erro desconhecido";
                    }
                    
                    // Notify customer
                    notificationClient.notifyOrderFailed(orderId, errorMessage, order.getCustomerId());
                    
                    // Notify all warehouse staff
                    String warehouseStaffSql = "SELECT u.id FROM \"WarehouseStaff\" ws " +
                            "JOIN \"Users\" u ON ws.user_id = u.id";
                    List<UUID> warehouseStaffUserIds = jdbcTemplate.queryForList(warehouseStaffSql, UUID.class);
                    notificationClient.notifyAllWarehouseStaffOrderFailed(orderId, errorMessage, warehouseStaffUserIds);
                    
                    System.out.println("Sent order failure notifications for order " + orderId);
                }
                
                System.out.println("Sent status change notification to customer: " + oldStatus + " -> " + newStatus);
            } catch (Exception e) {
                System.err.println("Failed to send status change notification to customer: " + e.getMessage());
            }
        }
        
        // If order was updated to InTransit and has a shipment, check if all orders in shipment are InTransit
        if ("InTransit".equals(updatedOrder.getStatus()) && order.getShipmentId() != null) {
            checkAndUpdateShipmentStatus(order.getShipmentId());
        }
        
        return savedOrder;
    }
    
    /**
     * Check if all orders in a shipment are InTransit and update shipment status accordingly
     */
    private void checkAndUpdateShipmentStatus(UUID shipmentId) {
        try {
            String checkSql = """
                SELECT COUNT(*) as total,
                       SUM(CASE WHEN status = 'InTransit' THEN 1 ELSE 0 END) as intransit_count
                FROM "Orders"
                WHERE shipment_id = ?
                """;
            
            Map<String, Object> result = jdbcTemplate.queryForMap(checkSql, shipmentId);
            int total = ((Number) result.get("total")).intValue();
            int inTransitCount = ((Number) result.get("intransit_count")).intValue();
            
            System.out.println("=== Shipment " + shipmentId + ": " + inTransitCount + "/" + total + " orders InTransit");
            
            // If all orders are InTransit, update shipment to InTransit
            if (total > 0 && inTransitCount == total) {
                String updateShipmentSql = "UPDATE \"Shipments\" SET status = 'InTransit' WHERE shipment_id = ?";
                int rowsAffected = jdbcTemplate.update(updateShipmentSql, shipmentId);
                System.out.println("=== Updated shipment " + shipmentId + " to InTransit (rows affected: " + rowsAffected + ")");
            }
        } catch (Exception e) {
            System.err.println("=== ERROR checking/updating shipment status: " + e.getMessage());
            e.printStackTrace();
        }
    }

    @GetMapping("/track/{trackingId}")
    public ResponseEntity<Map<String, Object>> trackOrder(@PathVariable String trackingId) {
        try {
            String sql = """
                SELECT 
                    o.tracking_id as "trackingId",
                    o.order_date as "orderDate",
                    o.origin_address as "originAddress",
                    o.destination_address as "destinationAddress",
                    o.weight as "weight",
                    o.status as "status",
                    o.shipment_id::text as "shipmentId",
                    o.actual_delivery_time as "actualDeliveryTime",
                    o.pod as "proofOfDelivery",
                    o.error_message as "errorMessage",
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
            
            Map<String, Object> result = results.get(0);
            
            // Convert POD bytea to base64 string if it exists
            if (result.get("proofOfDelivery") != null) {
                byte[] podBytes = (byte[]) result.get("proofOfDelivery");
                String base64Pod = java.util.Base64.getEncoder().encodeToString(podBytes);
                result.put("proofOfDelivery", base64Pod);
                System.out.println("=== Converted POD to base64, size: " + base64Pod.length() + " chars");
            }
            
            return ResponseEntity.ok(result);
            
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

    @GetMapping("/{orderId}/shipping-label")
    public ResponseEntity<byte[]> generateShippingLabel(@PathVariable UUID orderId) {
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
            
            // Generate QR Code for tracking
            String trackingData = order.getOrderId().toString();
            QRCodeWriter qrCodeWriter = new QRCodeWriter();
            BitMatrix bitMatrix = qrCodeWriter.encode(trackingData, BarcodeFormat.QR_CODE, 150, 150);
            BufferedImage qrImage = MatrixToImageWriter.toBufferedImage(bitMatrix);
            ByteArrayOutputStream qrBaos = new ByteArrayOutputStream();
            ImageIO.write(qrImage, "PNG", qrBaos);
            byte[] qrBytes = qrBaos.toByteArray();
            
            // Generate PDF
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            PdfWriter writer = new PdfWriter(baos);
            PdfDocument pdf = new PdfDocument(writer);
            Document document = new Document(pdf);
            
            // Add title
            document.add(new Paragraph("SHIPPING LABEL")
                    .setFontSize(24)
                    .setBold()
                    .setTextAlignment(TextAlignment.CENTER));
            document.add(new Paragraph("\n"));
            
            // Add carrier logo/name
            document.add(new Paragraph(carrierName)
                    .setFontSize(18)
                    .setBold()
                    .setTextAlignment(TextAlignment.CENTER));
            document.add(new Paragraph("\n"));
            
            // Add recipient address (larger font)
            document.add(new Paragraph("DELIVER TO:")
                    .setFontSize(12)
                    .setBold());
            document.add(new Paragraph(order.getDestinationAddress())
                    .setFontSize(16)
                    .setBold());
            document.add(new Paragraph("\n"));
            
            // Add origin address
            document.add(new Paragraph("FROM:")
                    .setFontSize(10)
                    .setBold());
            document.add(new Paragraph(order.getOriginAddress())
                    .setFontSize(12));
            document.add(new Paragraph("\n"));
            
            // Add weight and tracking info
            document.add(new Paragraph("Weight: " + order.getWeight() + " kg")
                    .setFontSize(12));
            document.add(new Paragraph("Tracking ID: " + order.getOrderId().toString().substring(0, 13))
                    .setFontSize(10));
            document.add(new Paragraph("\n"));
            
            // Add QR Code
            Image qrCodeImage = new Image(ImageDataFactory.create(qrBytes));
            qrCodeImage.setHorizontalAlignment(com.itextpdf.layout.properties.HorizontalAlignment.CENTER);
            document.add(qrCodeImage);
            
            document.add(new Paragraph("Scan for tracking")
                    .setFontSize(10)
                    .setTextAlignment(TextAlignment.CENTER));
            
            document.close();
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("attachment", 
                "shipping-label-" + order.getOrderId() + ".pdf");
            
            
            return ResponseEntity.ok()
                    .headers(headers)
                    .body(baos.toByteArray());
                    
        } catch (Exception e) {
            throw new RuntimeException("Error generating shipping label: " + e.getMessage());
        }
    }

    /**
     * Get all orders for a specific customer by their keycloak ID
     * @param keycloakId The keycloak ID of the customer
     * @return List of orders for this customer
     */
    @GetMapping("/my-orders/{keycloakId}")
    public ResponseEntity<?> getMyOrders(@PathVariable String keycloakId) {
        try {
            System.out.println("=== Fetching orders for customer keycloakId: " + keycloakId);
            
            String sql = """
                SELECT 
                    o.order_id::text as "orderId",
                    o.costumer_id::text as "customerId",
                    TRIM(CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, ''))) as "customerName",
                    o.carrier_id::text as "carrierId",
                    car.name as "carrierName",
                    o.origin_address as "originAddress",
                    o.destination_address as "destinationAddress",
                    o.weight as "weight",
                    o.status as "status",
                    o.order_date as "orderDate",
                    o.tracking_id as "trackingId"
                FROM "Orders" o
                LEFT JOIN "Costumer" c ON o.costumer_id = c.user_id
                LEFT JOIN "Users" u ON c.user_id = u.id
                LEFT JOIN "Carrier" car ON o.carrier_id = car.carrier_id
                WHERE u.keycloak_id::text = ?
                ORDER BY o.order_date DESC
                """;
            
            List<Map<String, Object>> orders = jdbcTemplate.queryForList(sql, keycloakId);
            System.out.println("=== Found " + orders.size() + " orders for customer");
            
            return ResponseEntity.ok(orders);
        } catch (Exception e) {
            System.err.println("=== ERROR fetching orders for customer: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of(
                "error", e.getClass().getSimpleName(),
                "message", e.getMessage() != null ? e.getMessage() : "Unknown error"
            ));
        }
    }

    @PostMapping("/confirm-delivery")
    public ResponseEntity<?> confirmDelivery(@RequestBody com.shipping.orderservice.dto.ConfirmDeliveryRequest request) {
        try {
            System.out.println("=== Confirming delivery for order: " + request.getOrderId());
            
            // Validar dados de entrada
            if (request.getOrderId() == null || request.getProofData() == null) {
                return ResponseEntity.badRequest().body(Map.of(
                    "error", "Missing required fields",
                    "message", "orderId and proofData are required"
                ));
            }
            
            // Verificar se a ordem existe
            String checkOrderSql = "SELECT COUNT(*) FROM \"Orders\" WHERE order_id::text = ?";
            Integer count = jdbcTemplate.queryForObject(checkOrderSql, Integer.class, request.getOrderId());
            
            if (count == null || count == 0) {
                return ResponseEntity.notFound().build();
            }
            
            // Decodificar os dados base64
            byte[] proofOfDelivery;
            try {
                proofOfDelivery = java.util.Base64.getDecoder().decode(request.getProofData());
                System.out.println("=== Decoded proof data size: " + proofOfDelivery.length + " bytes");
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest().body(Map.of(
                    "error", "Invalid base64 data",
                    "message", "proofData must be valid base64 encoded data"
                ));
            }
            
            // Atualizar a ordem com a prova de entrega
            String updateSql = """
                UPDATE "Orders" 
                SET pod = ?, 
                    actual_delivery_time = CURRENT_TIMESTAMP,
                    status = 'Delivered'
                WHERE order_id::text = ?
                """;
            
            int updated = jdbcTemplate.update(updateSql, proofOfDelivery, request.getOrderId());
            
            if (updated > 0) {
                System.out.println("=== Successfully confirmed delivery for order: " + request.getOrderId());
                
                // Log adicional se temos localização
                if (request.getLocation() != null) {
                    System.out.println("=== Delivery location: " + 
                        request.getLocation().getLatitude() + ", " + 
                        request.getLocation().getLongitude());
                }
                
                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Delivery confirmed successfully",
                    "orderId", request.getOrderId(),
                    "proofType", request.getProofType(),
                    "timestamp", request.getTimestamp()
                ));
            } else {
                return ResponseEntity.status(500).body(Map.of(
                    "error", "Update failed",
                    "message", "Failed to update order with delivery confirmation"
                ));
            }
            
        } catch (Exception e) {
            System.err.println("=== ERROR confirming delivery: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of(
                "error", e.getClass().getSimpleName(),
                "message", e.getMessage() != null ? e.getMessage() : "Unknown error occurred"
            ));
        }
    }

    @PostMapping("/report-anomaly")
    public ResponseEntity<Map<String, Object>> reportAnomaly(@RequestBody ReportAnomalyRequest request) {
        try {
            System.out.println("=== REPORTING ANOMALY ===");
            System.out.println("Order ID: " + request.getOrderId());
            System.out.println("Error Message: " + request.getErrorMessage());

            // Validate input
            if (request.getOrderId() == null || request.getOrderId().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "error", "ValidationError",
                    "message", "Order ID is required"
                ));
            }

            if (request.getErrorMessage() == null || request.getErrorMessage().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "error", "ValidationError", 
                    "message", "Error message is required"
                ));
            }

            // Check if order exists
            String checkSql = "SELECT COUNT(*) FROM \"Orders\" WHERE order_id = ?::uuid";
            Integer count = jdbcTemplate.queryForObject(checkSql, Integer.class, request.getOrderId());
            
            if (count == null || count == 0) {
                return ResponseEntity.badRequest().body(Map.of(
                    "error", "OrderNotFound",
                    "message", "Order not found with order ID: " + request.getOrderId()
                ));
            }

            // Update order status to Failed and set error message
            String updateSql = "UPDATE \"Orders\" SET status = 'Failed', error_message = ? WHERE order_id = ?::uuid";
            int rowsAffected = jdbcTemplate.update(updateSql, request.getErrorMessage(), request.getOrderId());

            if (rowsAffected > 0) {
                System.out.println("Successfully reported anomaly for order: " + request.getOrderId());
                UUID orderId = UUID.fromString(request.getOrderId());
                
                try {
                    // Get order details including customer ID
                    String orderSql = "SELECT costumer_id FROM \"Orders\" WHERE order_id = ?::uuid";
                    UUID customerId = jdbcTemplate.queryForObject(orderSql, UUID.class, request.getOrderId());
                    
                    // Get customer email
                    String customerEmailSql = "SELECT u.email FROM \"Costumer\" c " +
                            "JOIN \"Users\" u ON c.user_id = u.id WHERE c.user_id = ?";
                    String customerEmail = jdbcTemplate.queryForObject(customerEmailSql, String.class, customerId);
                    
                    // 1. Notify all CSRs about the anomaly (with customer email)
                    String csrSql = "SELECT u.id FROM \"Csr\" csr " +
                            "JOIN \"Users\" u ON csr.user_id = u.id";
                    List<UUID> csrUserIds = jdbcTemplate.queryForList(csrSql, UUID.class);
                    notificationClient.notifyAllCSRs(orderId, "Anomalia de Entrega", request.getErrorMessage(), customerEmail, csrUserIds);
                    System.out.println("Sent anomaly notifications to " + csrUserIds.size() + " CSRs");
                    
                    // 2. Notify customer about the anomaly report
                    notificationClient.notifyOrderFailed(orderId, request.getErrorMessage(), customerId);
                    System.out.println("Sent anomaly notification to customer");
                    
                    // 3. Notify all warehouse staff
                    String warehouseStaffSql = "SELECT u.id FROM \"WarehouseStaff\" ws " +
                            "JOIN \"Users\" u ON ws.user_id = u.id";
                    List<UUID> warehouseStaffUserIds = jdbcTemplate.queryForList(warehouseStaffSql, UUID.class);
                    notificationClient.notifyAllWarehouseStaffOrderFailed(orderId, request.getErrorMessage(), warehouseStaffUserIds);
                    System.out.println("Sent anomaly notifications to " + warehouseStaffUserIds.size() + " warehouse staff");
                    
                } catch (Exception e) {
                    System.err.println("Failed to send anomaly notifications: " + e.getMessage());
                    e.printStackTrace();
                }
                
                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Anomaly reported successfully",
                    "orderId", request.getOrderId(),
                    "errorMessage", request.getErrorMessage(),
                    "newStatus", "Failed"
                ));
            } else {
                return ResponseEntity.status(500).body(Map.of(
                    "error", "Update failed",
                    "message", "Failed to update order with anomaly report"
                ));
            }
            
        } catch (Exception e) {
            System.err.println("=== ERROR reporting anomaly: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of(
                "error", e.getClass().getSimpleName(),
                "message", e.getMessage() != null ? e.getMessage() : "Unknown error occurred"
            ));
        }
    }
}

