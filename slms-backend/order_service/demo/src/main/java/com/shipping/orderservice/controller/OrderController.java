package com.shipping.orderservice.controller;

import java.io.ByteArrayOutputStream;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;

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
import com.itextpdf.layout.element.Image;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.io.image.ImageDataFactory;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.qrcode.QRCodeWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.client.j2se.MatrixToImageWriter;

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
}
