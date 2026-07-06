package com.antiadhd.ai;

import com.antiadhd.ai.dto.AiSuggestionResponse;
import com.antiadhd.user.AppUser;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ai")
public class AiSuggestionController {
    private final AiSuggestionService aiSuggestionService;

    public AiSuggestionController(AiSuggestionService aiSuggestionService) {
        this.aiSuggestionService = aiSuggestionService;
    }

    @GetMapping("/suggestions")
    public AiSuggestionResponse suggestions(@AuthenticationPrincipal AppUser user) {
        return aiSuggestionService.getSuggestions(user);
    }
}

