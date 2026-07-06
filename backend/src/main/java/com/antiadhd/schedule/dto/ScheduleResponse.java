package com.antiadhd.schedule.dto;

import com.antiadhd.category.dto.CategoryResponse;
import com.antiadhd.schedule.RepeatType;
import com.antiadhd.schedule.Schedule;
import com.antiadhd.tag.dto.TagResponse;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;

public record ScheduleResponse(
        Long id,
        String title,
        String description,
        LocalDateTime startAt,
        LocalDateTime endAt,
        String color,
        RepeatType repeatType,
        CategoryResponse category,
        List<TagResponse> tags,
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
                schedule.getCategory() == null ? null : CategoryResponse.from(schedule.getCategory()),
                schedule.getTags().stream().map(TagResponse::from).toList(),
                schedule.isCompleted(),
                schedule.getCreatedAt(),
                schedule.getUpdatedAt()
        );
    }
}
