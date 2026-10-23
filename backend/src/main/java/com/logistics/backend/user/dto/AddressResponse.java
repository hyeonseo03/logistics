package com.logistics.backend.user.dto;

import com.logistics.backend.user.entity.UserAddress;

// 프론트 types/user.ts 의 Address 와 같은 모양
public record AddressResponse(
        Long id,
        Long userId,
        String label,
        String receiverName,
        String receiverPhone,
        String address,
        boolean isDefault
) {

    public static AddressResponse from(UserAddress address) {
        return new AddressResponse(
                address.getId(),
                address.getUser().getId(),
                address.getLabel(),
                address.getReceiverName(),
                address.getReceiverPhone(),
                address.getAddress(),
                address.isDefault()
        );
    }
}
