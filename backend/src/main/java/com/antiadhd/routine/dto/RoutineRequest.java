package com.antiadhd.routine.dto;

import com.antiadhd.schedule.RepeatType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import java.time.LocalTime;

public record RoutineRequest(
        @NotBlank @Size(max = 120) String title,
        @Size(max = 1000) String description,
        RepeatType repeatType,
        LocalTime targetTime,
        @Min(1) @Max(480) int durationMinutes,
        boolean active
) {
}

