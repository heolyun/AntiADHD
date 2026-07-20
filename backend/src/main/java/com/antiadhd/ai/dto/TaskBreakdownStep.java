package com.antiadhd.ai.dto;

public record TaskBreakdownStep(
        int order,
        String title,
        String description,
        int estimatedMinutes,
        String energyLevel
) {
}
