package com.antiadhd.ai.dto;

import java.util.List;

public record TaskBreakdownResult(
        String summary,
        int totalEstimatedMinutes,
        List<TaskBreakdownStep> steps
) {
}
