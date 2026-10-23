package com.logistics.backend.order.repository;

import com.logistics.backend.order.entity.OrderItem;
import com.logistics.backend.order.entity.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Collection;
import java.util.List;

public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {

    // 이 상품이 주문된 적이 있는지 (주문 이력이 있으면 상품을 지울 수 없다)
    boolean existsByProductId(Long productId);

    // 통계용: 환불되지 않은 주문의 주문 상품 전부 (상품·카테고리·출고 센터까지 한 번에)
    @Query("select i from OrderItem i join fetch i.order o join fetch i.product p join fetch p.category"
            + " join fetch i.warehouse where o.status not in :excluded")
    List<OrderItem> findAllForAnalytics(Collection<OrderStatus> excluded);
}
