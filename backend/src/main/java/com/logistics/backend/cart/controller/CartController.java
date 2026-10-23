package com.logistics.backend.cart.controller;

import com.logistics.backend.cart.dto.CartItemRequest;
import com.logistics.backend.cart.dto.CartQuantityRequest;
import com.logistics.backend.cart.dto.CartResponse;
import com.logistics.backend.cart.service.CartService;
import com.logistics.backend.global.security.LoginUser;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

// 장바구니 (로그인 필요). 변경 API 는 모두 바뀐 장바구니 전체를 돌려준다
@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;

    // GET /api/cart
    @GetMapping
    public CartResponse getCart(@AuthenticationPrincipal LoginUser loginUser) {
        return cartService.getCart(loginUser.id());
    }

    // POST /api/cart/items  { "productId": 1, "quantity": 2 }
    @PostMapping("/items")
    public CartResponse addItem(@AuthenticationPrincipal LoginUser loginUser,
                                @Valid @RequestBody CartItemRequest request) {
        return cartService.addItem(loginUser.id(), request);
    }

    // PATCH /api/cart/items/1  { "quantity": 3 }
    @PatchMapping("/items/{productId}")
    public CartResponse changeQuantity(@AuthenticationPrincipal LoginUser loginUser,
                                       @PathVariable Long productId,
                                       @Valid @RequestBody CartQuantityRequest request) {
        return cartService.changeQuantity(loginUser.id(), productId, request.quantity());
    }

    // DELETE /api/cart/items/1
    @DeleteMapping("/items/{productId}")
    public CartResponse removeItem(@AuthenticationPrincipal LoginUser loginUser, @PathVariable Long productId) {
        return cartService.removeItems(loginUser.id(), List.of(productId));
    }

    // DELETE /api/cart/items?productIds=1,2 (선택 삭제)
    @DeleteMapping("/items")
    public CartResponse removeItems(@AuthenticationPrincipal LoginUser loginUser,
                                    @RequestParam List<Long> productIds) {
        return cartService.removeItems(loginUser.id(), productIds);
    }

    // DELETE /api/cart (전체 비우기)
    @DeleteMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void clear(@AuthenticationPrincipal LoginUser loginUser) {
        cartService.clear(loginUser.id());
    }
}
