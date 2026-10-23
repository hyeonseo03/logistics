package com.logistics.backend.order.repository;

import com.logistics.backend.order.dto.OrderStatusCount;
import com.logistics.backend.order.dto.UserOrderCount;
import com.logistics.backend.order.entity.Order;
import com.logistics.backend.order.entity.OrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, Long> {

    // 내 주문 목록 (최신 주문이 위로). 주문 상품은 application.yml 의 default_batch_fetch_size 로 묶어서 가져온다
    @Query("select o from Order o where o.user.id = :userId order by o.createdAt desc, o.id desc")
    List<Order> findAllByUserIdOrderByLatest(Long userId);

    // 내 주문만 찾는다 (다른 회원의 주문 id 를 넣으면 비어 있다 → 404)
    Optional<Order> findByIdAndUserId(Long id, Long userId);

    // ───────── 관리자 ─────────

    Page<Order> findAllByStatus(OrderStatus status, Pageable pageable);

    long countByCreatedAtGreaterThanEqualAndCreatedAtLessThan(LocalDateTime from, LocalDateTime to);

    // 기간 매출: 취소·회수완료(환불된) 주문은 뺀다
    @Query("select coalesce(sum(o.totalPrice), 0) from Order o"
            + " where o.createdAt >= :from and o.createdAt < :to and o.status not in :excluded")
    long sumSales(LocalDateTime from, LocalDateTime to, Collection<OrderStatus> excluded);

    // 상태별 주문 수 (group by 한 번)
    @Query("select new com.logistics.backend.order.dto.OrderStatusCount(o.status, count(o))"
            + " from Order o group by o.status")
    List<OrderStatusCount> countGroupByStatus();

    // 최근 N일 주문 시각 (날짜별로 묶는 건 서비스에서 한다)
    @Query("select o.createdAt from Order o where o.createdAt >= :from")
    List<LocalDateTime> findCreatedAtSince(LocalDateTime from);

    // 지연 주문: 진행 중인데 기준 시각보다 먼저 주문된 것
    long countByStatusInAndCreatedAtBefore(Collection<OrderStatus> statuses, LocalDateTime before);

    // 회원별 주문 수 (관리자 회원 목록)
    @Query("select new com.logistics.backend.order.dto.UserOrderCount(o.user.id, count(o))"
            + " from Order o where o.user.id in :userIds group by o.user.id")
    List<UserOrderCount> countByUserIds(Collection<Long> userIds);
}
