package com.logistics.backend.order.repository;

import com.logistics.backend.order.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, Long> {

    // 내 주문 목록 (최신 주문이 위로). 주문 상품은 application.yml 의 default_batch_fetch_size 로 묶어서 가져온다
    @Query("select o from Order o where o.user.id = :userId order by o.createdAt desc, o.id desc")
    List<Order> findAllByUserIdOrderByLatest(Long userId);

    // 내 주문만 찾는다 (다른 회원의 주문 id 를 넣으면 비어 있다 → 404)
    Optional<Order> findByIdAndUserId(Long id, Long userId);
}
