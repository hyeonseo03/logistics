package com.logistics.backend.order.repository;

import com.logistics.backend.order.entity.OrderReturn;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface OrderReturnRepository extends JpaRepository<OrderReturn, Long> {

    Optional<OrderReturn> findByOrderId(Long orderId);

    List<OrderReturn> findAllByOrderIdIn(Collection<Long> orderIds);
}
