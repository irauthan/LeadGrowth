package com.leadgrowth.service;

import com.leadgrowth.entity.Role;
import com.leadgrowth.entity.User;
import com.leadgrowth.entity.WorkspaceInvite;
import com.leadgrowth.repository.RoleRepository;
import com.leadgrowth.repository.UserRepository;
import com.leadgrowth.repository.WorkspaceInviteRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class InviteService {

    private final WorkspaceInviteRepository inviteRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;

    public InviteService(
            WorkspaceInviteRepository inviteRepository,
            UserRepository userRepository,
            RoleRepository roleRepository,
            PasswordEncoder passwordEncoder,
            AuditService auditService
    ) {
        this.inviteRepository = inviteRepository;
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.auditService = auditService;
    }

    public Map<String, Object> createInvite(String email, String role, String actorEmail) {
        User actor = userRepository.findByEmail(actorEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (userRepository.findByEmail(email).isPresent()) {
            throw new IllegalArgumentException("User with email '" + email + "' is already a member.");
        }

        String token = UUID.randomUUID().toString();
        WorkspaceInvite invite = new WorkspaceInvite(actor.getWorkspace(), email, role, token, LocalDateTime.now().plusDays(7));
        WorkspaceInvite saved = inviteRepository.save(invite);

        auditService.logAction(actor.getWorkspace(), actor, "INVITE_SENT", "INVITE", saved.getId(),
                "Sent workspace invitation to " + email + " with role ROLE_" + role);

        return convertToMap(saved);
    }

    public Map<String, Object> validateToken(String token) {
        WorkspaceInvite invite = inviteRepository.findByToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Invalid invitation token"));

        if ("ACCEPTED".equals(invite.getStatus())) {
            throw new IllegalStateException("Invitation has already been accepted.");
        }
        if ("CANCELLED".equals(invite.getStatus())) {
            throw new IllegalStateException("Invitation has been cancelled.");
        }
        if (invite.getExpiresAt().isBefore(LocalDateTime.now())) {
            invite.setStatus("EXPIRED");
            inviteRepository.save(invite);
            throw new IllegalStateException("Invitation token has expired.");
        }

        Map<String, Object> map = new HashMap<>();
        map.put("valid", true);
        map.put("email", invite.getEmail());
        map.put("role", invite.getRole());
        map.put("workspaceName", invite.getWorkspace().getName());
        return map;
    }

    public Map<String, Object> acceptInvite(String token, String fullName, String rawPassword) {
        WorkspaceInvite invite = inviteRepository.findByToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Invalid token"));

        validateToken(token);

        String roleName = "ROLE_" + (invite.getRole() != null ? invite.getRole().toUpperCase() : "USER");
        Role role = roleRepository.findByName(roleName)
                .orElseGet(() -> roleRepository.save(new Role(null, roleName)));

        Set<Role> roles = new HashSet<>();
        roles.add(role);

        User newUser = User.builder()
                .email(invite.getEmail())
                .password(passwordEncoder.encode(rawPassword))
                .fullName(fullName)
                .workspace(invite.getWorkspace())
                .roles(roles)
                .status("ACTIVE")
                .availabilityStatus("AVAILABLE")
                .department("Operations")
                .designation("Specialist")
                .createdAt(LocalDateTime.now())
                .build();

        User savedUser = userRepository.save(newUser);

        invite.setStatus("ACCEPTED");
        inviteRepository.save(invite);

        auditService.logAction(invite.getWorkspace(), savedUser, "INVITE_ACCEPTED", "USER", savedUser.getId(),
                savedUser.getFullName() + " accepted workspace invitation.");

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Registration complete! You may now log in.");
        response.put("email", savedUser.getEmail());
        return response;
    }

    public List<Map<String, Object>> getWorkspaceInvites(String actorEmail) {
        User actor = userRepository.findByEmail(actorEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<WorkspaceInvite> invites = inviteRepository.findByWorkspaceIdOrderByCreatedAtDesc(actor.getWorkspace().getId());
        return invites.stream().map(this::convertToMap).collect(Collectors.toList());
    }

    private Map<String, Object> convertToMap(WorkspaceInvite i) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", i.getId());
        map.put("email", i.getEmail());
        map.put("role", i.getRole());
        map.put("token", i.getToken());
        map.put("status", i.getStatus());
        map.put("expiresAt", i.getExpiresAt().toString());
        map.put("createdAt", i.getCreatedAt().toString());
        map.put("inviteUrl", "/invite/accept?token=" + i.getToken());
        return map;
    }
}
