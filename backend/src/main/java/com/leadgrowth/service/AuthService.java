package com.leadgrowth.service;

import com.leadgrowth.dto.AuthResponse;
import com.leadgrowth.dto.LoginRequest;
import com.leadgrowth.dto.RegisterRequest;
import com.leadgrowth.entity.Role;
import com.leadgrowth.entity.User;
import com.leadgrowth.entity.Workspace;
import com.leadgrowth.repository.RoleRepository;
import com.leadgrowth.repository.UserRepository;
import com.leadgrowth.repository.WorkspaceRepository;
import com.leadgrowth.security.JwtService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final WorkspaceRepository workspaceRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    public AuthService(
            UserRepository userRepository,
            RoleRepository roleRepository,
            WorkspaceRepository workspaceRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            AuthenticationManager authenticationManager
    ) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.workspaceRepository = workspaceRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.authenticationManager = authenticationManager;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email is already registered");
        }

        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new IllegalArgumentException("Passwords do not match");
        }

        User user = User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .phone(request.getPhone())
                .password(passwordEncoder.encode(request.getPassword()))
                .roles(new HashSet<>()) // Will be assigned during onboarding (create/join workspace)
                .build();

        userRepository.save(user);

        // Generate token immediately for registration autologin
        var userDetails = new org.springframework.security.core.userdetails.User(
                user.getEmail(),
                user.getPassword(),
                new HashSet<>()
        );
        String jwtToken = jwtService.generateToken(userDetails);

        return AuthResponse.builder()
                .token(jwtToken)
                .userId(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .roles(new HashSet<>())
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        var userDetails = new org.springframework.security.core.userdetails.User(
                user.getEmail(),
                user.getPassword(),
                user.getRoles().stream()
                        .map(role -> new org.springframework.security.core.authority.SimpleGrantedAuthority(role.getName()))
                        .collect(Collectors.toList())
        );
        String jwtToken = jwtService.generateToken(userDetails);

        Workspace ws = user.getWorkspace();
        Set<String> roles = user.getRoles().stream().map(Role::getName).collect(Collectors.toSet());

        return AuthResponse.builder()
                .token(jwtToken)
                .userId(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .designation(user.getDesignation())
                .profileImage(user.getProfileImage())
                .roles(roles)
                .workspaceId(ws != null ? ws.getId() : null)
                .workspaceName(ws != null ? ws.getName() : null)
                .workspaceSlug(ws != null ? ws.getSlug() : null)
                .inviteCode(ws != null ? ws.getInviteCode() : null)
                .build();
    }

    public AuthResponse getCurrentUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        Workspace ws = user.getWorkspace();
        Set<String> roles = user.getRoles().stream().map(Role::getName).collect(Collectors.toSet());

        return AuthResponse.builder()
                .userId(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .designation(user.getDesignation())
                .profileImage(user.getProfileImage())
                .roles(roles)
                .workspaceId(ws != null ? ws.getId() : null)
                .workspaceName(ws != null ? ws.getName() : null)
                .workspaceSlug(ws != null ? ws.getSlug() : null)
                .inviteCode(ws != null ? ws.getInviteCode() : null)
                .build();
    }
}
