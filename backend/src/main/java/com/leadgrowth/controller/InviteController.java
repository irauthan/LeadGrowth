package com.leadgrowth.controller;

import com.leadgrowth.service.InviteService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/invites")
public class InviteController {

    private final InviteService inviteService;

    public InviteController(InviteService inviteService) {
        this.inviteService = inviteService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Map<String, Object>> createInvite(@RequestBody Map<String, String> payload) {
        String actorEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        String email = payload.get("email");
        String role = payload.getOrDefault("role", "USER");
        return ResponseEntity.ok(inviteService.createInvite(email, role, actorEmail));
    }

    @GetMapping("/validate")
    public ResponseEntity<Map<String, Object>> validateToken(@RequestParam String token) {
        return ResponseEntity.ok(inviteService.validateToken(token));
    }

    @PostMapping("/accept")
    public ResponseEntity<Map<String, Object>> acceptInvite(@RequestBody Map<String, String> payload) {
        String token = payload.get("token");
        String fullName = payload.get("fullName");
        String password = payload.get("password");
        return ResponseEntity.ok(inviteService.acceptInvite(token, fullName, password));
    }

    @GetMapping("/workspace")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<List<Map<String, Object>>> getWorkspaceInvites() {
        String actorEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(inviteService.getWorkspaceInvites(actorEmail));
    }
}
