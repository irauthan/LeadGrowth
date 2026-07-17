package com.leadgrowth.controller;

import com.leadgrowth.dto.PasswordChangeRequest;
import com.leadgrowth.dto.UserProfileRequest;
import com.leadgrowth.entity.User;
import com.leadgrowth.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PutMapping("/profile")
    public ResponseEntity<User> updateProfile(@Valid @RequestBody UserProfileRequest request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(userService.updateProfile(request, email));
    }

    @PostMapping("/password")
    public ResponseEntity<Void> changePassword(@Valid @RequestBody PasswordChangeRequest request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        userService.changePassword(request, email);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/members")
    public ResponseEntity<List<User>> getWorkspaceMembers() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(userService.getWorkspaceMembers(email));
    }
}
