package com.leadgrowth.scheduler;

import com.leadgrowth.entity.Workspace;
import com.leadgrowth.repository.WorkspaceRepository;
import com.leadgrowth.service.SyncService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class SyncScheduler {

    private static final Logger logger = LoggerFactory.getLogger(SyncScheduler.class);
    private final WorkspaceRepository workspaceRepository;
    private final SyncService syncService;

    public SyncScheduler(WorkspaceRepository workspaceRepository, SyncService syncService) {
        this.workspaceRepository = workspaceRepository;
        this.syncService = syncService;
    }

    // Cron expression: runs every hour on the hour
    @Scheduled(cron = "0 0 * * * *")
    public void executeHourlySync() {
        logger.info("Starting hourly automated data sync for Meta & Google Ads...");
        List<Workspace> workspaces = workspaceRepository.findAll();
        for (Workspace workspace : workspaces) {
            try {
                syncService.syncWorkspace(workspace.getId(), "Meta");
                syncService.syncWorkspace(workspace.getId(), "Google");
            } catch (Exception e) {
                logger.error("Failed to sync workspace ID: " + workspace.getId(), e);
            }
        }
        logger.info("Hourly automated data sync completed.");
    }
}
