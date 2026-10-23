package com.logistics.backend.user.repository;

import com.logistics.backend.user.entity.UserAddress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface UserAddressRepository extends JpaRepository<UserAddress, Long> {

    // 기본 배송지가 맨 위, 나머지는 등록한 순서
    @Query("select a from UserAddress a where a.user.id = :userId order by a.isDefault desc, a.id asc")
    List<UserAddress> findAllByUserIdOrderByDefault(Long userId);

    // 내 배송지만 찾는다 (다른 회원의 배송지 id 를 넣으면 비어 있다)
    Optional<UserAddress> findByIdAndUserId(Long id, Long userId);

    boolean existsByUserId(Long userId);
}
