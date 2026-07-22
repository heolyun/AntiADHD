package com.antiadhd.observability.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ClientErrorRequest(
        @NotBlank @Size(max = 80) String context,
        @NotBlank @Size(max = 500) String message,
        @Size(max = 30) String appVersion,
        @Size(max = 30) String platform
) {
}
