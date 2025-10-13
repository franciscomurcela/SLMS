package com.shipping.orderservice.controller;

import java.util.List;
import java.util.Map;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
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
    public List<Order> getAllOrders() {
        return repository.findAll();
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
}
