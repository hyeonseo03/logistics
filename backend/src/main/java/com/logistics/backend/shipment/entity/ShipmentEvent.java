package com.logistics.backend.shipment.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

// 배송 이력 한 줄 (배송 조회 타임라인의 한 칸)
@Entity
@Table(name = "shipment_events")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ShipmentEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shipment_id", nullable = false)
    private Shipment shipment;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ShipmentStatus status;

    @Column(nullable = false)
    private String location; // 예: "서울 물류센터", "경기 캠프"

    @Column(nullable = false)
    private String message;  // 예: "상품이 출고되었습니다."

    @Column(nullable = false)
    private LocalDateTime occurredAt;

    public ShipmentEvent(Shipment shipment, ShipmentStatus status, String location, String message,
                         LocalDateTime occurredAt) {
        this.shipment = shipment;
        this.status = status;
        this.location = location;
        this.message = message;
        this.occurredAt = occurredAt;
    }
}
