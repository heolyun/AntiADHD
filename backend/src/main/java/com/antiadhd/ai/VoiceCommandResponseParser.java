package com.antiadhd.ai;

import com.antiadhd.ai.dto.VoiceCommandResult;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;

@Component
public class VoiceCommandResponseParser {
    private final ObjectMapper objectMapper;

    public VoiceCommandResponseParser(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public OpenAiVoiceCommandResult parse(String responseBody, String transcript) {
        try {
            JsonNode root = objectMapper.readTree(responseBody);
            if (!"completed".equals(root.path("status").asText())) {
                throw new OpenAiException("OPENAI_INCOMPLETE", "OpenAI did not complete the voice command.", true);
            }
            String outputText = null;
            for (JsonNode output : root.path("output")) {
                for (JsonNode content : output.path("content")) {
                    if ("refusal".equals(content.path("type").asText())) {
                        throw new OpenAiException("OPENAI_REFUSAL", "The voice command was refused.", false);
                    }
                    if ("output_text".equals(content.path("type").asText())) {
                        outputText = content.path("text").asText(null);
                    }
                }
            }
            if (outputText == null) {
                throw new OpenAiException("OPENAI_EMPTY_OUTPUT", "OpenAI returned no voice command.", true);
            }
            JsonNode parsed = objectMapper.readTree(outputText);
            VoiceCommandResult result = new VoiceCommandResult(
                    transcript,
                    parsed.path("intent").asText(),
                    parsed.path("title").asText(),
                    nullableText(parsed, "description"),
                    nullableText(parsed, "startAt"),
                    parsed.path("durationMinutes").isNull() ? null : parsed.path("durationMinutes").asInt(),
                    parsed.path("confidence").asDouble(),
                    nullableText(parsed, "clarificationQuestion")
            );
            return new OpenAiVoiceCommandResult(result, root.path("id").asText(null), root.path("model").asText(null));
        } catch (OpenAiException exception) {
            throw exception;
        } catch (JsonProcessingException exception) {
            throw new OpenAiException("OPENAI_INVALID_RESPONSE", "OpenAI returned an invalid voice command.", true, exception);
        }
    }

    private String nullableText(JsonNode node, String field) {
        JsonNode value = node.path(field);
        return value.isMissingNode() || value.isNull() ? null : value.asText();
    }
}
