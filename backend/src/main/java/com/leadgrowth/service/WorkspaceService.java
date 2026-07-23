package com.leadgrowth.service;

import com.leadgrowth.dto.AuthResponse;
import com.leadgrowth.dto.CreateWorkspaceRequest;
import com.leadgrowth.dto.JoinWorkspaceRequest;
import com.leadgrowth.dto.WorkspaceUpdateRequest;
import com.leadgrowth.entity.*;
import com.leadgrowth.repository.*;
import com.leadgrowth.security.JwtService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Random;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class WorkspaceService {

    private final WorkspaceRepository workspaceRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final JwtService jwtService;
    private final TaskRepository taskRepository;
    private final LeadNoteRepository leadNoteRepository;
    private final LeadRepository leadRepository;
    private final AdMetricsRepository adMetricsRepository;
    private final CampaignRepository campaignRepository;
    private final ReportRepository reportRepository;
    private final SyncLogRepository syncLogRepository;
    private final IntegrationRepository integrationRepository;
    private final ActivityLogRepository activityLogRepository;
    private final NotificationRepository notificationRepository;

    public WorkspaceService(
            WorkspaceRepository workspaceRepository,
            UserRepository userRepository,
            RoleRepository roleRepository,
            JwtService jwtService,
            TaskRepository taskRepository,
            LeadNoteRepository leadNoteRepository,
            LeadRepository leadRepository,
            AdMetricsRepository adMetricsRepository,
            CampaignRepository campaignRepository,
            ReportRepository reportRepository,
            SyncLogRepository syncLogRepository,
            IntegrationRepository integrationRepository,
            ActivityLogRepository activityLogRepository,
            NotificationRepository notificationRepository
    ) {
        this.workspaceRepository = workspaceRepository;
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.jwtService = jwtService;
        this.taskRepository = taskRepository;
        this.leadNoteRepository = leadNoteRepository;
        this.leadRepository = leadRepository;
        this.adMetricsRepository = adMetricsRepository;
        this.campaignRepository = campaignRepository;
        this.reportRepository = reportRepository;
        this.syncLogRepository = syncLogRepository;
        this.integrationRepository = integrationRepository;
        this.activityLogRepository = activityLogRepository;
        this.notificationRepository = notificationRepository;
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
                .availabilityStatus(user.getAvailabilityStatus())
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
                .availabilityStatus(user.getAvailabilityStatus())
                .build();
    }

    public Workspace getCurrentWorkspace(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        Workspace workspace = user.getWorkspace();
        if (workspace == null) {
            throw new IllegalStateException("User does not belong to a workspace");
        }
        return workspace;
    }

    @Transactional
    public Workspace updateWorkspace(WorkspaceUpdateRequest request, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        boolean isAdmin = user.getRoles().stream().anyMatch(r -> r.getName().equals("ROLE_ADMIN"));
        if (!isAdmin) {
            throw new IllegalStateException("Only administrators can update the workspace");
        }

        Workspace workspace = user.getWorkspace();
        if (workspace == null) {
            throw new IllegalStateException("User does not belong to a workspace");
        }

        // Check invite code uniqueness
        if (!workspace.getInviteCode().equalsIgnoreCase(request.getInviteCode())) {
            if (workspaceRepository.existsByInviteCode(request.getInviteCode())) {
                throw new IllegalArgumentException("Invite code is already in use");
            }
        }

        // Check slug uniqueness
        if (!workspace.getSlug().equalsIgnoreCase(request.getSlug())) {
            if (workspaceRepository.existsBySlug(request.getSlug())) {
                throw new IllegalArgumentException("URL slug is already in use");
            }
        }

        workspace.setName(request.getName());
        workspace.setCompanyName(request.getCompanyName());
        workspace.setIndustry(request.getIndustry());
        workspace.setTeamSize(request.getTeamSize());
        workspace.setWebsite(request.getWebsite());
        workspace.setTimezone(request.getTimezone());
        workspace.setInviteCode(request.getInviteCode());
        workspace.setSlug(request.getSlug());

        return workspaceRepository.save(workspace);
    }

    @Transactional
    public void deleteWorkspace(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        boolean isAdmin = user.getRoles().stream().anyMatch(r -> r.getName().equals("ROLE_ADMIN"));
        if (!isAdmin) {
            throw new IllegalStateException("Only administrators can delete the workspace");
        }

        Workspace workspace = user.getWorkspace();
        if (workspace == null) {
            throw new IllegalStateException("User does not belong to a workspace");
        }

        Long workspaceId = workspace.getId();

        // 1. Delete all tasks in the workspace
        taskRepository.deleteByWorkspaceId(workspaceId);

        // 2. Delete all lead notes and leads in the workspace
        leadNoteRepository.deleteByWorkspaceId(workspaceId);
        leadRepository.deleteByWorkspaceId(workspaceId);

        // 3. Delete all ad metrics and campaigns in the workspace
        adMetricsRepository.deleteByWorkspaceId(workspaceId);
        campaignRepository.deleteByWorkspaceId(workspaceId);

        // 4. Delete reports, sync logs, integrations, activity logs in the workspace
        reportRepository.deleteByWorkspaceId(workspaceId);
        syncLogRepository.deleteByWorkspaceId(workspaceId);
        integrationRepository.deleteByWorkspaceId(workspaceId);
        activityLogRepository.deleteByWorkspaceId(workspaceId);

        // 5. Update all users in the workspace: set workspace to null, clear roles, delete notifications
        List<User> members = userRepository.findByWorkspaceId(workspaceId);
        for (User member : members) {
            notificationRepository.deleteByUserId(member.getId());
            member.setWorkspace(null);
            member.getRoles().clear();
            userRepository.save(member);
        }

        // 6. Delete the workspace itself
        workspaceRepository.delete(workspace);
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
