package com.antiadhd.schedule.dto;

import com.antiadhd.schedule.RepeatType;
import com.antiadhd.schedule.Schedule;
import java.time.Instant;
import java.time.LocalDateTime;

public record ScheduleResponse(
        Long id,
        String title,
        String description,
        LocalDateTime startAt,
        LocalDateTime endAt,
        String color,
        RepeatType repeatType,
        boolean completed,
        Instant createdAt,
        Instant updatedAt
) {
    public static ScheduleResponse from(Schedule schedule) {
        return new ScheduleResponse(
                schedule.getId(),
                schedule.getTitle(),
                schedule.getDescription(),
                schedule.getStartAt(),
                schedule.getEndAt(),
                schedule.getColor(),
                schedule.getRepeatType(),
                schedule.isCompleted(),
                schedule.getCreatedAt(),
                schedule.getUpdatedAt()
        );
    }
}

