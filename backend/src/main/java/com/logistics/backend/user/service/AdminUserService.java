package com.logistics.backend.user.service;

import com.logistics.backend.global.dto.PageResponse;
import com.logistics.backend.order.dto.UserOrderCount;
import com.logistics.backend.order.repository.OrderRepository;
import com.logistics.backend.user.dto.AdminUserResponse;
import com.logistics.backend.user.entity.User;
import com.logistics.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminUserService {

    private final UserRepository userRepository;
    private final OrderRepository orderRepository;

    // GET /api/admin/users?page=0&size=20 (최근 가입 순)
    public PageResponse<AdminUserResponse> getUsers(int page, int size) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "id"));
        Page<User> users = userRepository.findAll(pageable);

        // 이 페이지 회원들의 주문 수를 group by 한 번으로 구한다
        List<Long> userIds = users.getContent().stream().map(User::getId).toList();
        Map<Long, Long> orderCountByUserId = userIds.isEmpty()
                ? Map.of()
                : orderRepository.countByUserIds(userIds).stream()
                .collect(Collectors.toMap(UserOrderCount::userId, UserOrderCount::count));

        List<AdminUserResponse> content = users.getContent().stream()
                .map(user -> AdminUserResponse.of(user, orderCountByUserId.getOrDefault(user.getId(), 0L)))
                .toList();
        return PageResponse.from(new PageImpl<>(content, pageable, users.getTotalElements()));
    }
}
