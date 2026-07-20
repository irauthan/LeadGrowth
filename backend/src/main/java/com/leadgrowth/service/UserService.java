package com.leadgrowth.service;

import com.leadgrowth.dto.PasswordChangeRequest;
import com.leadgrowth.dto.UserProfileRequest;
import com.leadgrowth.dto.UserInviteRequest;
import com.leadgrowth.dto.UserRoleUpdateRequest;
import com.leadgrowth.dto.UserStatusUpdateRequest;
import com.leadgrowth.entity.*;
import com.leadgrowth.repository.*;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final RoleRepository roleRepository;
    private final InvitationRepository invitationRepository;
    private final ActivityLogRepository activityLogRepository;

    public UserService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            RoleRepository roleRepository,
            InvitationRepository invitationRepository,
            ActivityLogRepository activityLogRepository
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.roleRepository = roleRepository;
        this.invitationRepository = invitationRepository;
        this.activityLogRepository = activityLogRepository;
    }

    @Transactional
    public User updateProfile(UserProfileRequest request, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        user.setFullName(request.getFullName());
        user.setPhone(request.getPhone());
        user.setDesignation(request.getDesignation());
        user.setBio(request.getBio());
        user.setDepartment(request.getDepartment());
        
        if (request.getProfileImage() != null) {
            user.setProfileImage(request.getProfileImage());
        }

        return userRepository.save(user);
    }

    @Transactional
    public void changePassword(PasswordChangeRequest request, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        if (!passwordEncoder.matches(request.getOldPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Incorrect old password");
        }

        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new IllegalArgumentException("New passwords do not match");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    public List<User> getWorkspaceMembers(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        if (user.getWorkspace() == null) {
            throw new IllegalStateException("User does not belong to a workspace");
        }
        return userRepository.findByWorkspaceId(user.getWorkspace().getId());
    }

    @Transactional
    public Invitation inviteUser(UserInviteRequest request, String inviterEmail) {
        User inviter = userRepository.findByEmail(inviterEmail)
                .orElseThrow(() -> new UsernameNotFoundException("Inviter not found"));

        Workspace workspace = inviter.getWorkspace();
        if (workspace == null) {
            throw new IllegalStateException("Inviter does not belong to a workspace");
        }

        boolean isAdmin = inviter.getRoles().stream().anyMatch(r -> r.getName().equals("ROLE_ADMIN"));
        boolean isManager = inviter.getRoles().stream().anyMatch(r -> r.getName().equals("ROLE_MANAGER"));

        if (!isAdmin && !isManager) {
            throw new IllegalStateException("Unauthorized to send invitations");
        }

        // Manager can invite Users only
        if (isManager && !"USER".equalsIgnoreCase(request.getRole())) {
            throw new IllegalArgumentException("Managers are only permitted to invite Users");
        }

        String targetRoleName = "ROLE_" + request.getRole().toUpperCase();
        final String finalRoleName = targetRoleName;
        Role role = roleRepository.findByName(finalRoleName)
                .orElseThrow(() -> new IllegalArgumentException("Invalid role: " + finalRoleName));

        // Check if there is already an active user with this email in a workspace
        if (userRepository.existsByEmail(request.getEmail().toLowerCase())) {
            User existingUser = userRepository.findByEmail(request.getEmail().toLowerCase()).get();
            if (existingUser.getWorkspace() != null) {
                throw new IllegalArgumentException("User with email " + request.getEmail() + " is already a member of a workspace.");
            }
        }

        String token = java.util.UUID.randomUUID().toString();

        Invitation invitation = new Invitation();
        invitation.setEmail(request.getEmail().toLowerCase());
        invitation.setRole(finalRoleName.replace("ROLE_", ""));
        invitation.setToken(token);
        invitation.setWorkspace(workspace);
        invitation.setStatus("PENDING");
        invitation.setExpiryDate(LocalDateTime.now().plusDays(7));
        invitation.setInvitedBy(inviter);

        invitationRepository.save(invitation);

        ActivityLog log = ActivityLog.builder()
                .workspace(workspace)
                .user(inviter)
                .action("MEMBER_INVITE")
                .description("Invited " + request.getEmail() + " as " + invitation.getRole())
                .build();
        activityLogRepository.save(log);

        return invitation;
    }

    @Transactional
    public User updateUserRole(Long userId, String roleName, String adminEmail) {
        User admin = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new UsernameNotFoundException("Admin not found"));

        boolean isAdmin = admin.getRoles().stream().anyMatch(r -> r.getName().equals("ROLE_ADMIN"));
        if (!isAdmin) {
            throw new IllegalStateException("Only administrators can change user roles");
        }

        User targetUser = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (targetUser.getId().equals(admin.getId())) {
            throw new IllegalArgumentException("You cannot change your own role");
        }

        if (targetUser.getWorkspace() == null || !targetUser.getWorkspace().getId().equals(admin.getWorkspace().getId())) {
            throw new IllegalArgumentException("User does not belong to your workspace");
        }

        Role newRole = roleRepository.findByName("ROLE_" + roleName.toUpperCase())
                .orElseThrow(() -> new IllegalArgumentException("Invalid role: " + roleName));

        targetUser.getRoles().clear();
        targetUser.getRoles().add(newRole);
        return userRepository.save(targetUser);
    }

    @Transactional
    public User updateUserStatus(Long userId, String status, String adminEmail) {
        User admin = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new UsernameNotFoundException("Admin not found"));

        boolean isAdmin = admin.getRoles().stream().anyMatch(r -> r.getName().equals("ROLE_ADMIN"));
        if (!isAdmin) {
            throw new IllegalStateException("Only administrators can suspend/reactivate accounts");
        }

        User targetUser = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (targetUser.getId().equals(admin.getId())) {
            throw new IllegalArgumentException("You cannot suspend your own account");
        }

        if (targetUser.getWorkspace() == null || !targetUser.getWorkspace().getId().equals(admin.getWorkspace().getId())) {
            throw new IllegalArgumentException("User does not belong to your workspace");
        }

        String targetStatus = status.toUpperCase();
        if (!"ACTIVE".equals(targetStatus) && !"SUSPENDED".equals(targetStatus)) {
            throw new IllegalArgumentException("Invalid status: " + status);
        }

        targetUser.setStatus(targetStatus);
        return userRepository.save(targetUser);
    }

    @Transactional
    public User editUserDetails(Long userId, UserProfileRequest request, String inviterEmail) {
        User actor = userRepository.findByEmail(inviterEmail)
                .orElseThrow(() -> new UsernameNotFoundException("Actor not found"));

        User targetUser = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (targetUser.getWorkspace() == null || !targetUser.getWorkspace().getId().equals(actor.getWorkspace().getId())) {
            throw new IllegalArgumentException("User does not belong to your workspace");
        }

        boolean actorIsAdmin = actor.getRoles().stream().anyMatch(r -> r.getName().equals("ROLE_ADMIN"));
        boolean actorIsManager = actor.getRoles().stream().anyMatch(r -> r.getName().equals("ROLE_MANAGER"));

        if (!actorIsAdmin && !actorIsManager) {
            throw new IllegalStateException("Unauthorized to edit team member details");
        }

        boolean targetIsAdmin = targetUser.getRoles().stream().anyMatch(r -> r.getName().equals("ROLE_ADMIN"));
        if (actorIsManager && targetIsAdmin) {
            throw new IllegalStateException("Managers are not authorized to edit Administrator accounts");
        }

        targetUser.setFullName(request.getFullName());
        targetUser.setPhone(request.getPhone());
        targetUser.setDesignation(request.getDesignation());
        targetUser.setBio(request.getBio());
        targetUser.setDepartment(request.getDepartment());
        if (request.getProfileImage() != null) {
            targetUser.setProfileImage(request.getProfileImage());
        }

        return userRepository.save(targetUser);
    }

    @Transactional
    public void deleteUser(Long userId, String adminEmail) {
        User admin = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new UsernameNotFoundException("Admin not found"));

        boolean isAdmin = admin.getRoles().stream().anyMatch(r -> r.getName().equals("ROLE_ADMIN"));
        if (!isAdmin) {
            throw new IllegalStateException("Only administrators can remove users");
        }

        User targetUser = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (targetUser.getId().equals(admin.getId())) {
            throw new IllegalArgumentException("You cannot remove yourself");
        }

        if (targetUser.getWorkspace() == null || !targetUser.getWorkspace().getId().equals(admin.getWorkspace().getId())) {
            throw new IllegalArgumentException("User does not belong to your workspace");
        }

        userRepository.delete(targetUser);
    }

    @Transactional
    public User resetUserPassword(Long userId, String newPassword, String adminEmail) {
        User admin = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new UsernameNotFoundException("Admin not found"));

        boolean isAdmin = admin.getRoles().stream().anyMatch(r -> r.getName().equals("ROLE_ADMIN"));
        if (!isAdmin) {
            throw new IllegalStateException("Only administrators can reset passwords");
        }

        User targetUser = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (targetUser.getWorkspace() == null || !targetUser.getWorkspace().getId().equals(admin.getWorkspace().getId())) {
            throw new IllegalArgumentException("User does not belong to your workspace");
        }

        targetUser.setPassword(passwordEncoder.encode(newPassword));
        return userRepository.save(targetUser);
    }

    @Transactional
    public Workspace transferWorkspaceOwnership(Long newOwnerId, String adminEmail) {
        User admin = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new UsernameNotFoundException("Admin not found"));

        boolean isAdmin = admin.getRoles().stream().anyMatch(r -> r.getName().equals("ROLE_ADMIN"));
        if (!isAdmin) {
            throw new IllegalStateException("Only the workspace administrator can transfer ownership");
        }

        User targetUser = userRepository.findById(newOwnerId)
                .orElseThrow(() -> new IllegalArgumentException("Target user not found"));

        if (targetUser.getWorkspace() == null || !targetUser.getWorkspace().getId().equals(admin.getWorkspace().getId())) {
            throw new IllegalArgumentException("Target user must belong to your workspace");
        }

        if ("SUSPENDED".equalsIgnoreCase(targetUser.getStatus())) {
            throw new IllegalArgumentException("Cannot transfer ownership to a suspended user");
        }

        Role adminRole = roleRepository.findByName("ROLE_ADMIN")
                .orElseThrow(() -> new IllegalStateException("ROLE_ADMIN not found"));
        Role managerRole = roleRepository.findByName("ROLE_MANAGER")
                .orElseThrow(() -> new IllegalStateException("ROLE_MANAGER not found"));

        // Strip admin's ADMIN role, assign MANAGER
        admin.getRoles().clear();
        admin.getRoles().add(managerRole);
        userRepository.save(admin);

        // Assign ADMIN role to target user
        targetUser.getRoles().clear();
        targetUser.getRoles().add(adminRole);
        userRepository.save(targetUser);

        return admin.getWorkspace();
    }
}
