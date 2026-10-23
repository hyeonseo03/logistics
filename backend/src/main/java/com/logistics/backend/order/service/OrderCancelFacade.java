package com.logistics.backend.order.service;

import com.logistics.backend.order.dto.CancelOrderResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.stereotype.Service;

// 취소 요청의 "멱등성" 마무리 담당 (트랜잭션 바깥에서 동작한다)
//
// 같은 주문에 취소 요청 2개가 거의 동시에 오면, 둘 다 "주문완료" 상태를 읽고 취소를 시도한다.
// @Version 덕분에 먼저 끝난 요청만 성공하고, 나중 요청은 낙관적 락 충돌로 실패(롤백)한다.
// 이때 나중 요청을 409 로 끝내지 않고, 주문을 다시 읽어서 "이미 취소됨" 이면 성공 응답을 준다.
// 반대로 관리자가 먼저 출고해 버린 경우라면 409 를 그대로 돌려줘서 고객이 바뀐 상태를 다시 확인하게 한다
@Service
@RequiredArgsConstructor
public class OrderCancelFacade {

    private final OrderService orderService;

    public CancelOrderResponse cancel(Long userId, Long orderId, String reason) {
        try {
            return orderService.cancel(userId, orderId, reason);
        } catch (ObjectOptimisticLockingFailureException conflict) {
            // 위 트랜잭션은 이미 롤백되었다. 새 트랜잭션에서 최신 상태를 다시 확인한다
            return orderService.alreadyProcessedOrThrow(userId, orderId, conflict);
        }
    }
}
