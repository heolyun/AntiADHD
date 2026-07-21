package com.antiadhd.calendar;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.LocalDate;
import org.junit.jupiter.api.Test;

class HolidayServiceTest {
    private final HolidayService service = new HolidayService(
            new ObjectMapper().findAndRegisterModules(),
            "https://example.invalid"
    );

    @Test
    void parse_readsAndSortsKoreanHolidayNames() {
        String response = """
                [
                  {"date":"2026-03-01","localName":"삼일절","name":"Independence Movement Day"},
                  {"date":"2026-01-01","localName":"새해 첫날","name":"New Year's Day"}
                ]
                """;

        assertThat(service.parse(response))
                .containsExactly(
                        new Holiday(LocalDate.of(2026, 1, 1), "새해 첫날"),
                        new Holiday(LocalDate.of(2026, 3, 1), "삼일절")
                );
    }
}
