package com.antiadhd.routine.dto;

import com.antiadhd.routine.Routine;
import com.antiadhd.schedule.RepeatType;
import java.time.Instant;
import java.time.LocalTime;

public record RoutineResponse(
        Long id,
        String title,
        String description,
        RepeatType repeatType,
        LocalTime targetTime,
        boolean active,
        Instant createdAt,
        Instant updatedAt
) {
    public static RoutineResponse from(Routine routine) {
        return new RoutineResponse(
                routine.getId(),
                routine.getTitle(),
                routine.getDescription(),
                routine.getRepeatType(),
                routine.getTargetTime(),
                routine.isActive(),
                routine.getCreatedAt(),
                routine.getUpdatedAt()
        );
    }
}

