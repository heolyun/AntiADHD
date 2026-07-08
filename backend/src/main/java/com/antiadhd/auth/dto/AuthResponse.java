package com.antiadhd.auth.dto;

import com.antiadhd.user.AppUser;
import com.antiadhd.user.dto.UserSummary;

public record AuthResponse(
        String token,
        UserSummary user
) {
    public static AuthResponse from(String token, AppUser user) {
        return new AuthResponse(token, UserSummary.from(user));
    }
}
