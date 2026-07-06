package com.antiadhd.tag;

import com.antiadhd.tag.dto.TagRequest;
import com.antiadhd.tag.dto.TagResponse;
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
@RequestMapping("/api/tags")
public class TagController {
    private final TagService tagService;

    public TagController(TagService tagService) {
        this.tagService = tagService;
    }

    @GetMapping
    public List<TagResponse> list(@AuthenticationPrincipal AppUser user) {
        return tagService.list(user);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TagResponse create(@AuthenticationPrincipal AppUser user, @Valid @RequestBody TagRequest request) {
        return tagService.create(user, request);
    }

    @PutMapping("/{id}")
    public TagResponse update(@AuthenticationPrincipal AppUser user, @PathVariable Long id, @Valid @RequestBody TagRequest request) {
        return tagService.update(user, id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal AppUser user, @PathVariable Long id) {
        tagService.delete(user, id);
    }
}

