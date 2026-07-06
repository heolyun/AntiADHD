package com.antiadhd.tag.dto;

import com.antiadhd.tag.Tag;
import java.time.Instant;

public record TagResponse(
        Long id,
        String name,
        String color,
        Instant createdAt,
        Instant updatedAt
) {
    public static TagResponse from(Tag tag) {
        return new TagResponse(tag.getId(), tag.getName(), tag.getColor(), tag.getCreatedAt(), tag.getUpdatedAt());
    }
}

