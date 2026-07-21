package com.antiadhd.ai.dto;

public record VoiceCommandResult(
        String transcript,
        String intent,
        String title,
        String description,
        String startAt,
        String startDate,
        String startTime,
        Integer durationMinutes,
        String repeatType,
        double confidence,
        String clarificationQuestion
) {
}
