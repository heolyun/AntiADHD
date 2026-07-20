package com.antiadhd.ai;

import com.antiadhd.ai.dto.TaskBreakdownResult;

public record OpenAiTaskBreakdownResult(
        TaskBreakdownResult result,
        String providerResponseId,
        String model
) {
}
