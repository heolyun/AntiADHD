package com.antiadhd.focus.dto;

import com.antiadhd.focus.FocusSession;
import java.time.Instant;
import java.time.LocalDateTime;

public record FocusSessionResponse(
        Long id,
        String title,
        LocalDateTime startedAt,
        LocalDateTime endedAt,
        Integer plannedMinutes,
        boolean completed,
        String note,
        Instant createdAt,
        Instant updatedAt
) {
    public static FocusSessionResponse from(FocusSession session) {
        return new FocusSessionResponse(
                session.getId(),
                session.getTitle(),
                session.getStartedAt(),
                session.getEndedAt(),
                session.getPlannedMinutes(),
                session.isCompleted(),
                session.getNote(),
                session.getCreatedAt(),
                session.getUpdatedAt()
        );
    }
}

