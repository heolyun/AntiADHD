package com.antiadhd.user;

import com.antiadhd.auth.dto.AuthResponse;
import com.antiadhd.user.dto.ChangePasswordRequest;
import com.antiadhd.user.dto.DeleteAccountRequest;
import com.antiadhd.user.dto.UserSummary;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
public class UserController {
    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/me")
    public UserSummary me(@AuthenticationPrincipal AppUser user) {
        return UserSummary.from(user);
    }

    @PutMapping("/me/password")
    public AuthResponse changePassword(
            @AuthenticationPrincipal AppUser user,
            @Valid @RequestBody ChangePasswordRequest request
    ) {
        return userService.changePassword(user, request.currentPassword(), request.newPassword());
    }

    @DeleteMapping("/me")
    @org.springframework.web.bind.annotation.ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteAccount(
            @AuthenticationPrincipal AppUser user,
            @Valid @RequestBody DeleteAccountRequest request
    ) {
        userService.deleteAccount(user, request.password());
    }
}
