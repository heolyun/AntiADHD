package com.antiadhd.ai;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

class VoiceCommandResponseParserTest {
    private final VoiceCommandResponseParser parser = new VoiceCommandResponseParser(
            new ObjectMapper().findAndRegisterModules()
    );

    @Test
    void parse_preservesDateOnlyScheduleAsIncompleteDraft() {
        String response = """
                {
                  "id":"resp_voice_123",
                  "model":"gpt-5.6-luna",
                  "status":"completed",
                  "output":[{
                    "type":"message",
                    "content":[{
                      "type":"output_text",
                      "text":"{\\"intent\\":\\"CREATE_SCHEDULE\\",\\"title\\":\\"친구와 와인바 가기\\",\\"description\\":null,\\"startAt\\":null,\\"startDate\\":\\"2026-07-24\\",\\"startTime\\":null,\\"durationMinutes\\":30,\\"repeatType\\":\\"NONE\\",\\"confidence\\":0.98,\\"clarificationQuestion\\":\\"몇 시에 시작할까요?\\"}"
                    }]
                  }]
                }
                """;

        OpenAiVoiceCommandResult parsed = parser.parse(response, "이번 주 금요일 친구랑 와인바 가기.");

        assertThat(parsed.result().intent()).isEqualTo("CREATE_SCHEDULE");
        assertThat(parsed.result().startDate()).isEqualTo("2026-07-24");
        assertThat(parsed.result().startTime()).isNull();
        assertThat(parsed.result().startAt()).isNull();
        assertThat(parsed.result().clarificationQuestion()).isEqualTo("몇 시에 시작할까요?");
    }
}
