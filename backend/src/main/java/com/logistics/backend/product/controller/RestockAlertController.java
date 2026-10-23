package com.logistics.backend.product.controller;

import com.logistics.backend.global.security.LoginUser;
import com.logistics.backend.product.dto.RestockAlertResponse;
import com.logistics.backend.product.service.RestockAlertService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

// 재입고 알림 (로그인 필요)
@RestController
@RequiredArgsConstructor
public class RestockAlertController {

    private final RestockAlertService restockAlertService;

    // POST /api/products/{id}/restock-alerts (본문 없음. 이미 신청했으면 기존 신청을 돌려준다)
    @PostMapping("/api/products/{id}/restock-alerts")
    public RestockAlertResponse request(@AuthenticationPrincipal LoginUser loginUser, @PathVariable Long id) {
        return restockAlertService.request(loginUser.id(), id);
    }

    // GET /api/users/me/restock-alerts
    @GetMapping("/api/users/me/restock-alerts")
    public List<RestockAlertResponse> getMyAlerts(@AuthenticationPrincipal LoginUser loginUser) {
        return restockAlertService.getMyAlerts(loginUser.id());
    }

    // DELETE /api/users/me/restock-alerts/{id}
    @DeleteMapping("/api/users/me/restock-alerts/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal LoginUser loginUser, @PathVariable Long id) {
        restockAlertService.delete(loginUser.id(), id);
    }
}
