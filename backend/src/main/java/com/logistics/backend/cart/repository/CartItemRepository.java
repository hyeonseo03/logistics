package com.logistics.backend.cart.repository;

import com.logistics.backend.cart.entity.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface CartItemRepository extends JpaRepository<CartItem, Long> {

    // 상품 정보(이름, 가격)도 한 번의 SQL로 같이 가져온다. 먼저 담은 순서
    @Query("select c from CartItem c join fetch c.product p join fetch p.category where c.user.id = :userId order by c.id")
    List<CartItem> findAllWithProductByUserId(Long userId);

    Optional<CartItem> findByUserIdAndProductId(Long userId, Long productId);

    @Modifying
    @Query("delete from CartItem c where c.user.id = :userId and c.product.id in :productIds")
    int deleteByUserIdAndProductIds(Long userId, Collection<Long> productIds);

    @Modifying
    @Query("delete from CartItem c where c.user.id = :userId")
    int deleteAllByUserId(Long userId);

    @Modifying
    @Query("delete from CartItem c where c.product.id = :productId")
    int deleteAllByProductId(Long productId);
}
