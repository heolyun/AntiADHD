package com.antiadhd.auth.dto;

import com.antiadhd.user.AppUser;
import com.antiadhd.user.dto.UserSummary;

public record AuthResponse(
        String token,
        String refreshToken,
        UserSummary user
) {
    public static AuthResponse from(String token, String refreshToken, AppUser user) {
        return new AuthResponse(token, refreshToken, UserSummary.from(user));
    }
}
