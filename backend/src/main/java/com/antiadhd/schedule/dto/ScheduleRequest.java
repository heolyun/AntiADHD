package com.antiadhd.schedule.dto;

import com.antiadhd.schedule.RepeatType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;

public record ScheduleRequest(
        @NotBlank @Size(max = 120) String title,
        @Size(max = 1000) String description,
        @NotNull LocalDateTime startAt,
        @NotNull LocalDateTime endAt,
        @NotBlank @Pattern(regexp = "^#[0-9a-fA-F]{6}$") String color,
        RepeatType repeatType
) {
}

