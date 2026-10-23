package com.logistics.backend.order.entity;

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
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

// 주문 상품 한 줄. 어느 물류센터에서 출고할지(warehouse)도 주문할 때 정해서 저장한다
@Entity
@Table(name = "order_items")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "warehouse_id", nullable = false)
    private Warehouse warehouse; // 출고 물류센터

    @Column(nullable = false)
    private int quantity;

    @Column(nullable = false)
    private int price; // 주문 당시 상품 1개 가격 (나중에 상품 가격이 바뀌어도 그대로)

    public OrderItem(Order order, Product product, Warehouse warehouse, int quantity, int price) {
        this.order = order;
        this.product = product;
        this.warehouse = warehouse;
        this.quantity = quantity;
        this.price = price;
    }

    public int getLineTotal() {
        return price * quantity;
    }
}
