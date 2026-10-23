package com.logistics.backend.order.repository;

import com.logistics.backend.order.entity.OrderStatusHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OrderStatusHistoryRepository extends JpaRepository<OrderStatusHistory, Long> {

    List<OrderStatusHistory> findAllByOrderIdOrderByIdAsc(Long orderId);
}
