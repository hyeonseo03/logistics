package com.logistics.backend.product.entity;

import com.logistics.backend.category.entity.Category;
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

import java.time.LocalDateTime;

@Entity
@Table(name = "products")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String description;

    @Column(nullable = false)
    private int price; // 가격

    private String optionName; // 옵션이 없으면 null

    private String imageUrl; // 이미지가 없으면 null

    @Column(nullable = false)
    private LocalDateTime createdAt;

    public Product(Category category, String name, String description, int price,
                   String optionName, String imageUrl, LocalDateTime createdAt) {
        this.category = category;
        this.name = name;
        this.description = description;
        this.price = price;
        this.optionName = optionName;
        this.imageUrl = imageUrl;
        this.createdAt = createdAt;
    }
}
