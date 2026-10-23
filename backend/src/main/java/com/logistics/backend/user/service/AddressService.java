package com.logistics.backend.user.service;

import com.logistics.backend.global.exception.BusinessException;
import com.logistics.backend.global.exception.ErrorCode;
import com.logistics.backend.user.dto.AddressRequest;
import com.logistics.backend.user.dto.AddressResponse;
import com.logistics.backend.user.entity.User;
import com.logistics.backend.user.entity.UserAddress;
import com.logistics.backend.user.repository.UserAddressRepository;
import com.logistics.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

// 배송지 관리. 규칙: 회원마다 기본 배송지는 1개, 첫 배송지는 자동으로 기본
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AddressService {

    private final UserAddressRepository addressRepository;
    private final UserRepository userRepository;

    public List<AddressResponse> getMyAddresses(Long userId) {
        return addressRepository.findAllByUserIdOrderByDefault(userId).stream()
                .map(AddressResponse::from)
                .toList();
    }

    @Transactional
    public AddressResponse create(Long userId, AddressRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        boolean isFirst = !addressRepository.existsByUserId(userId);

        UserAddress address = addressRepository.save(new UserAddress(
                user,
                request.label().trim(),
                request.receiverName().trim(),
                request.receiverPhone(),
                request.address().trim()
        ));

        if (isFirst || request.isDefault()) {
            makeDefault(userId, address);
        }
        return AddressResponse.from(address);
    }

    // 수정. isDefault=true 면 기본 배송지로 바꾼다 (기본 해제는 다른 배송지를 기본으로 정하면 자동으로 된다)
    @Transactional
    public AddressResponse update(Long userId, Long addressId, AddressRequest request) {
        UserAddress address = findMyAddress(userId, addressId);
        address.update(request.label().trim(), request.receiverName().trim(), request.receiverPhone(), request.address().trim());

        if (request.isDefault()) {
            makeDefault(userId, address);
        }
        return AddressResponse.from(address);
    }

    @Transactional
    public AddressResponse setDefault(Long userId, Long addressId) {
        UserAddress address = findMyAddress(userId, addressId);
        makeDefault(userId, address);
        return AddressResponse.from(address);
    }

    // 기본 배송지를 지우면 남은 것 중 가장 먼저 등록한 배송지가 기본이 된다
    @Transactional
    public void delete(Long userId, Long addressId) {
        UserAddress address = findMyAddress(userId, addressId);
        boolean wasDefault = address.isDefault();
        addressRepository.delete(address);

        if (wasDefault) {
            addressRepository.findAllByUserIdOrderByDefault(userId).stream()
                    .filter(a -> !a.getId().equals(addressId))
                    .findFirst()
                    .ifPresent(next -> makeDefault(userId, next));
        }
    }

    // 주문서에서 배송지 id 로 주문할 때 사용 (내 배송지가 아니면 404)
    public UserAddress findMyAddress(Long userId, Long addressId) {
        return addressRepository.findByIdAndUserId(addressId, userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.ADDRESS_NOT_FOUND));
    }

    // 이 회원의 배송지 중 target 하나만 기본으로 만든다
    private void makeDefault(Long userId, UserAddress target) {
        for (UserAddress address : addressRepository.findAllByUserIdOrderByDefault(userId)) {
            address.setDefault(address.getId().equals(target.getId()));
        }
    }
}
