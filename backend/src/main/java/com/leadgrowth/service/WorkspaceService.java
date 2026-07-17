package com.leadgrowth.service;

import com.leadgrowth.dto.AuthResponse;
import com.leadgrowth.dto.CreateWorkspaceRequest;
import com.leadgrowth.dto.JoinWorkspaceRequest;
import com.leadgrowth.entity.Role;
import com.leadgrowth.entity.User;
import com.leadgrowth.entity.Workspace;
import com.leadgrowth.repository.RoleRepository;
import com.leadgrowth.repository.UserRepository;
import com.leadgrowth.repository.WorkspaceRepository;
import com.leadgrowth.security.JwtService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Random;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class WorkspaceService {

    private final WorkspaceRepository workspaceRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final JwtService jwtService;

    public WorkspaceService(
            WorkspaceRepository workspaceRepository,
            UserRepository userRepository,
            RoleRepository roleRepository,
            JwtService jwtService
    ) {
        this.workspaceRepository = workspaceRepository;
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.jwtService = jwtService;
    }

    @Transactional
    public AuthResponse createWorkspace(CreateWorkspaceRequest request, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        if (user.getWorkspace() != null) {
            throw new IllegalStateException("User is already a member of a workspace");
        }

        // Generate slug
        String baseSlug = request.getName().toLowerCase()
                .replaceAll("[^a-z0-9\\s]", "")
                .replaceAll("\\s+", "-");
        String slug = baseSlug;
        int count = 1;
        while (workspaceRepository.existsBySlug(slug)) {
            slug = baseSlug + "-" + count++;
        }

        // Generate invite code
        String inviteCode = generateInviteCode();
        while (workspaceRepository.existsByInviteCode(inviteCode)) {
            inviteCode = generateInviteCode();
        }

        Workspace workspace = Workspace.builder()
                .name(request.getName())
                .companyName(request.getCompanyName() != null ? request.getCompanyName() : request.getName())
                .industry(request.getIndustry())
                .teamSize(request.getTeamSize() != null ? request.getTeamSize() : 1)
                .website(request.getWebsite())
                .timezone(request.getTimezone() != null ? request.getTimezone() : "UTC")
                .inviteCode(inviteCode)
                .slug(slug)
                .build();

        Workspace savedWorkspace = workspaceRepository.save(workspace);

        // Assign Role ROLE_ADMIN
        Role adminRole = roleRepository.findByName("ROLE_ADMIN")
                .orElseThrow(() -> new IllegalStateException("ROLE_ADMIN not seeded"));

        user.setWorkspace(savedWorkspace);
        user.getRoles().add(adminRole);
        userRepository.save(user);

        // Regenerate JWT token because user now has a role
        var userDetails = new org.springframework.security.core.userdetails.User(
                user.getEmail(),
                user.getPassword(),
                user.getRoles().stream()
                        .map(role -> new org.springframework.security.core.authority.SimpleGrantedAuthority(role.getName()))
                        .collect(Collectors.toList())
        );
        String jwtToken = jwtService.generateToken(userDetails);

        Set<String> roleNames = user.getRoles().stream().map(Role::getName).collect(Collectors.toSet());

        return AuthResponse.builder()
                .token(jwtToken)
                .userId(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .roles(roleNames)
                .workspaceId(savedWorkspace.getId())
                .workspaceName(savedWorkspace.getName())
                .workspaceSlug(savedWorkspace.getSlug())
                .inviteCode(savedWorkspace.getInviteCode())
                .build();
    }

    @Transactional
    public AuthResponse joinWorkspace(JoinWorkspaceRequest request, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        if (user.getWorkspace() != null) {
            throw new IllegalStateException("User is already a member of a workspace");
        }

        Workspace workspace = workspaceRepository.findByInviteCode(request.getInviteCode())
                .orElseThrow(() -> new IllegalArgumentException("Invalid invite code"));

        Role userRole = roleRepository.findByName("ROLE_USER")
                .orElseThrow(() -> new IllegalStateException("ROLE_USER not seeded"));

        user.setWorkspace(workspace);
        user.getRoles().add(userRole);
        userRepository.save(user);

        // Regenerate JWT token because user now has a role
        var userDetails = new org.springframework.security.core.userdetails.User(
                user.getEmail(),
                user.getPassword(),
                user.getRoles().stream()
                        .map(role -> new org.springframework.security.core.authority.SimpleGrantedAuthority(role.getName()))
                        .collect(Collectors.toList())
        );
        String jwtToken = jwtService.generateToken(userDetails);

        Set<String> roleNames = user.getRoles().stream().map(Role::getName).collect(Collectors.toSet());

        return AuthResponse.builder()
                .token(jwtToken)
                .userId(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .roles(roleNames)
                .workspaceId(workspace.getId())
                .workspaceName(workspace.getName())
                .workspaceSlug(workspace.getSlug())
                .inviteCode(workspace.getInviteCode())
                .build();
    }

    private String generateInviteCode() {
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        StringBuilder sb = new StringBuilder("LG-");
        Random rnd = new Random();
        for (int i = 0; i < 6; i++) {
            sb.append(chars.charAt(rnd.nextInt(chars.length())));
        }
        return sb.toString();
    }
}
