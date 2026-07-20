package com.antiadhd.ai.dto;

import com.antiadhd.ai.AiJob;
import com.antiadhd.ai.AiJobStatus;
import java.util.UUID;

public record AiJobAcceptedResponse(UUID jobId, AiJobStatus status) {
    public static AiJobAcceptedResponse from(AiJob job) {
        return new AiJobAcceptedResponse(job.getId(), job.getStatus());
    }
}
