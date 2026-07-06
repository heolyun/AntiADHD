package com.antiadhd.category.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CategoryRequest(
        @NotBlank @Size(max = 60) String name,
        @NotBlank @Pattern(regexp = "^#[0-9a-fA-F]{6}$") String color
) {
}

