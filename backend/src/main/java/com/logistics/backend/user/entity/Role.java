package com.logistics.backend.user.entity;

// 회원 권한. Spring Security 에서는 "ROLE_USER", "ROLE_ADMIN" 으로 쓰인다
public enum Role {
    USER,
    ADMIN
}
