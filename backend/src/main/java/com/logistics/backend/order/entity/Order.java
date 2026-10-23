package com.logistics.backend.order.entity;

import com.logistics.backend.global.exception.BusinessException;
import com.logistics.backend.global.exception.ErrorCode;
import com.logistics.backend.user.entity.User;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "orders") // order 는 SQL 예약어라 orders 로 쓴다
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrderStatus status;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentMethod paymentMethod;

    @Column(nullable = false)
    private int productTotal; // 상품금액 합계

    @Column(nullable = false)
    private int shippingFee;

    @Column(nullable = false)
    private int totalPrice; // 총 결제금액 = 상품금액 + 배송비

    // 배송지: 주문 시점의 값을 복사해 둔다 (나중에 회원이 배송지를 고쳐도 이 주문은 바뀌지 않는다)
    @Column(nullable = false)
    private String receiverName;

    @Column(nullable = false)
    private String receiverPhone;

    @Column(nullable = false)
    private String address;

    // 낙관적 락: UPDATE 할 때 "where version = 읽었을 때 값" 을 붙여서,
    // 그 사이 다른 요청이 먼저 고쳤다면(버전이 올라갔다면) 실패시킨다
    @Version
    private Long version;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    // 주문 저장 시 주문 상품도 함께 저장된다 (cascade)
    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("id asc")
    private List<OrderItem> items = new ArrayList<>();

    public Order(User user, PaymentMethod paymentMethod, String receiverName, String receiverPhone, String address,
                 LocalDateTime createdAt) {
        this.user = user;
        this.status = OrderStatus.ORDERED; // 모의 결제: 주문과 동시에 결제완료
        this.paymentMethod = paymentMethod;
        this.receiverName = receiverName;
        this.receiverPhone = receiverPhone;
        this.address = address;
        this.createdAt = createdAt;
    }

    // 주문 상품을 추가하고 상품금액을 다시 계산한다
    public void addItem(OrderItem item) {
        items.add(item);
        this.productTotal += item.getLineTotal();
        this.totalPrice = productTotal + shippingFee;
    }

    public void applyShippingFee(int shippingFee) {
        this.shippingFee = shippingFee;
        this.totalPrice = productTotal + shippingFee;
    }

    // 상태 변경. 허용되지 않는 변경(예: 배송완료 → 포장)이면 예외 (규칙은 OrderStatus 에 있다)
    public void changeStatus(OrderStatus next) {
        if (!status.canChangeTo(next)) {
            throw new BusinessException(ErrorCode.INVALID_STATUS_CHANGE,
                    "'" + status.getLabel() + "' 상태에서는 '" + next.getLabel() + "'(으)로 바꿀 수 없습니다.");
        }
        this.status = next;
    }

    // 배송지 변경 (출고 전에만 가능)
    public void changeDeliveryAddress(String receiverName, String receiverPhone, String address) {
        if (!status.canChangeAddress()) {
            throw new BusinessException(ErrorCode.ADDRESS_CHANGE_NOT_ALLOWED);
        }
        this.receiverName = receiverName;
        this.receiverPhone = receiverPhone;
        this.address = address;
    }
}
