package com.logistics.backend.order.repository;

import com.logistics.backend.order.entity.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {

    // 이 상품이 주문된 적이 있는지 (주문 이력이 있으면 상품을 지울 수 없다)
    boolean existsByProductId(Long productId);
}
