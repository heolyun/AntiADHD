package com.antiadhd.ai.dto;

import java.util.List;

public record AiSuggestionResponse(
        String provider,
        boolean externalApiEnabled,
        List<String> suggestions
) {
}

