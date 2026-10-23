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

// 결제·환불 기록 (모의 결제: 실제 PG 연동 없이 주문 즉시 결제완료로 저장)
@Entity
@Table(name = "payments")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false, unique = true)
    private Order order;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentMethod method;

    @Column(nullable = false)
    private int amount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentStatus status;

    @Column(nullable = false)
    private LocalDateTime paidAt;

    private LocalDateTime refundedAt; // 환불 전에는 null

    private String refundReason;

    public Payment(Order order, PaymentMethod method, int amount, LocalDateTime paidAt) {
        this.order = order;
        this.method = method;
        this.amount = amount;
        this.status = PaymentStatus.PAID;
        this.paidAt = paidAt;
    }

    // 환불 처리. 이미 환불됐으면 아무것도 하지 않는다 (두 번 환불되지 않게)
    public void refund(String reason, LocalDateTime refundedAt) {
        if (status == PaymentStatus.REFUNDED) {
            return;
        }
        this.status = PaymentStatus.REFUNDED;
        this.refundReason = reason;
        this.refundedAt = refundedAt;
    }
}
