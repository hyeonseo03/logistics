package com.logistics.backend.product.repository;

import com.logistics.backend.product.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface ProductRepository extends JpaRepository<Product, Long> {

    // join fetch: 상품을 가져올 때 카테고리도 한 번의 SQL로 같이 가져온다 (categoryName 응답용)
    @Query("select p from Product p join fetch p.category order by p.id")
    List<Product> findAllWithCategory();

    @Query("select p from Product p join fetch p.category where p.category.id = :categoryId order by p.id")
    List<Product> findAllWithCategoryByCategoryId(Long categoryId);

    @Query("select p from Product p join fetch p.category where p.id = :id")
    Optional<Product> findByIdWithCategory(Long id);
}
