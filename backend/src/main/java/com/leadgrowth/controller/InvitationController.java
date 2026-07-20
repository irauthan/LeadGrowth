package com.leadgrowth.controller;

import com.leadgrowth.entity.Invitation;
import com.leadgrowth.repository.InvitationRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/invitations")
public class InvitationController {

    private final InvitationRepository invitationRepository;

    public InvitationController(InvitationRepository invitationRepository) {
        this.invitationRepository = invitationRepository;
    }

    @GetMapping("/verify")
    public ResponseEntity<?> verifyInvitation(@RequestParam String token) {
        Invitation invitation = invitationRepository.findByToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Invalid invitation token"));

        if ("ACCEPTED".equals(invitation.getStatus())) {
            throw new IllegalArgumentException("Invitation has already been accepted");
        }

        Map<String, String> response = new HashMap<>();
        response.put("email", invitation.getEmail());
        response.put("role", invitation.getRole());
        response.put("workspaceName", invitation.getWorkspace().getName());
        return ResponseEntity.ok(response);
    }
}
