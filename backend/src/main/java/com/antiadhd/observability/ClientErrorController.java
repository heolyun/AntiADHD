package com.antiadhd.observability;

import com.antiadhd.observability.dto.ClientErrorRequest;
import com.antiadhd.user.AppUser;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/client-errors")
public class ClientErrorController {
    private final ClientErrorService clientErrorService;

    public ClientErrorController(ClientErrorService clientErrorService) {
        this.clientErrorService = clientErrorService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.ACCEPTED)
    public void report(@AuthenticationPrincipal AppUser user, @Valid @RequestBody ClientErrorRequest request) {
        clientErrorService.record(user, request);
    }
}
