package com.antiadhd.ai;

import com.antiadhd.ai.dto.TaskBreakdownResult;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;

@Component
public class TaskBreakdownResponseParser {
    private final ObjectMapper objectMapper;

    public TaskBreakdownResponseParser(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public OpenAiTaskBreakdownResult parse(String responseBody) {
        try {
            JsonNode root = objectMapper.readTree(responseBody);
            if (!"completed".equals(root.path("status").asText())) {
                throw new OpenAiException("OPENAI_INCOMPLETE", "OpenAI did not complete the response.", true);
            }

            String outputText = null;
            for (JsonNode output : root.path("output")) {
                if (!"message".equals(output.path("type").asText())) {
                    continue;
                }
                for (JsonNode content : output.path("content")) {
                    String type = content.path("type").asText();
                    if ("refusal".equals(type)) {
                        throw new OpenAiException("OPENAI_REFUSAL", "The AI request was refused.", false);
                    }
                    if ("output_text".equals(type)) {
                        outputText = content.path("text").asText(null);
                    }
                }
            }

            if (outputText == null || outputText.isBlank()) {
                throw new OpenAiException("OPENAI_EMPTY_OUTPUT", "OpenAI returned no task breakdown.", true);
            }

            TaskBreakdownResult result = objectMapper.readValue(outputText, TaskBreakdownResult.class);
            if (result.steps() == null || result.steps().isEmpty()) {
                throw new OpenAiException("OPENAI_EMPTY_STEPS", "OpenAI returned an empty task list.", true);
            }
            return new OpenAiTaskBreakdownResult(
                    result,
                    root.path("id").asText(null),
                    root.path("model").asText(null)
            );
        } catch (OpenAiException exception) {
            throw exception;
        } catch (JsonProcessingException exception) {
            throw new OpenAiException(
                    "OPENAI_INVALID_RESPONSE",
                    "OpenAI returned an invalid structured response.",
                    true,
                    exception
            );
        }
    }
}
