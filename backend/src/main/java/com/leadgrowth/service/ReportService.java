package com.leadgrowth.service;

import com.leadgrowth.dto.DailyReportSubmitRequest;
import com.leadgrowth.dto.ReportDto;
import com.leadgrowth.dto.ReportReviewRequest;
import com.leadgrowth.entity.Notification;
import com.leadgrowth.entity.Report;
import com.leadgrowth.entity.User;
import com.leadgrowth.repository.FollowupRepository;
import com.leadgrowth.repository.LeadRepository;
import com.leadgrowth.repository.NotificationRepository;
import com.leadgrowth.repository.ReportRepository;
import com.leadgrowth.repository.ReportHistoryRepository;
import com.leadgrowth.repository.UserRepository;
import com.leadgrowth.websocket.WebSocketManager;
import org.springframework.context.annotation.Lazy;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ReportService {

    private final ReportRepository reportRepository;
    private final UserRepository userRepository;
    private final LeadRepository leadRepository;
    private final FollowupRepository followupRepository;
    private final NotificationRepository notificationRepository;
    private final ReportHistoryRepository reportHistoryRepository;
    private final WebSocketManager webSocketManager;

    public ReportService(
            ReportRepository reportRepository,
            UserRepository userRepository,
            LeadRepository leadRepository,
            FollowupRepository followupRepository,
            NotificationRepository notificationRepository,
            ReportHistoryRepository reportHistoryRepository,
            @Lazy WebSocketManager webSocketManager
    ) {
        this.reportRepository = reportRepository;
        this.userRepository = userRepository;
        this.leadRepository = leadRepository;
        this.followupRepository = followupRepository;
        this.notificationRepository = notificationRepository;
        this.reportHistoryRepository = reportHistoryRepository;
        this.webSocketManager = webSocketManager;
    }

    @Transactional
    public ReportDto submitDailyReport(DailyReportSubmitRequest request, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + userEmail));

        if (user.getWorkspace() == null) {
            throw new IllegalStateException("User does not belong to a workspace");
        }

        long assignedLeads = leadRepository.findByWorkspaceIdAndAssignedToIdOrderByCreatedAtDesc(user.getWorkspace().getId(), user.getId()).size();
        long convertedLeads = leadRepository.findByWorkspaceIdAndAssignedToIdOrderByCreatedAtDesc(user.getWorkspace().getId(), user.getId())
                .stream().filter(l -> "Converted".equalsIgnoreCase(l.getStatus())).count();

        Report report = new Report();
        report.setWorkspace(user.getWorkspace());
        report.setType("Daily");
        report.setGeneratedBy(user);
        report.setStatus("PENDING");
        report.setSubmittedAt(LocalDateTime.now());

        report.setCompletedLeads(request.getCompletedLeads() != null ? request.getCompletedLeads() : (int) convertedLeads);
        report.setPendingLeads(request.getPendingLeads() != null ? request.getPendingLeads() : (int) (assignedLeads - convertedLeads));
        report.setCompletedCalls(request.getCompletedCalls() != null ? request.getCompletedCalls() : 8);
        report.setFollowupsCount(request.getFollowupsCount() != null ? request.getFollowupsCount() : 5);

        report.setRemarks(request.getRemarks());
        report.setProblemsFaced(request.getProblemsFaced());
        report.setNextDayPlan(request.getNextDayPlan());

        Report saved = reportRepository.save(report);

        // Notify workspace managers
        List<User> managers = userRepository.findByWorkspaceId(user.getWorkspace().getId()).stream()
                .filter(u -> u.getRoles().stream().anyMatch(r -> r.getName().equals("ROLE_MANAGER") || r.getName().equals("ROLE_ADMIN")))
                .collect(Collectors.toList());

        for (User manager : managers) {
            Notification notification = Notification.builder()
                    .user(manager)
                    .title("Daily Report Submitted")
                    .message(user.getFullName() + " has submitted their Daily Sales Report for review.")
                    .isRead(false)
                    .build();
            notificationRepository.save(notification);

            Map<String, Object> wsMsg = new HashMap<>();
            wsMsg.put("id", notification.getId());
            wsMsg.put("title", notification.getTitle());
            wsMsg.put("message", notification.getMessage());
            wsMsg.put("createdAt", LocalDateTime.now().toString());

            webSocketManager.broadcastNotification(manager.getId(), wsMsg);
        }

        return convertToDto(saved);
    }

    public List<ReportDto> getUserReports(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        return reportRepository.findByGeneratedByIdOrderBySubmittedAtDesc(user.getId())
                .stream().map(this::convertToDto).collect(Collectors.toList());
    }

    public List<ReportDto> getPendingWorkspaceReports(String managerEmail) {
        User manager = userRepository.findByEmail(managerEmail)
                .orElseThrow(() -> new UsernameNotFoundException("Manager not found"));
        if (manager.getWorkspace() == null) {
            throw new IllegalStateException("User has no workspace");
        }
        return reportRepository.findByWorkspaceIdOrderByCreatedAtDesc(manager.getWorkspace().getId())
                .stream().map(this::convertToDto).collect(Collectors.toList());
    }

    @Transactional
    public ReportDto reviewReport(Long reportId, ReportReviewRequest request, String managerEmail) {
        User manager = userRepository.findByEmail(managerEmail)
                .orElseThrow(() -> new UsernameNotFoundException("Manager not found"));
        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new IllegalArgumentException("Report not found: " + reportId));

        report.setStatus(request.getStatus().toUpperCase());
        report.setManagerComment(request.getManagerComment());
        report.setReviewedBy(manager);
        report.setReviewedAt(LocalDateTime.now());

        Report updated = reportRepository.save(report);

        // Notify report submitter
        User submitter = report.getGeneratedBy();
        if (submitter != null) {
            String title = "Report " + ("APPROVED".equals(updated.getStatus()) ? "Approved ✅" : "Needs Revision ❌");
            String message = "Your Daily Report submitted on " + updated.getSubmittedAt().toLocalDate() + " was " + updated.getStatus().toLowerCase() + " by " + manager.getFullName() + ".";
            if (request.getManagerComment() != null && !request.getManagerComment().isBlank()) {
                message += " Comment: " + request.getManagerComment();
            }

            Notification notification = Notification.builder()
                    .user(submitter)
                    .title(title)
                    .message(message)
                    .isRead(false)
                    .build();
            notificationRepository.save(notification);

            Map<String, Object> wsMsg = new HashMap<>();
            wsMsg.put("id", notification.getId());
            wsMsg.put("title", notification.getTitle());
            wsMsg.put("message", notification.getMessage());
            wsMsg.put("createdAt", LocalDateTime.now().toString());

            webSocketManager.broadcastNotification(submitter.getId(), wsMsg);
        }

        return convertToDto(updated);
    }

    @Transactional
    public void logReportExport(com.leadgrowth.entity.Workspace workspace, User user, String period, String startDate, String endDate, String format, String category, String fileName, String summaryJson) {
        com.leadgrowth.entity.ReportHistory history = com.leadgrowth.entity.ReportHistory.builder()
                .workspace(workspace)
                .generatedBy(user)
                .periodFilter(period != null ? period : "all")
                .startDate(startDate)
                .endDate(endDate)
                .exportFormat(format)
                .reportCategory(category)
                .fileName(fileName)
                .kpiSummaryJson(summaryJson)
                .build();
        reportHistoryRepository.save(history);
    }

    private ReportDto convertToDto(Report report) {
        ReportDto dto = new ReportDto();
        dto.setId(report.getId());
        dto.setWorkspaceId(report.getWorkspace() != null ? report.getWorkspace().getId() : null);
        dto.setType(report.getType());
        dto.setGeneratedById(report.getGeneratedBy() != null ? report.getGeneratedBy().getId() : null);
        dto.setGeneratedByName(report.getGeneratedBy() != null ? report.getGeneratedBy().getFullName() : "System");
        dto.setStatus(report.getStatus() != null ? report.getStatus() : "PENDING");
        dto.setCompletedLeads(report.getCompletedLeads());
        dto.setPendingLeads(report.getPendingLeads());
        dto.setCompletedCalls(report.getCompletedCalls());
        dto.setFollowupsCount(report.getFollowupsCount());
        dto.setRemarks(report.getRemarks());
        dto.setProblemsFaced(report.getProblemsFaced());
        dto.setNextDayPlan(report.getNextDayPlan());
        dto.setManagerComment(report.getManagerComment());
        dto.setReviewedById(report.getReviewedBy() != null ? report.getReviewedBy().getId() : null);
        dto.setReviewedByName(report.getReviewedBy() != null ? report.getReviewedBy().getFullName() : null);
        dto.setReviewedAt(report.getReviewedAt());
        dto.setSubmittedAt(report.getSubmittedAt());
        dto.setCreatedAt(report.getCreatedAt());
        return dto;
    }
}
