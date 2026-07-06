package com.antiadhd.tag;

import com.antiadhd.tag.dto.TagRequest;
import com.antiadhd.tag.dto.TagResponse;
import com.antiadhd.user.AppUser;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class TagService {
    private final TagRepository tagRepository;

    public TagService(TagRepository tagRepository) {
        this.tagRepository = tagRepository;
    }

    @Transactional(readOnly = true)
    public List<TagResponse> list(AppUser user) {
        return tagRepository.findByUserOrderByNameAsc(user).stream().map(TagResponse::from).toList();
    }

    @Transactional
    public TagResponse create(AppUser user, TagRequest request) {
        Tag tag = new Tag();
        tag.setUser(user);
        apply(tag, request);
        return TagResponse.from(tagRepository.save(tag));
    }

    @Transactional
    public TagResponse update(AppUser user, Long id, TagRequest request) {
        Tag tag = findOwned(user, id);
        apply(tag, request);
        return TagResponse.from(tag);
    }

    @Transactional
    public void delete(AppUser user, Long id) {
        tagRepository.delete(findOwned(user, id));
    }

    public Tag findOwned(AppUser user, Long id) {
        return tagRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Tag not found."));
    }

    private void apply(Tag tag, TagRequest request) {
        tag.setName(request.name().trim());
        tag.setColor(request.color());
    }
}

