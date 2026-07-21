package com.antiadhd.inbox;

import com.antiadhd.user.AppUser;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InboxItemRepository extends JpaRepository<InboxItem, Long> {
    List<InboxItem> findByUserOrderByCreatedAtDesc(AppUser user);
    Optional<InboxItem> findByIdAndUser(Long id, AppUser user);
}
