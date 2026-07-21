package com.antiadhd.inbox;

import com.antiadhd.inbox.dto.InboxItemRequest;
import com.antiadhd.inbox.dto.InboxItemResponse;
import com.antiadhd.user.AppUser;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/inbox-items")
public class InboxItemController {
    private final InboxItemService service;

    public InboxItemController(InboxItemService service) {
        this.service = service;
    }

    @GetMapping
    public List<InboxItemResponse> list(@AuthenticationPrincipal AppUser user) {
        return service.list(user);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public InboxItemResponse create(@AuthenticationPrincipal AppUser user, @Valid @RequestBody InboxItemRequest request) {
        return service.create(user, request);
    }

    @PutMapping("/{id}")
    public InboxItemResponse update(
            @AuthenticationPrincipal AppUser user,
            @PathVariable Long id,
            @Valid @RequestBody InboxItemRequest request
    ) {
        return service.update(user, id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal AppUser user, @PathVariable Long id) {
        service.delete(user, id);
    }
}
