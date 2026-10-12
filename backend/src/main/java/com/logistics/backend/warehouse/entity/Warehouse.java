package com.logistics.backend.warehouse.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "warehouses")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Warehouse {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING) // DB에 "SEOUL" 같은 글자로 저장 (숫자로 저장하면 enum 순서가 바뀔 때 데이터가 꼬인다)
    @Column(nullable = false)
    private WarehouseRegion region;

    @Column(nullable = false)
    private String address;

    @Column(nullable = false)
    private boolean sameDayShipping; // 이 센터에서 당일 출고가 가능한지

    @Column(nullable = false)
    private LocalDateTime createdAt;

    public Warehouse(String name, WarehouseRegion region, String address, boolean sameDayShipping) {
        this.name = name;
        this.region = region;
        this.address = address;
        this.sameDayShipping = sameDayShipping;
        this.createdAt = LocalDateTime.now();
    }
}
