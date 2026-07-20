package com.antiadhd.ai.dto;

import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public record CreateTaskBreakdownRequest(
        @NotBlank @Size(max = 1000) String goal,
        @FutureOrPresent LocalDate deadline,
        @Min(5) @Max(480) Integer availableMinutes
) {
}
