package com.leadgrowth.service;

import com.leadgrowth.dto.*;
import com.leadgrowth.entity.*;
import com.leadgrowth.repository.*;
import com.leadgrowth.security.JwtService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final WorkspaceRepository workspaceRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final InvitationRepository invitationRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final EmailVerificationTokenRepository emailVerificationTokenRepository;
    private final UserSessionRepository userSessionRepository;

    public AuthService(
            UserRepository userRepository,
            RoleRepository roleRepository,
            WorkspaceRepository workspaceRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            AuthenticationManager authenticationManager,
            InvitationRepository invitationRepository,
            RefreshTokenRepository refreshTokenRepository,
            PasswordResetTokenRepository passwordResetTokenRepository,
            EmailVerificationTokenRepository emailVerificationTokenRepository,
            UserSessionRepository userSessionRepository
    ) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.workspaceRepository = workspaceRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.authenticationManager = authenticationManager;
        this.invitationRepository = invitationRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.emailVerificationTokenRepository = emailVerificationTokenRepository;
        this.userSessionRepository = userSessionRepository;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email is already registered");
        }

        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new IllegalArgumentException("Passwords do not match");
        }

        // Initialize User
        User user = User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail().toLowerCase())
                .phone(request.getPhone())
                .password(passwordEncoder.encode(request.getPassword()))
                .status("ACTIVE")
                .isEmailVerified(false)
                .roles(new HashSet<>())
                .build();

        // 3-Step signup onboarding selection
        if ("CREATE".equalsIgnoreCase(request.getWorkspaceAction())) {
            String wsName = request.getWorkspaceName();
            if (wsName == null || wsName.trim().isEmpty()) {
                wsName = request.getFullName() + "'s Workspace";
            }
            Workspace ws = Workspace.builder()
                    .name(wsName)
                    .companyName(request.getCompanyName())
                    .inviteCode("WS-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                    .slug(wsName.toLowerCase().replaceAll("[^a-z0-9]", "-") + "-" + UUID.randomUUID().toString().substring(0, 4))
                    .build();
            workspaceRepository.save(ws);
            user.setWorkspace(ws);

            Role adminRole = roleRepository.findByName("ROLE_ADMIN")
                    .orElseThrow(() -> new IllegalStateException("ROLE_ADMIN not found"));
            user.getRoles().add(adminRole);

        } else if ("JOIN".equalsIgnoreCase(request.getWorkspaceAction())) {
            Workspace ws = workspaceRepository.findByInviteCode(request.getInviteCode())
                    .orElseThrow(() -> new IllegalArgumentException("Invalid workspace invite code"));
            user.setWorkspace(ws);

            Role userRole = roleRepository.findByName("ROLE_USER")
                    .orElseThrow(() -> new IllegalStateException("ROLE_USER not found"));
            user.getRoles().add(userRole);
        } else {
            throw new IllegalArgumentException("Workspace action must be CREATE or JOIN");
        }

        userRepository.save(user);

        // Session Setup
        UserSession session = new UserSession(null, user, "127.0.0.1", "Browser - Signup Flow", LocalDateTime.now(), LocalDateTime.now(), false);
        userSessionRepository.save(session);

        // JWT Generation
        var userDetails = new org.springframework.security.core.userdetails.User(
                user.getEmail(),
                user.getPassword(),
                user.getRoles().stream()
                        .map(role -> new org.springframework.security.core.authority.SimpleGrantedAuthority(role.getName()))
                        .collect(Collectors.toList())
        );
        String jwtToken = jwtService.generateToken(userDetails);
        String refToken = createRefreshToken(user, false);

        Set<String> roles = user.getRoles().stream().map(Role::getName).collect(Collectors.toSet());
        Workspace ws = user.getWorkspace();

        return AuthResponse.builder()
                .token(jwtToken)
                .refreshToken(refToken)
                .userId(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .roles(roles)
                .workspaceId(ws != null ? ws.getId() : null)
                .workspaceName(ws != null ? ws.getName() : null)
                .workspaceSlug(ws != null ? ws.getSlug() : null)
                .inviteCode(ws != null ? ws.getInviteCode() : null)
                .availabilityStatus(user.getAvailabilityStatus())
                .build();
    }

    @Transactional
    public AuthResponse login(LoginRequest request, String ipAddress, String userAgent) {
        User user = userRepository.findByEmail(request.getEmail().toLowerCase())
                .orElseThrow(() -> new UsernameNotFoundException("Invalid credentials"));

        if ("SUSPENDED".equalsIgnoreCase(user.getStatus())) {
            throw new IllegalArgumentException("Your account has been suspended. Please contact your workspace administrator.");
        }

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail().toLowerCase(), request.getPassword())
        );

        // Update Last Active
        user.setLastActiveAt(LocalDateTime.now());
        userRepository.save(user);

        // Log Session
        UserSession session = new UserSession(null, user, ipAddress, userAgent, LocalDateTime.now(), LocalDateTime.now(), false);
        userSessionRepository.save(session);

        var userDetails = new org.springframework.security.core.userdetails.User(
                user.getEmail(),
                user.getPassword(),
                user.getRoles().stream()
                        .map(role -> new org.springframework.security.core.authority.SimpleGrantedAuthority(role.getName()))
                        .collect(Collectors.toList())
        );
        String jwtToken = jwtService.generateToken(userDetails);
        String refToken = createRefreshToken(user, request.isRememberMe());

        Workspace ws = user.getWorkspace();
        Set<String> roles = user.getRoles().stream().map(Role::getName).collect(Collectors.toSet());

        return AuthResponse.builder()
                .token(jwtToken)
                .refreshToken(refToken)
                .userId(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .roles(roles)
                .workspaceId(ws != null ? ws.getId() : null)
                .workspaceName(ws != null ? ws.getName() : null)
                .workspaceSlug(ws != null ? ws.getSlug() : null)
                .inviteCode(ws != null ? ws.getInviteCode() : null)
                .availabilityStatus(user.getAvailabilityStatus())
                .build();
    }

    public AuthResponse getCurrentUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        // Update Last Active
        user.setLastActiveAt(LocalDateTime.now());
        userRepository.save(user);

        Workspace ws = user.getWorkspace();
        Set<String> roles = user.getRoles().stream().map(Role::getName).collect(Collectors.toSet());

        return AuthResponse.builder()
                .userId(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .roles(roles)
                .workspaceId(ws != null ? ws.getId() : null)
                .workspaceName(ws != null ? ws.getName() : null)
                .workspaceSlug(ws != null ? ws.getSlug() : null)
                .inviteCode(ws != null ? ws.getInviteCode() : null)
                .availabilityStatus(user.getAvailabilityStatus())
                .build();
    }

    @Transactional
    public AuthResponse registerInvited(RegisterInvitedRequest request) {
        Invitation invitation = invitationRepository.findByToken(request.getToken())
                .orElseThrow(() -> new IllegalArgumentException("Invalid invitation token"));

        if ("ACCEPTED".equalsIgnoreCase(invitation.getStatus())) {
            throw new IllegalArgumentException("Invitation has already been accepted");
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email is already registered");
        }

        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new IllegalArgumentException("Passwords do not match");
        }

        Role role = roleRepository.findByName("ROLE_" + invitation.getRole().toUpperCase())
                .orElseThrow(() -> new IllegalStateException("Pre-assigned role " + invitation.getRole() + " not found"));

        User user = User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail().toLowerCase())
                .phone(request.getPhone())
                .password(passwordEncoder.encode(request.getPassword()))
                .workspace(invitation.getWorkspace())
                .roles(new HashSet<>(List.of(role)))
                .status("ACTIVE")
                .isEmailVerified(true) // Verified through email token acceptance
                .lastActiveAt(LocalDateTime.now())
                .build();

        userRepository.save(user);

        invitation.setStatus("ACCEPTED");
        invitationRepository.save(invitation);

        // Session Setup
        UserSession session = new UserSession(null, user, "127.0.0.1", "Browser - Joined via Invite", LocalDateTime.now(), LocalDateTime.now(), false);
        userSessionRepository.save(session);

        var userDetails = new org.springframework.security.core.userdetails.User(
                user.getEmail(),
                user.getPassword(),
                user.getRoles().stream()
                        .map(r -> new org.springframework.security.core.authority.SimpleGrantedAuthority(r.getName()))
                        .collect(Collectors.toList())
        );
        String jwtToken = jwtService.generateToken(userDetails);
        String refToken = createRefreshToken(user, false);

        Set<String> roles = user.getRoles().stream().map(Role::getName).collect(Collectors.toSet());

        return AuthResponse.builder()
                .token(jwtToken)
                .refreshToken(refToken)
                .userId(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .roles(roles)
                .workspaceId(invitation.getWorkspace().getId())
                .workspaceName(invitation.getWorkspace().getName())
                .workspaceSlug(invitation.getWorkspace().getSlug())
                .inviteCode(invitation.getWorkspace().getInviteCode())
                .availabilityStatus(user.getAvailabilityStatus())
                .build();
    }

    // Refresh Token Management
    @Transactional
    public String createRefreshToken(User user, boolean rememberMe) {
        refreshTokenRepository.deleteByUser(user); // clear old token
        refreshTokenRepository.flush();
        long expirationSec = rememberMe ? 2592000 : 86400; // 30 days vs 1 day
        String token = UUID.randomUUID().toString();
        RefreshToken refreshToken = new RefreshToken(
                null,
                token,
                user,
                Instant.now().plus(expirationSec, ChronoUnit.SECONDS)
        );
        refreshTokenRepository.save(refreshToken);
        return token;
    }

    @Transactional
    public AuthResponse refreshAccessToken(String token) {
        RefreshToken refreshToken = refreshTokenRepository.findByToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Refresh token not found"));

        if (refreshToken.getExpiryDate().isBefore(Instant.now())) {
            refreshTokenRepository.delete(refreshToken);
            throw new IllegalArgumentException("Refresh token has expired. Please sign in again.");
        }

        User user = refreshToken.getUser();
        if ("SUSPENDED".equalsIgnoreCase(user.getStatus())) {
            throw new IllegalArgumentException("Account is suspended.");
        }

        // Rotate token
        String newToken = UUID.randomUUID().toString();
        refreshToken.setToken(newToken);
        refreshToken.setExpiryDate(Instant.now().plus(24, ChronoUnit.HOURS));
        refreshTokenRepository.save(refreshToken);

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
                .refreshToken(newToken)
                .userId(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .roles(roles)
                .workspaceId(ws != null ? ws.getId() : null)
                .workspaceName(ws != null ? ws.getName() : null)
                .workspaceSlug(ws != null ? ws.getSlug() : null)
                .inviteCode(ws != null ? ws.getInviteCode() : null)
                .availabilityStatus(user.getAvailabilityStatus())
                .build();
    }

    // Password Reset
    @Transactional
    public void requestPasswordReset(String email) {
        User user = userRepository.findByEmail(email.toLowerCase())
                .orElseThrow(() -> new UsernameNotFoundException("Email address not found."));

        String token = UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        PasswordResetToken resetToken = new PasswordResetToken(
                null,
                token,
                user,
                LocalDateTime.now().plusHours(2)
        );
        passwordResetTokenRepository.save(resetToken);
        System.out.println("[PASSWORD RESET] Token generated for " + email + ": " + token);
    }

    @Transactional
    public void confirmPasswordReset(PasswordResetConfirmRequest request) {
        PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(request.getToken())
                .orElseThrow(() -> new IllegalArgumentException("Invalid or expired reset token"));

        if (resetToken.getExpiryDate().isBefore(LocalDateTime.now())) {
            passwordResetTokenRepository.delete(resetToken);
            throw new IllegalArgumentException("Reset token has expired");
        }

        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new IllegalArgumentException("Passwords do not match");
        }

        User user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        passwordResetTokenRepository.delete(resetToken);
    }

    // Email Verification
    @Transactional
    public void requestEmailVerification(String email) {
        User user = userRepository.findByEmail(email.toLowerCase())
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        String token = UUID.randomUUID().toString();
        EmailVerificationToken verificationToken = new EmailVerificationToken(
                null,
                token,
                user,
                LocalDateTime.now().plusDays(1)
        );
        emailVerificationTokenRepository.save(verificationToken);
        System.out.println("[EMAIL VERIFICATION] Token generated for " + email + ": " + token);
    }

    @Transactional
    public void verifyEmail(String token) {
        EmailVerificationToken verificationToken = emailVerificationTokenRepository.findByToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Invalid verification token"));

        if (verificationToken.getExpiryDate().isBefore(LocalDateTime.now())) {
            emailVerificationTokenRepository.delete(verificationToken);
            throw new IllegalArgumentException("Verification token has expired");
        }

        User user = verificationToken.getUser();
        user.setEmailVerified(true);
        userRepository.save(user);

        emailVerificationTokenRepository.delete(verificationToken);
    }

    // Session Monitoring
    public List<UserSessionDto> getSessions(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        return userSessionRepository.findByUser(user).stream()
                .map(s -> new UserSessionDto(s.getId(), s.getIpAddress(), s.getUserAgent(), s.getLoginTime(), s.getLastActiveTime(), s.isExpired()))
                .collect(Collectors.toList());
    }

    @Transactional
    public void revokeSession(Long sessionId, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        UserSession session = userSessionRepository.findByIdAndUser(sessionId, user)
                .orElseThrow(() -> new IllegalArgumentException("Session not found"));
        session.setExpired(true);
        userSessionRepository.save(session);
    }
}
