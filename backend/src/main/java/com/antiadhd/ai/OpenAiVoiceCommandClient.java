package com.antiadhd.ai;

import com.antiadhd.ai.config.OpenAiProperties;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.file.Path;
import java.time.Duration;
import java.time.ZonedDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

@Component
public class OpenAiVoiceCommandClient {
    private static final String INSTRUCTIONS = """
            Convert the Korean voice transcript into one productivity action.
            Use CREATE_SCHEDULE when the user supplied a date, a time, or both. A missing date or time is
            an incomplete schedule draft, not an inbox item. Use CREATE_INBOX only when neither scheduling
            information nor a scheduling expression was supplied, so the user can organize it later.
            Resolve relative Korean dates from the supplied current date/time. Never invent missing time information.
            Return a resolved startDate as YYYY-MM-DD and a supplied startTime as HH:mm. Leave a missing value null
            and ask for it in clarificationQuestion. Set startAt only when both values are known, using local
            YYYY-MM-DDTHH:mm:ss without Z or an offset. The current timezone is Asia/Seoul.
            Example: "이번 주 금요일 친구랑 와인바 가기" is CREATE_SCHEDULE with that Friday's resolved
            startDate, null startTime, null startAt, and a Korean question asking for the start time.
            Example: "언젠가 친구랑 와인바 알아보기" is CREATE_INBOX with null scheduling fields.
            If the user says every day or daily, set repeatType to DAILY. Otherwise set it to NONE.
            Return concise Korean text. Do not execute the action; only create a draft for user confirmation.
            """;

    private final OpenAiProperties properties;
    private final VoiceCommandResponseParser parser;
    private final ObjectMapper objectMapper;
    private final RestClient restClient;

    public OpenAiVoiceCommandClient(OpenAiProperties properties, VoiceCommandResponseParser parser, ObjectMapper objectMapper) {
        this.properties = properties;
        this.parser = parser;
        this.objectMapper = objectMapper;
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(Duration.ofSeconds(10));
        requestFactory.setReadTimeout(Duration.ofSeconds(properties.getTimeoutSeconds()));
        this.restClient = RestClient.builder().baseUrl(properties.getBaseUrl()).requestFactory(requestFactory).build();
    }

    public OpenAiVoiceCommandResult create(AiJob job) {
        requireConfigured();
        String transcript = transcribe(Path.of(job.getAudioPath()));
        Map<String, Object> body = Map.of(
                "model", properties.getModel(),
                "instructions", INSTRUCTIONS,
                "input", "Current date/time: " + ZonedDateTime.now(ZoneId.of("Asia/Seoul")) + "\nTranscript: " + transcript,
                "store", false,
                "max_output_tokens", 800,
                "reasoning", Map.of("effort", "low"),
                "safety_identifier", "antiadhd-user-" + job.getUser().getId(),
                "text", Map.of("format", responseFormat())
        );
        try {
            String response = restClient.post().uri("/v1/responses")
                    .header("Authorization", "Bearer " + properties.getApiKey())
                    .body(body).retrieve()
                    .onStatus(HttpStatusCode::isError, (request, error) -> { throw httpFailure(error.getStatusCode().value()); })
                    .body(String.class);
            return parser.parse(response, transcript);
        } catch (OpenAiException exception) {
            throw exception;
        } catch (RestClientException exception) {
            throw new OpenAiException("OPENAI_NETWORK_ERROR", "Unable to reach OpenAI.", true, exception);
        }
    }

    private String transcribe(Path audioPath) {
        MultiValueMap<String, Object> form = new LinkedMultiValueMap<>();
        form.add("file", new FileSystemResource(audioPath));
        form.add("model", properties.getTranscriptionModel());
        form.add("language", "ko");
        try {
            String response = restClient.post().uri("/v1/audio/transcriptions")
                    .header("Authorization", "Bearer " + properties.getApiKey())
                    .contentType(MediaType.MULTIPART_FORM_DATA).body(form).retrieve()
                    .onStatus(HttpStatusCode::isError, (request, error) -> { throw httpFailure(error.getStatusCode().value()); })
                    .body(String.class);
            JsonNode root = objectMapper.readTree(response);
            String text = root.path("text").asText();
            if (text.isBlank()) throw new OpenAiException("OPENAI_EMPTY_TRANSCRIPT", "No speech was detected.", false);
            return text;
        } catch (OpenAiException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new OpenAiException("OPENAI_TRANSCRIPTION_ERROR", "Voice transcription failed.", true, exception);
        }
    }

    private void requireConfigured() {
        if (!properties.isEnabled() || properties.getApiKey() == null || properties.getApiKey().isBlank()) {
            throw new OpenAiException("OPENAI_NOT_CONFIGURED", "OpenAI is not configured for the worker.", false);
        }
    }

    private OpenAiException httpFailure(int status) {
        return new OpenAiException("OPENAI_HTTP_" + status, "OpenAI request failed with HTTP " + status + ".",
                status == 408 || status == 409 || status == 429 || status >= 500);
    }

    private Map<String, Object> responseFormat() {
        Map<String, Object> nullableString = Map.of("type", List.of("string", "null"));
        Map<String, Object> schema = Map.of(
                "type", "object",
                "additionalProperties", false,
                "properties", Map.of(
                        "intent", Map.of("type", "string", "enum", List.of("CREATE_SCHEDULE", "CREATE_INBOX")),
                        "title", Map.of("type", "string", "minLength", 1, "maxLength", 120),
                        "description", nullableString,
                        "startAt", Map.of("type", List.of("string", "null"), "description", "ISO-8601 local date-time or null"),
                        "startDate", Map.of("type", List.of("string", "null"), "description", "Resolved local date as YYYY-MM-DD or null"),
                        "startTime", Map.of("type", List.of("string", "null"), "description", "Supplied local time as HH:mm or null"),
                        "durationMinutes", Map.of("type", List.of("integer", "null"), "minimum", 5, "maximum", 480),
                        "repeatType", Map.of("type", "string", "enum", List.of("NONE", "DAILY")),
                        "confidence", Map.of("type", "number", "minimum", 0, "maximum", 1),
                        "clarificationQuestion", nullableString
                ),
                "required", List.of("intent", "title", "description", "startAt", "startDate", "startTime", "durationMinutes", "repeatType", "confidence", "clarificationQuestion")
        );
        return Map.of("type", "json_schema", "name", "antiadhd_voice_command", "strict", true, "schema", schema);
    }
}
