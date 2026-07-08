package com.antiadhd.user.dto;

import com.antiadhd.user.AppUser;

public record UserSummary(
        Long id,
        String email,
        String name
) {
    public static UserSummary from(AppUser user) {
        return new UserSummary(user.getId(), user.getEmail(), user.getName());
    }
}
