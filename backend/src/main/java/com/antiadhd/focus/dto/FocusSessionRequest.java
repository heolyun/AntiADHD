package com.antiadhd.focus.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;

public record FocusSessionRequest(
        @NotBlank @Size(max = 120) String title,
        LocalDateTime startedAt,
        LocalDateTime endedAt,
        @Min(1) @Max(1440) Integer plannedMinutes,
        boolean completed,
        @Size(max = 1000) String note
) {
}

