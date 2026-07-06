package com.antiadhd.goal.dto;

import com.antiadhd.goal.GoalStatus;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public record GoalRequest(
        @NotBlank @Size(max = 120) String title,
        @Size(max = 1000) String description,
        LocalDate targetDate,
        @Min(0) @Max(100) int progress,
        GoalStatus status
) {
}

