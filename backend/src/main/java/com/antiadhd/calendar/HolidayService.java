package com.antiadhd.calendar;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.time.Duration;
import java.time.LocalDate;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

@Service
public class HolidayService {
    private static final Logger log = LoggerFactory.getLogger(HolidayService.class);
    private final ObjectMapper objectMapper;
    private final RestClient restClient;
    private final ConcurrentMap<Integer, List<Holiday>> yearlyCache = new ConcurrentHashMap<>();

    public HolidayService(
            ObjectMapper objectMapper,
            @Value("${app.calendar.holiday-api-base-url:https://date.nager.at}") String baseUrl
    ) {
        this.objectMapper = objectMapper;
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(Duration.ofSeconds(3));
        requestFactory.setReadTimeout(Duration.ofSeconds(5));
        this.restClient = RestClient.builder().baseUrl(baseUrl).requestFactory(requestFactory).build();
    }

    public List<Holiday> getKoreanHolidays(int year) {
        if (year < 2000 || year > 2100) {
            throw new IllegalArgumentException("Year must be between 2000 and 2100.");
        }
        List<Holiday> cached = yearlyCache.get(year);
        if (cached != null) return cached;

        try {
            String body = restClient.get()
                    .uri("/api/v3/PublicHolidays/{year}/KR", year)
                    .retrieve()
                    .body(String.class);
            List<Holiday> holidays = parse(body);
            yearlyCache.put(year, holidays);
            return holidays;
        } catch (RestClientException exception) {
            log.warn("Unable to retrieve Korean holidays for {}", year, exception);
            return List.of();
        }
    }

    List<Holiday> parse(String body) {
        try {
            JsonNode root = objectMapper.readTree(body);
            if (!root.isArray()) return List.of();
            return objectMapper.readerForListOf(RemoteHoliday.class).<List<RemoteHoliday>>readValue(root)
                    .stream()
                    .filter(item -> item.date() != null && item.localName() != null && !item.localName().isBlank())
                    .map(item -> new Holiday(item.date(), item.localName()))
                    .distinct()
                    .sorted((left, right) -> left.date().compareTo(right.date()))
                    .toList();
        } catch (Exception exception) {
            log.warn("Unable to parse the holiday provider response", exception);
            return List.of();
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record RemoteHoliday(LocalDate date, String localName) {
    }
}
