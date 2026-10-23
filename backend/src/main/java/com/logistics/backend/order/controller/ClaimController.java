package com.logistics.backend.order.controller;

import com.logistics.backend.global.security.LoginUser;
import com.logistics.backend.order.dto.ClaimResponse;
import com.logistics.backend.order.dto.ClaimType;
import com.logistics.backend.order.service.ClaimService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

// 마이페이지 취소·회수 내역 (로그인 필요)
@RestController
@RequiredArgsConstructor
public class ClaimController {

    private final ClaimService claimService;

    // GET /api/users/me/claims?type=CANCEL (취소 내역) / ?type=RETURN (회수 내역)
    @GetMapping("/api/users/me/claims")
    public List<ClaimResponse> getMyClaims(@AuthenticationPrincipal LoginUser loginUser,
                                           @RequestParam ClaimType type) {
        return claimService.getMyClaims(loginUser.id(), type);
    }
}
