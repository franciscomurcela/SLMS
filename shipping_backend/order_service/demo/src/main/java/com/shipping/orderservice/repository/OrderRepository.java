package com.shipping.orderservice.repository;

import com.shipping.orderservice.model.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface OrderRepository extends JpaRepository<Order, UUID> { }
