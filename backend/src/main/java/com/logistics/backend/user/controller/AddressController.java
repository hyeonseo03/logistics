package com.logistics.backend.user.controller;

import com.logistics.backend.global.security.LoginUser;
import com.logistics.backend.user.dto.AddressRequest;
import com.logistics.backend.user.dto.AddressResponse;
import com.logistics.backend.user.service.AddressService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

// 배송지 CRUD (프론트 docs/api-wishlist.md 의 /api/users/me/addresses 묶음)
@RestController
@RequestMapping("/api/users/me/addresses")
@RequiredArgsConstructor
public class AddressController {

    private final AddressService addressService;

    @GetMapping
    public List<AddressResponse> getMyAddresses(@AuthenticationPrincipal LoginUser loginUser) {
        return addressService.getMyAddresses(loginUser.id());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AddressResponse create(@AuthenticationPrincipal LoginUser loginUser,
                                  @Valid @RequestBody AddressRequest request) {
        return addressService.create(loginUser.id(), request);
    }

    @PutMapping("/{id}")
    public AddressResponse update(@AuthenticationPrincipal LoginUser loginUser,
                                  @PathVariable Long id,
                                  @Valid @RequestBody AddressRequest request) {
        return addressService.update(loginUser.id(), id, request);
    }

    // PATCH /api/users/me/addresses/{id}/default (기본 배송지로 설정)
    @PatchMapping("/{id}/default")
    public AddressResponse setDefault(@AuthenticationPrincipal LoginUser loginUser, @PathVariable Long id) {
        return addressService.setDefault(loginUser.id(), id);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal LoginUser loginUser, @PathVariable Long id) {
        addressService.delete(loginUser.id(), id);
    }
}
