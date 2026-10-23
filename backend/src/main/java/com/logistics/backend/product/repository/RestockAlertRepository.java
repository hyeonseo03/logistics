package com.logistics.backend.product.repository;

import com.logistics.backend.product.entity.RestockAlert;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface RestockAlertRepository extends JpaRepository<RestockAlert, Long> {

    Optional<RestockAlert> findByUserIdAndProductId(Long userId, Long productId);

    Optional<RestockAlert> findByIdAndUserId(Long id, Long userId);

    // 내 알림 목록 (최근 신청이 위로). 상품·카테고리도 한 번에 가져온다 (응답에 상품 정보가 들어가므로)
    @Query("select a from RestockAlert a join fetch a.product p join fetch p.category"
            + " where a.user.id = :userId order by a.createdAt desc, a.id desc")
    List<RestockAlert> findAllWithProductByUserId(Long userId);

    // 상품을 지울 때 그 상품의 알림 신청도 함께 지운다
    @Modifying
    @Query("delete from RestockAlert a where a.product.id = :productId")
    int deleteAllByProductId(Long productId);
}
