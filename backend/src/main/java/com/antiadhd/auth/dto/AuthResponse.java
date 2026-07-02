package com.antiadhd.auth.dto;

import com.antiadhd.user.AppUser;

public record AuthResponse(
        String token,
        UserSummary user
) {
    public static AuthResponse from(String token, AppUser user) {
        return new AuthResponse(token, new UserSummary(user.getId(), user.getEmail(), user.getName()));
    }
}

