package com.antiadhd.user;

import com.antiadhd.user.dto.UserSummary;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
public class UserController {
    @GetMapping("/me")
    public UserSummary me(@AuthenticationPrincipal AppUser user) {
        return UserSummary.from(user);
    }
}
