package com.antiadhd.focus;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import com.antiadhd.focus.dto.FocusCompleteRequest;
import com.antiadhd.focus.dto.FocusSessionRequest;
import com.antiadhd.focus.dto.FocusSessionResponse;
import com.antiadhd.user.AppUser;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

class FocusSessionServiceTest {
    private static final Clock FIXED_CLOCK = Clock.fixed(
            Instant.parse("2026-07-08T09:00:00Z"),
            ZoneId.of("UTC")
    );

    @Mock
    FocusSessionRepository focusSessionRepository;

    FocusSessionService focusSessionService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        focusSessionService = new FocusSessionService(focusSessionRepository, FIXED_CLOCK);
    }

    @Test
    void create_defaultsStartedAtFromClock() {
        when(focusSessionRepository.save(any(FocusSession.class))).thenAnswer(invocation -> invocation.getArgument(0));

        FocusSessionResponse response = focusSessionService.create(
                user(),
                new FocusSessionRequest(" Focus ", null, null, 25, false, " Note ")
        );

        assertThat(response.title()).isEqualTo("Focus");
        assertThat(response.startedAt()).isEqualTo(LocalDateTime.of(2026, 7, 8, 9, 0));
        assertThat(response.note()).isEqualTo("Note");
    }

    @Test
    void complete_defaultsEndedAtFromClock() {
        AppUser user = user();
        FocusSession session = new FocusSession();
        session.setUser(user);
        session.setTitle("Focus");
        session.setStartedAt(LocalDateTime.of(2026, 7, 8, 8, 30));
        session.setCompleted(false);
        when(focusSessionRepository.findByIdAndUser(1L, user)).thenReturn(Optional.of(session));

        FocusSessionResponse response = focusSessionService.complete(user, 1L, new FocusCompleteRequest(null, " Done "));

        assertThat(response.endedAt()).isEqualTo(LocalDateTime.of(2026, 7, 8, 9, 0));
        assertThat(response.completed()).isTrue();
        assertThat(response.note()).isEqualTo("Done");
    }

    private AppUser user() {
        AppUser user = new AppUser();
        user.setEmail("test@example.com");
        user.setName("Test User");
        user.setPassword("encoded-password");
        return user;
    }
}
