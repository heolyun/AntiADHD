package com.antiadhd.focus;

import com.antiadhd.focus.dto.FocusCompleteRequest;
import com.antiadhd.focus.dto.FocusSessionRequest;
import com.antiadhd.focus.dto.FocusSessionResponse;
import com.antiadhd.user.AppUser;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class FocusSessionService {
    private final FocusSessionRepository focusSessionRepository;

    public FocusSessionService(FocusSessionRepository focusSessionRepository) {
        this.focusSessionRepository = focusSessionRepository;
    }

    @Transactional(readOnly = true)
    public List<FocusSessionResponse> list(AppUser user) {
        return focusSessionRepository.findByUserOrderByStartedAtDesc(user).stream().map(FocusSessionResponse::from).toList();
    }

    @Transactional
    public FocusSessionResponse create(AppUser user, FocusSessionRequest request) {
        FocusSession session = new FocusSession();
        session.setUser(user);
        apply(session, request);
        return FocusSessionResponse.from(focusSessionRepository.save(session));
    }

    @Transactional
    public FocusSessionResponse update(AppUser user, Long id, FocusSessionRequest request) {
        FocusSession session = findOwned(user, id);
        apply(session, request);
        return FocusSessionResponse.from(session);
    }

    @Transactional
    public FocusSessionResponse complete(AppUser user, Long id, FocusCompleteRequest request) {
        FocusSession session = findOwned(user, id);
        session.setEndedAt(request.endedAt() == null ? LocalDateTime.now() : request.endedAt());
        session.setNote(request.note() == null ? session.getNote() : request.note().trim());
        session.setCompleted(true);
        return FocusSessionResponse.from(session);
    }

    @Transactional
    public void delete(AppUser user, Long id) {
        focusSessionRepository.delete(findOwned(user, id));
    }

    private FocusSession findOwned(AppUser user, Long id) {
        return focusSessionRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Focus session not found."));
    }

    private void apply(FocusSession session, FocusSessionRequest request) {
        session.setTitle(request.title().trim());
        session.setStartedAt(request.startedAt() == null ? LocalDateTime.now() : request.startedAt());
        session.setEndedAt(request.endedAt());
        session.setPlannedMinutes(request.plannedMinutes());
        session.setCompleted(request.completed());
        session.setNote(request.note() == null ? null : request.note().trim());
    }
}

