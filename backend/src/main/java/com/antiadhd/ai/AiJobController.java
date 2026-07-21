package com.antiadhd.ai;

import com.antiadhd.ai.dto.AiJobAcceptedResponse;
import com.antiadhd.ai.dto.AiJobResponse;
import com.antiadhd.ai.dto.CreateTaskBreakdownRequest;
import com.antiadhd.user.AppUser;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.http.MediaType;
import org.springframework.web.multipart.MultipartFile;
import com.antiadhd.ai.dto.VoiceCommandJobResponse;

@RestController
@RequestMapping("/api/ai")
public class AiJobController {
    private final AiJobService aiJobService;

    public AiJobController(AiJobService aiJobService) {
        this.aiJobService = aiJobService;
    }

    @PostMapping("/task-breakdowns")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public AiJobAcceptedResponse createTaskBreakdown(
            @AuthenticationPrincipal AppUser user,
            @Valid @RequestBody CreateTaskBreakdownRequest request
    ) {
        return aiJobService.createTaskBreakdown(user, request);
    }

    @GetMapping("/jobs/{id}")
    public AiJobResponse get(@AuthenticationPrincipal AppUser user, @PathVariable UUID id) {
        return aiJobService.get(user, id);
    }

    @PostMapping(value = "/voice-commands", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.ACCEPTED)
    public AiJobAcceptedResponse createVoiceCommand(
            @AuthenticationPrincipal AppUser user,
            @RequestPart("audio") MultipartFile audio
    ) {
        return aiJobService.createVoiceCommand(user, audio);
    }

    @GetMapping("/voice-commands/{id}")
    public VoiceCommandJobResponse getVoiceCommand(@AuthenticationPrincipal AppUser user, @PathVariable UUID id) {
        return aiJobService.getVoiceCommand(user, id);
    }
}
