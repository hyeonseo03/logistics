package com.logistics.backend.user.controller;

import com.logistics.backend.global.dto.PageResponse;
import com.logistics.backend.user.dto.AdminUserResponse;
import com.logistics.backend.user.service.AdminUserService;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

// 관리자 회원 목록
@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
public class AdminUserController {

    private final AdminUserService adminUserService;

    @GetMapping
    public PageResponse<AdminUserResponse> getUsers(@RequestParam(defaultValue = "0") @Min(0) int page,
                                                    @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size) {
        return adminUserService.getUsers(page, size);
    }
}
