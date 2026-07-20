package com.antiadhd.ai;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

class TaskBreakdownResponseParserTest {
    private final TaskBreakdownResponseParser parser = new TaskBreakdownResponseParser(
            new ObjectMapper().findAndRegisterModules()
    );

    @Test
    void parse_extractsStructuredOutputText() {
        String response = """
                {
                  "id":"resp_123",
                  "model":"gpt-5.6-sol",
                  "status":"completed",
                  "output":[{
                    "type":"message",
                    "content":[{
                      "type":"output_text",
                      "text":"{\\"summary\\":\\"Start with a small scope.\\",\\"totalEstimatedMinutes\\":45,\\"steps\\":[{\\"order\\":1,\\"title\\":\\"Define the scope\\",\\"description\\":\\"Write down the completion criteria.\\",\\"estimatedMinutes\\":15,\\"energyLevel\\":\\"LOW\\"}]}"
                    }]
                  }]
                }
                """;

        OpenAiTaskBreakdownResult parsed = parser.parse(response);

        assertThat(parsed.providerResponseId()).isEqualTo("resp_123");
        assertThat(parsed.model()).isEqualTo("gpt-5.6-sol");
        assertThat(parsed.result().steps()).hasSize(1);
        assertThat(parsed.result().steps().get(0).title()).isEqualTo("Define the scope");
    }

    @Test
    void parse_rejectsSafetyRefusal() {
        String response = """
                {
                  "id":"resp_456",
                  "model":"gpt-5.6-sol",
                  "status":"completed",
                  "output":[{
                    "type":"message",
                    "content":[{"type":"refusal","refusal":"Unable to comply."}]
                  }]
                }
                """;

        assertThatThrownBy(() -> parser.parse(response))
                .isInstanceOf(OpenAiException.class)
                .hasMessage("The AI request was refused.")
                .extracting(exception -> ((OpenAiException) exception).isRetryable())
                .isEqualTo(false);
    }
}
