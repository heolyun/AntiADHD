package com.antiadhd.category.dto;

import com.antiadhd.category.Category;
import java.time.Instant;

public record CategoryResponse(
        Long id,
        String name,
        String color,
        Instant createdAt,
        Instant updatedAt
) {
    public static CategoryResponse from(Category category) {
        return new CategoryResponse(
                category.getId(),
                category.getName(),
                category.getColor(),
                category.getCreatedAt(),
                category.getUpdatedAt()
        );
    }
}

