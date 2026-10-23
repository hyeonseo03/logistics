package com.logistics.backend.shipment.entity;

import com.logistics.backend.order.entity.Order;
import com.logistics.backend.warehouse.entity.Warehouse;
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
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

// 배송 (주문 1건에 배송 1건). 주문할 때 함께 만들어지고, 주문 상태가 바뀔 때 같이 바뀐다
@Entity
@Table(name = "shipments")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Shipment {

    public static final String COURIER = "Logistics 자체배송";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false, unique = true)
    private Order order;

    // 대표 출고 센터 (주문 상품이 여러 센터에서 나가면 첫 번째 상품의 센터. 상품별 센터는 order_items 에 있다)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "warehouse_id", nullable = false)
    private Warehouse warehouse;

    @Column(nullable = false)
    private String courier;

    private String trackingNumber; // 출고 전에는 null

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ShipmentStatus status;

    private LocalDateTime shippedAt;   // 센터 출발 시각
    private LocalDateTime inTransitAt; // 배송지 근처 캠프 도착 시각
    private LocalDateTime deliveredAt;

    public Shipment(Order order, Warehouse warehouse) {
        this.order = order;
        this.warehouse = warehouse;
        this.courier = COURIER;
        this.status = ShipmentStatus.PREPARING;
    }

    public void changeStatus(ShipmentStatus status, LocalDateTime at) {
        this.status = status;
        switch (status) {
            case SHIPPED -> {
                this.shippedAt = at;
                // 가짜 운송장 번호: LG + 출고일 + 주문번호 6자리 (예: LG20261023000012)
                this.trackingNumber = String.format("LG%tY%<tm%<td%06d", at, order.getId());
            }
            case IN_TRANSIT -> this.inTransitAt = at;
            case DELIVERED -> this.deliveredAt = at;
            default -> {
            }
        }
    }
}
