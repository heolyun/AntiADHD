package com.antiadhd.ai.dto;

import com.antiadhd.ai.AiJob;
import com.antiadhd.ai.AiJobStatus;
import com.antiadhd.ai.AiJobType;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record AiJobResponse(
        UUID jobId,
        AiJobType jobType,
        AiJobStatus status,
        String goal,
        LocalDate deadline,
        Integer availableMinutes,
        TaskBreakdownResult result,
        String failureCode,
        String failureMessage,
        int attemptCount,
        Instant createdAt,
        Instant completedAt
) {
}
