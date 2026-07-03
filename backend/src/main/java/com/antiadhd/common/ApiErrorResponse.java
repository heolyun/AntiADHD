package com.antiadhd.common;

import java.time.Instant;
import java.util.List;

public record ApiErrorResponse(
        Instant timestamp,
        int status,
        String error,
        String message,
        List<String> details
) {
    public static ApiErrorResponse of(int status, String error, String message, List<String> details) {
        return new ApiErrorResponse(Instant.now(), status, error, message, details);
    }
}

