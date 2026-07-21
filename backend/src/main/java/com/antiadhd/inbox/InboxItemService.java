package com.antiadhd.inbox;

import com.antiadhd.common.exception.ResourceNotFoundException;
import com.antiadhd.inbox.dto.InboxItemRequest;
import com.antiadhd.inbox.dto.InboxItemResponse;
import com.antiadhd.user.AppUser;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class InboxItemService {
    private final InboxItemRepository repository;

    public InboxItemService(InboxItemRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<InboxItemResponse> list(AppUser user) {
        return repository.findByUserOrderByCreatedAtDesc(user).stream()
                .map(InboxItemResponse::from)
                .toList();
    }

    @Transactional
    public InboxItemResponse create(AppUser user, InboxItemRequest request) {
        InboxItem item = new InboxItem();
        item.setUser(user);
        apply(item, request);
        return InboxItemResponse.from(repository.save(item));
    }

    @Transactional
    public InboxItemResponse update(AppUser user, Long id, InboxItemRequest request) {
        InboxItem item = findOwned(user, id);
        apply(item, request);
        return InboxItemResponse.from(item);
    }

    @Transactional
    public void delete(AppUser user, Long id) {
        repository.delete(findOwned(user, id));
    }

    private InboxItem findOwned(AppUser user, Long id) {
        return repository.findByIdAndUser(id, user)
                .orElseThrow(() -> new ResourceNotFoundException("Inbox item not found."));
    }

    private void apply(InboxItem item, InboxItemRequest request) {
        item.setTitle(request.title().trim());
        item.setDescription(request.description() == null ? null : request.description().trim());
        item.setEstimatedMinutes(request.estimatedMinutes());
        item.setPriority(request.priority() == null ? InboxPriority.MEDIUM : request.priority());
        item.setStatus(request.status() == null ? InboxStatus.INBOX : request.status());
    }
}
