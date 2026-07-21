package com.antiadhd.inbox;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import com.antiadhd.inbox.dto.InboxItemRequest;
import com.antiadhd.inbox.dto.InboxItemResponse;
import com.antiadhd.user.AppUser;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class InboxItemServiceTest {
    @Mock
    InboxItemRepository repository;

    @InjectMocks
    InboxItemService service;

    @Test
    void create_trimsTextAndUsesSafeDefaults() {
        AppUser user = new AppUser();
        user.setEmail("test@example.com");
        user.setName("Test");
        user.setPassword("encoded");
        when(repository.save(any(InboxItem.class))).thenAnswer(invocation -> invocation.getArgument(0));

        InboxItemResponse response = service.create(user, new InboxItemRequest(
                "  발표 준비  ",
                "  떠오른 내용을 먼저 기록  ",
                30,
                null,
                null
        ));

        assertThat(response.title()).isEqualTo("발표 준비");
        assertThat(response.description()).isEqualTo("떠오른 내용을 먼저 기록");
        assertThat(response.estimatedMinutes()).isEqualTo(30);
        assertThat(response.priority()).isEqualTo(InboxPriority.MEDIUM);
        assertThat(response.status()).isEqualTo(InboxStatus.INBOX);
    }
}
