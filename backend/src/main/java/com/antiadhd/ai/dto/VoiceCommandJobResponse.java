package com.antiadhd.ai.dto;

import com.antiadhd.ai.AiJobStatus;
import java.time.Instant;
import java.util.UUID;

public record VoiceCommandJobResponse(
        UUID jobId,
        AiJobStatus status,
        VoiceCommandResult result,
        String failureCode,
        String failureMessage,
        int attemptCount,
        Instant createdAt,
        Instant completedAt
) {
}
