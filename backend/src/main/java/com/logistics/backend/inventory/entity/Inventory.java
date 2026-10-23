package com.logistics.backend.inventory.entity;

import com.logistics.backend.product.entity.Product;
import com.logistics.backend.warehouse.entity.Warehouse;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

// 어느 물류센터에 어떤 상품이 몇 개 있는지. 같은 상품·같은 센터 조합은 한 줄만 있을 수 있다
@Entity
@Table(
        name = "inventories",
        uniqueConstraints = @UniqueConstraint(columnNames = {"product_id", "warehouse_id"})
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Inventory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "warehouse_id", nullable = false)
    private Warehouse warehouse;

    @Column(nullable = false)
    private int quantity; // 현재 재고 (창고에 실제로 있는 수량)

    @Column(nullable = false)
    private int reservedQuantity; // 예약 재고 (주문은 들어왔지만 아직 출고되지 않은 수량)

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    public Inventory(Product product, Warehouse warehouse, int quantity, int reservedQuantity) {
        this.product = product;
        this.warehouse = warehouse;
        this.quantity = quantity;
        this.reservedQuantity = reservedQuantity;
    }

    // 판매가능재고 = 현재재고 - 예약재고 (음수면 0)
    public int getAvailableQuantity() {
        return Math.max(0, quantity - reservedQuantity);
    }

    // 관리자 재고 조정 (현재재고를 이 값으로 바꾼다)
    public void changeQuantity(int quantity) {
        this.quantity = quantity;
    }

    // 저장(INSERT)·수정(UPDATE) 직전에 JPA가 자동으로 불러서 수정 시각을 기록한다
    @PrePersist
    @PreUpdate
    void touchUpdatedAt() {
        this.updatedAt = LocalDateTime.now();
    }
}
