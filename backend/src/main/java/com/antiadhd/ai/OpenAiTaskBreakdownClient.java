package com.antiadhd.ai;

import com.antiadhd.ai.config.OpenAiProperties;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

@Component
public class OpenAiTaskBreakdownClient {
    private static final String INSTRUCTIONS = """
            You break a user's goal into small, concrete, executable steps for a productivity app.
            Return Korean text. Keep every step specific enough to start immediately.
            Respect the available minutes when provided. Do not create calendar events or claim that work is completed.
            Do not include medical advice or diagnose ADHD.
            """;

    private final OpenAiProperties properties;
    private final TaskBreakdownResponseParser responseParser;
    private final RestClient restClient;

    public OpenAiTaskBreakdownClient(
            OpenAiProperties properties,
            TaskBreakdownResponseParser responseParser
    ) {
        this.properties = properties;
        this.responseParser = responseParser;
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(Duration.ofSeconds(10));
        requestFactory.setReadTimeout(Duration.ofSeconds(properties.getTimeoutSeconds()));
        this.restClient = RestClient.builder()
                .baseUrl(properties.getBaseUrl())
                .requestFactory(requestFactory)
                .build();
    }

    public OpenAiTaskBreakdownResult create(AiJob job) {
        if (!properties.isEnabled() || properties.getApiKey() == null || properties.getApiKey().isBlank()) {
            throw new OpenAiException("OPENAI_NOT_CONFIGURED", "OpenAI is not configured for the worker.", false);
        }

        Map<String, Object> body = Map.of(
                "model", properties.getModel(),
                "instructions", INSTRUCTIONS,
                "input", userInput(job),
                "store", false,
                "max_output_tokens", 2000,
                "reasoning", Map.of("effort", "low"),
                "safety_identifier", "antiadhd-user-" + job.getUser().getId(),
                "text", Map.of("format", responseFormat())
        );

        try {
            String response = restClient.post()
                    .uri("/v1/responses")
                    .header("Authorization", "Bearer " + properties.getApiKey())
                    .body(body)
                    .retrieve()
                    .onStatus(HttpStatusCode::isError, (request, responseError) -> {
                        int status = responseError.getStatusCode().value();
                        boolean retryable = status == 408 || status == 409 || status == 429 || status >= 500;
                        throw new OpenAiException(
                                "OPENAI_HTTP_" + status,
                                "OpenAI request failed with HTTP " + status + ".",
                                retryable
                        );
                    })
                    .body(String.class);
            return responseParser.parse(response);
        } catch (OpenAiException exception) {
            throw exception;
        } catch (RestClientResponseException exception) {
            int status = exception.getStatusCode().value();
            throw new OpenAiException("OPENAI_HTTP_" + status, "OpenAI request failed.", status >= 500, exception);
        } catch (RestClientException exception) {
            throw new OpenAiException("OPENAI_NETWORK_ERROR", "Unable to reach OpenAI.", true, exception);
        }
    }

    private String userInput(AiJob job) {
        return "Goal: " + job.getGoal()
                + "\nDeadline: " + (job.getDeadline() == null ? "not provided" : job.getDeadline())
                + "\nAvailable minutes: " + (job.getAvailableMinutes() == null ? "not provided" : job.getAvailableMinutes());
    }

    private Map<String, Object> responseFormat() {
        Map<String, Object> stepSchema = Map.of(
                "type", "object",
                "additionalProperties", false,
                "properties", Map.of(
                        "order", Map.of("type", "integer", "minimum", 1),
                        "title", Map.of("type", "string", "minLength", 1, "maxLength", 120),
                        "description", Map.of("type", "string", "minLength", 1, "maxLength", 500),
                        "estimatedMinutes", Map.of("type", "integer", "minimum", 5, "maximum", 180),
                        "energyLevel", Map.of("type", "string", "enum", List.of("LOW", "MEDIUM", "HIGH"))
                ),
                "required", List.of("order", "title", "description", "estimatedMinutes", "energyLevel")
        );
        Map<String, Object> schema = Map.of(
                "type", "object",
                "additionalProperties", false,
                "properties", Map.of(
                        "summary", Map.of("type", "string", "minLength", 1, "maxLength", 500),
                        "totalEstimatedMinutes", Map.of("type", "integer", "minimum", 5, "maximum", 480),
                        "steps", Map.of("type", "array", "minItems", 1, "maxItems", 12, "items", stepSchema)
                ),
                "required", List.of("summary", "totalEstimatedMinutes", "steps")
        );
        return Map.of(
                "type", "json_schema",
                "name", "antiadhd_task_breakdown",
                "strict", true,
                "schema", schema
        );
    }
}
