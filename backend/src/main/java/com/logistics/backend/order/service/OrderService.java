package com.logistics.backend.order.service;

import com.logistics.backend.cart.entity.CartItem;
import com.logistics.backend.cart.repository.CartItemRepository;
import com.logistics.backend.global.exception.BusinessException;
import com.logistics.backend.global.exception.ErrorCode;
import com.logistics.backend.global.policy.ShippingFeePolicy;
import com.logistics.backend.inventory.service.InventoryService;
import com.logistics.backend.order.dto.CancelOrderResponse;
import com.logistics.backend.order.dto.CancelResult;
import com.logistics.backend.order.dto.ChangeAddressRequest;
import com.logistics.backend.order.dto.CreateOrderRequest;
import com.logistics.backend.order.dto.OrderResponse;
import com.logistics.backend.order.entity.CancelType;
import com.logistics.backend.order.entity.Order;
import com.logistics.backend.order.entity.OrderItem;
import com.logistics.backend.order.entity.OrderStatus;
import com.logistics.backend.order.entity.OrderStatusHistory;
import com.logistics.backend.order.entity.Payment;
import com.logistics.backend.order.repository.OrderRepository;
import com.logistics.backend.order.repository.OrderStatusHistoryRepository;
import com.logistics.backend.order.repository.PaymentRepository;
import com.logistics.backend.product.entity.Product;
import com.logistics.backend.shipment.service.ShipmentService;
import com.logistics.backend.user.entity.User;
import com.logistics.backend.user.entity.UserAddress;
import com.logistics.backend.user.repository.UserRepository;
import com.logistics.backend.user.service.AddressService;
import com.logistics.backend.warehouse.entity.Warehouse;
import com.logistics.backend.warehouse.entity.WarehouseRegion;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class OrderService {

    private static final Pattern PHONE_PATTERN = Pattern.compile("^01[016789]-\\d{3,4}-\\d{4}$");

    private final OrderRepository orderRepository;
    private final OrderStatusHistoryRepository historyRepository;
    private final PaymentRepository paymentRepository;
    private final CartItemRepository cartItemRepository;
    private final UserRepository userRepository;
    private final AddressService addressService;
    private final InventoryService inventoryService;
    private final OrderResponseAssembler assembler;
    private final OrderTransitionService transitionService;
    private final ShipmentService shipmentService;

    // 장바구니 → 주문
    // 아래 작업이 모두 하나의 트랜잭션이다. 중간에 하나라도 실패하면(예: 두 번째 상품 재고 부족)
    // 앞에서 한 재고 예약까지 전부 취소(롤백)되어, "주문은 없는데 재고만 줄어든" 상태가 생기지 않는다
    //  1) 배송지 정하기  2) 상품마다 출고 센터를 골라 재고 예약  3) 주문·주문상품 저장
    //  4) 모의 결제(결제완료) 기록  5) 상태 이력·배송(shipments) 생성  6) 주문한 상품을 장바구니에서 삭제
    @Transactional
    public OrderResponse createOrder(Long userId, CreateOrderRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        Delivery delivery = resolveDelivery(userId, request.addressId(),
                request.receiverName(), request.receiverPhone(), request.address());

        List<CartItem> cartItems = selectCartItems(userId, request.productIds());
        LocalDateTime now = LocalDateTime.now();

        Order order = new Order(user, request.paymentMethod(),
                delivery.receiverName(), delivery.receiverPhone(), delivery.address(), now);
        WarehouseRegion destination = WarehouseRegion.fromAddress(delivery.address());

        for (CartItem cartItem : cartItems) {
            Product product = cartItem.getProduct();
            // 동시에 여러 주문이 와도 초과 판매가 없도록 "조건부 UPDATE" 로 예약한다 (InventoryRepository.reserve)
            Warehouse warehouse = inventoryService.reserve(product, cartItem.getQuantity(), destination);
            order.addItem(new OrderItem(order, product, warehouse, cartItem.getQuantity(), product.getPrice()));
        }
        order.applyShippingFee(ShippingFeePolicy.calculate(order.getProductTotal()));
        orderRepository.save(order); // 주문 상품도 cascade 로 함께 저장된다

        paymentRepository.save(new Payment(order, request.paymentMethod(), order.getTotalPrice(), now));
        historyRepository.save(new OrderStatusHistory(order, null, OrderStatus.ORDERED, userId, now));
        shipmentService.createFor(order, now);

        List<Long> orderedProductIds = cartItems.stream().map(item -> item.getProduct().getId()).toList();
        cartItemRepository.deleteByUserIdAndProductIds(userId, orderedProductIds);

        return assembler.toResponse(order);
    }

    // GET /api/orders: 내 주문 목록 (최신순)
    public List<OrderResponse> getMyOrders(Long userId) {
        return assembler.toResponses(orderRepository.findAllByUserIdOrderByLatest(userId));
    }

    // GET /api/orders/{id}: 내 주문 상세 (다른 회원의 주문이면 404)
    public OrderResponse getMyOrder(Long userId, Long orderId) {
        return assembler.toResponse(findMyOrder(userId, orderId));
    }

    // POST /api/orders/{id}/cancel
    // 지금 상태에 따라 결과가 달라진다 (규칙은 OrderStatus.cancelType())
    //  - 주문완료·포장   → 즉시 취소 (예약재고 해제 + 환불)
    //  - 출고·배송중·배송완료 → 회수중 (returns 생성, 관리자가 회수 완료하면 재고 복구 + 환불)
    //  - 이미 취소·회수 → 아무것도 하지 않고 성공 (버튼을 두 번 눌러도 한 번만 처리되는 "멱등" 처리)
    @Transactional
    public CancelOrderResponse cancel(Long userId, Long orderId, String reason) {
        Order order = findMyOrder(userId, orderId);
        CancelType cancelType = order.getStatus().cancelType();

        CancelResult result = switch (cancelType) {
            case IMMEDIATE_CANCEL -> {
                transitionService.changeStatus(order, OrderStatus.CANCELED, userId, reason);
                yield CancelResult.CANCELED;
            }
            case RETURN -> {
                transitionService.changeStatus(order, OrderStatus.RETURNING, userId, reason);
                yield CancelResult.RETURN_REQUESTED;
            }
            case ALREADY_PROCESSED -> CancelResult.ALREADY_PROCESSED;
        };
        return toCancelResponse(result, order);
    }

    // 이미 취소/회수된 주문이면 "이미 처리됨" 응답을 만든다 (동시에 두 번 눌러 한쪽이 충돌로 실패했을 때 사용)
    public CancelOrderResponse alreadyProcessedOrThrow(Long userId, Long orderId, RuntimeException conflict) {
        Order order = findMyOrder(userId, orderId);
        if (order.getStatus().cancelType() != CancelType.ALREADY_PROCESSED) {
            throw conflict; // 다른 요청(예: 관리자 출고)이 먼저 처리된 경우 → 409 로 알려서 다시 확인하게 한다
        }
        return toCancelResponse(CancelResult.ALREADY_PROCESSED, order);
    }

    // PATCH /api/orders/{id}/address (출고 전에만 가능)
    @Transactional
    public OrderResponse changeAddress(Long userId, Long orderId, ChangeAddressRequest request) {
        Order order = findMyOrder(userId, orderId);
        Delivery delivery = resolveDelivery(userId, request.addressId(),
                request.receiverName(), request.receiverPhone(), request.address());
        order.changeDeliveryAddress(delivery.receiverName(), delivery.receiverPhone(), delivery.address());
        orderRepository.saveAndFlush(order); // @Version 검사 (그 사이 출고되었다면 충돌)
        return assembler.toResponse(order);
    }

    private CancelOrderResponse toCancelResponse(CancelResult result, Order order) {
        String message = switch (result) {
            case CANCELED -> "주문이 취소되었습니다. 결제 금액이 환불됩니다.";
            case RETURN_REQUESTED -> "이미 출고된 주문이라 회수를 요청했습니다. 회수가 끝나면 환불됩니다.";
            case ALREADY_PROCESSED -> "이미 취소(회수) 처리된 주문입니다.";
        };
        return new CancelOrderResponse(result, message, assembler.toResponse(order));
    }

    Order findMyOrder(Long userId, Long orderId) {
        return orderRepository.findByIdAndUserId(orderId, userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.ORDER_NOT_FOUND));
    }

    // 장바구니에서 주문할 상품을 고른다. 상품 id 순서로 정렬해서, 여러 주문이 동시에 와도
    // 재고 행을 항상 같은 순서로 잠그게 한다 (서로 상대 행을 기다리는 교착 상태 방지)
    private List<CartItem> selectCartItems(Long userId, List<Long> productIds) {
        List<CartItem> cartItems = cartItemRepository.findAllWithProductByUserId(userId).stream()
                .filter(item -> productIds == null || productIds.isEmpty() || productIds.contains(item.getProduct().getId()))
                .sorted(Comparator.comparing(item -> item.getProduct().getId()))
                .toList();

        if (cartItems.isEmpty()) {
            throw new BusinessException(ErrorCode.CART_EMPTY);
        }
        return cartItems;
    }

    // 배송지: 저장된 배송지(addressId)를 고르거나, 직접 입력한 값을 쓴다
    private Delivery resolveDelivery(Long userId, Long addressId, String receiverName, String receiverPhone, String address) {
        if (addressId != null) {
            UserAddress saved = addressService.findMyAddress(userId, addressId);
            return new Delivery(saved.getReceiverName(), saved.getReceiverPhone(), saved.getAddress());
        }

        if (!StringUtils.hasText(receiverName) || !StringUtils.hasText(address)) {
            throw new BusinessException(ErrorCode.INVALID_INPUT, "배송지를 선택하거나 받는 사람과 주소를 입력해 주세요.");
        }
        if (receiverPhone == null || !PHONE_PATTERN.matcher(receiverPhone).matches()) {
            throw new BusinessException(ErrorCode.INVALID_INPUT, "전화번호 형식이 올바르지 않습니다. (예: 010-1234-5678)");
        }
        return new Delivery(receiverName.trim(), receiverPhone, address.trim());
    }

    private record Delivery(String receiverName, String receiverPhone, String address) {
    }
}
