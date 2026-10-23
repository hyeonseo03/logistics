package com.logistics.backend.user.controller;

import com.logistics.backend.global.security.LoginUser;
import com.logistics.backend.user.dto.ChangePasswordRequest;
import com.logistics.backend.user.dto.UpdateProfileRequest;
import com.logistics.backend.user.dto.UserResponse;
import com.logistics.backend.user.dto.VerifyPasswordRequest;
import com.logistics.backend.user.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users/me")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    // GET /api/users/me
    @GetMapping
    public UserResponse getMe(@AuthenticationPrincipal LoginUser loginUser) {
        return userService.getMe(loginUser.id());
    }

    // PUT /api/users/me (이름, 전화번호 수정)
    @PutMapping
    public UserResponse updateMe(@AuthenticationPrincipal LoginUser loginUser,
                                 @Valid @RequestBody UpdateProfileRequest request) {
        return userService.updateProfile(loginUser.id(), request);
    }

    // PATCH /api/users/me/password (비밀번호 변경)
    @PatchMapping("/password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void changePassword(@AuthenticationPrincipal LoginUser loginUser,
                               @Valid @RequestBody ChangePasswordRequest request) {
        userService.changePassword(loginUser.id(), request);
    }

    // POST /api/users/me/verify-password (비밀번호 확인. 맞으면 204, 틀리면 401)
    @PostMapping("/verify-password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void verifyPassword(@AuthenticationPrincipal LoginUser loginUser,
                               @Valid @RequestBody VerifyPasswordRequest request) {
        userService.verifyPassword(loginUser.id(), request.password());
    }
}
