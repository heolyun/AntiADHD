package com.antiadhd.focus;

import com.antiadhd.focus.dto.FocusCompleteRequest;
import com.antiadhd.focus.dto.FocusSessionRequest;
import com.antiadhd.focus.dto.FocusSessionResponse;
import com.antiadhd.user.AppUser;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/focus-sessions")
public class FocusSessionController {
    private final FocusSessionService focusSessionService;

    public FocusSessionController(FocusSessionService focusSessionService) {
        this.focusSessionService = focusSessionService;
    }

    @GetMapping
    public List<FocusSessionResponse> list(@AuthenticationPrincipal AppUser user) {
        return focusSessionService.list(user);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public FocusSessionResponse create(@AuthenticationPrincipal AppUser user, @Valid @RequestBody FocusSessionRequest request) {
        return focusSessionService.create(user, request);
    }

    @PutMapping("/{id}")
    public FocusSessionResponse update(@AuthenticationPrincipal AppUser user, @PathVariable Long id, @Valid @RequestBody FocusSessionRequest request) {
        return focusSessionService.update(user, id, request);
    }

    @PatchMapping("/{id}/complete")
    public FocusSessionResponse complete(@AuthenticationPrincipal AppUser user, @PathVariable Long id, @Valid @RequestBody FocusCompleteRequest request) {
        return focusSessionService.complete(user, id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal AppUser user, @PathVariable Long id) {
        focusSessionService.delete(user, id);
    }
}

