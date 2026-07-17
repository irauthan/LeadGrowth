package com.leadgrowth.controller;

import com.leadgrowth.entity.Integration;
import com.leadgrowth.entity.SyncLog;
import com.leadgrowth.entity.User;
import com.leadgrowth.repository.IntegrationRepository;
import com.leadgrowth.repository.SyncLogRepository;
import com.leadgrowth.repository.UserRepository;
import com.leadgrowth.service.SyncService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/integrations")
public class IntegrationController {

    private final IntegrationRepository integrationRepository;
    private final SyncLogRepository syncLogRepository;
    private final UserRepository userRepository;
    private final SyncService syncService;

    public IntegrationController(
            IntegrationRepository integrationRepository,
            SyncLogRepository syncLogRepository,
            UserRepository userRepository,
            SyncService syncService
    ) {
        this.integrationRepository = integrationRepository;
        this.syncLogRepository = syncLogRepository;
        this.userRepository = userRepository;
        this.syncService = syncService;
    }

    @GetMapping
    public ResponseEntity<List<Integration>> getIntegrations() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        return ResponseEntity.ok(integrationRepository.findByWorkspaceId(user.getWorkspace().getId()));
    }

    @PostMapping("/connect")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Integration> connectIntegration(
            @RequestParam String platform,
            @RequestParam String apiKey
    ) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        Integration integration = integrationRepository.findByWorkspaceIdAndPlatformIgnoreCase(user.getWorkspace().getId(), platform)
                .orElseGet(() -> Integration.builder()
                        .workspace(user.getWorkspace())
                        .platform(platform)
                        .build());

        integration.setApiKey(apiKey);
        integration.setStatus("Connected");
        return ResponseEntity.ok(integrationRepository.save(integration));
    }

    @PostMapping("/sync")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> triggerManualSync(@RequestParam String platform) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        syncService.syncWorkspace(user.getWorkspace().getId(), platform);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/sync-logs")
    public ResponseEntity<List<SyncLog>> getSyncLogs() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        return ResponseEntity.ok(syncLogRepository.findByWorkspaceIdOrderByCreatedAtDesc(user.getWorkspace().getId()));
    }
}
