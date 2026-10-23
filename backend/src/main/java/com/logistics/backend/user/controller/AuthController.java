package com.logistics.backend.user.controller;

import com.logistics.backend.global.security.LoginUser;
import com.logistics.backend.user.dto.LoginRequest;
import com.logistics.backend.user.dto.LoginResponse;
import com.logistics.backend.user.dto.SignupRequest;
import com.logistics.backend.user.dto.UserResponse;
import com.logistics.backend.user.service.AuthService;
import com.logistics.backend.user.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final UserService userService;

    // POST /api/auth/signup
    @PostMapping("/signup")
    @ResponseStatus(HttpStatus.CREATED)
    public UserResponse signup(@Valid @RequestBody SignupRequest request) {
        return authService.signup(request);
    }

    // POST /api/auth/login
    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    // GET /api/auth/me (Authorization: Bearer {토큰} 필요)
    @GetMapping("/me")
    public UserResponse me(@AuthenticationPrincipal LoginUser loginUser) {
        return userService.getMe(loginUser.id());
    }
}
