package com.antiadhd.ai;

import com.antiadhd.ai.dto.VoiceCommandResult;

public record OpenAiVoiceCommandResult(
        VoiceCommandResult result,
        String providerResponseId,
        String model
) {
}
