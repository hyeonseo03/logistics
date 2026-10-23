package com.logistics.backend.order.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

// 회수(반품) 요청. 출고된 주문을 취소하면 만들어지고, 관리자가 회수 완료 처리하면 COMPLETED 가 된다
// (Return 은 헷갈리기 쉬운 이름이라 클래스는 OrderReturn, 테이블은 returns)
@Entity
@Table(name = "returns")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class OrderReturn {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false, unique = true) // 주문 1건에 회수 1건
    private Order order;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ReturnStatus status;

    private String reason;

    @Column(nullable = false)
    private LocalDateTime requestedAt;

    private LocalDateTime completedAt;

    public OrderReturn(Order order, String reason, LocalDateTime requestedAt) {
        this.order = order;
        this.status = ReturnStatus.REQUESTED;
        this.reason = reason;
        this.requestedAt = requestedAt;
    }

    public void complete(LocalDateTime completedAt) {
        this.status = ReturnStatus.COMPLETED;
        this.completedAt = completedAt;
    }
}
