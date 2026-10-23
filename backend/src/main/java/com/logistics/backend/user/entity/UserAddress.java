package com.logistics.backend.user.entity;

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

// 회원의 배송지 (회원 1명이 여러 개 가질 수 있고, 기본 배송지는 1개)
@Entity
@Table(name = "user_addresses")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class UserAddress {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String label; // 배송지 이름 (예: "집", "회사")

    @Column(nullable = false)
    private String receiverName;

    @Column(nullable = false)
    private String receiverPhone;

    @Column(nullable = false)
    private String address;

    @Column(nullable = false)
    private boolean isDefault;

    public UserAddress(User user, String label, String receiverName, String receiverPhone, String address) {
        this.user = user;
        this.label = label;
        this.receiverName = receiverName;
        this.receiverPhone = receiverPhone;
        this.address = address;
    }

    public void update(String label, String receiverName, String receiverPhone, String address) {
        this.label = label;
        this.receiverName = receiverName;
        this.receiverPhone = receiverPhone;
        this.address = address;
    }

    public void setDefault(boolean isDefault) {
        this.isDefault = isDefault;
    }
}
