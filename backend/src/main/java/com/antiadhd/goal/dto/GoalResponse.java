package com.antiadhd.goal.dto;

import com.antiadhd.goal.Goal;
import com.antiadhd.goal.GoalStatus;
import java.time.Instant;
import java.time.LocalDate;

public record GoalResponse(
        Long id,
        String title,
        String description,
        LocalDate targetDate,
        int progress,
        GoalStatus status,
        Instant createdAt,
        Instant updatedAt
) {
    public static GoalResponse from(Goal goal) {
        return new GoalResponse(
                goal.getId(),
                goal.getTitle(),
                goal.getDescription(),
                goal.getTargetDate(),
                goal.getProgress(),
                goal.getStatus(),
                goal.getCreatedAt(),
                goal.getUpdatedAt()
        );
    }
}

