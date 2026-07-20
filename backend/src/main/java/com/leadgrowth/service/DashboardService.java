package com.leadgrowth.service;

import com.leadgrowth.dto.*;
import com.leadgrowth.entity.*;
import com.leadgrowth.repository.*;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class DashboardService {

    private final UserRepository userRepository;
    private final CampaignRepository campaignRepository;
    private final LeadRepository leadRepository;
    private final TaskRepository taskRepository;
    private final AdMetricsRepository adMetricsRepository;
    private final ActivityLogRepository activityLogRepository;
    private final WorkspaceRepository workspaceRepository;
    private final ReportRepository reportRepository;

    public DashboardService(
            UserRepository userRepository,
            CampaignRepository campaignRepository,
            LeadRepository leadRepository,
            TaskRepository taskRepository,
            AdMetricsRepository adMetricsRepository,
            ActivityLogRepository activityLogRepository,
            WorkspaceRepository workspaceRepository,
            ReportRepository reportRepository
    ) {
        this.userRepository = userRepository;
        this.campaignRepository = campaignRepository;
        this.leadRepository = leadRepository;
        this.taskRepository = taskRepository;
        this.adMetricsRepository = adMetricsRepository;
        this.activityLogRepository = activityLogRepository;
        this.workspaceRepository = workspaceRepository;
        this.reportRepository = reportRepository;
    }

    public DashboardKpis getDashboardData(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        if (user.getWorkspace() == null) {
            throw new IllegalStateException("User is not associated with any workspace");
        }

        Long workspaceId = user.getWorkspace().getId();
        boolean isAdmin = user.getRoles().stream().anyMatch(r -> r.getName().equals("ROLE_ADMIN"));
        boolean isManager = user.getRoles().stream().anyMatch(r -> r.getName().equals("ROLE_MANAGER"));
        boolean isUser = user.getRoles().stream().anyMatch(r -> r.getName().equals("ROLE_USER")) && !isAdmin && !isManager;

        // Fetch Base Entities
        List<Campaign> campaigns = campaignRepository.findByWorkspaceId(workspaceId);
        List<Lead> allLeads = leadRepository.findByWorkspaceIdOrderByCreatedAtDesc(workspaceId);
        List<Task> allTasks = taskRepository.findByWorkspaceIdOrderByCreatedAtDesc(workspaceId);
        List<AdMetrics> metrics = adMetricsRepository.findByWorkspaceIdOrderByDateDesc(workspaceId);
        List<ActivityLog> logs = activityLogRepository.findByWorkspaceIdOrderByCreatedAtDesc(workspaceId);

        // Core Aggregate Metrics
        long totalLeads = isUser ? allLeads.stream().filter(l -> l.getAssignedTo() != null && l.getAssignedTo().getId().equals(user.getId())).count() : allLeads.size();
        
        long totalClicks = 0;
        long totalImpressions = 0;
        long totalConversions = 0;
        BigDecimal totalSpend = BigDecimal.ZERO;
        BigDecimal totalRevenue = BigDecimal.ZERO;

        for (Campaign campaign : campaigns) {
            totalClicks += campaign.getClicks();
            totalImpressions += campaign.getImpressions();
            totalConversions += campaign.getConversions();
            totalSpend = totalSpend.add(campaign.getSpend());
            totalRevenue = totalRevenue.add(campaign.getRevenue());
        }

        // Ratios
        double roas = totalSpend.compareTo(BigDecimal.ZERO) > 0 
                ? totalRevenue.divide(totalSpend, 2, RoundingMode.HALF_UP).doubleValue() 
                : 0.0;
        double ctr = totalImpressions > 0 
                ? ((double) totalClicks / totalImpressions) * 100 
                : 0.0;
        double cpc = totalClicks > 0 
                ? totalSpend.divide(BigDecimal.valueOf(totalClicks), 2, RoundingMode.HALF_UP).doubleValue() 
                : 0.0;

        // Recent Leads Dto (limit to 10)
        List<LeadDto> recentLeads = allLeads.stream()
                .filter(l -> !isUser || (l.getAssignedTo() != null && l.getAssignedTo().getId().equals(user.getId())))
                .limit(10)
                .map(this::convertToLeadDto)
                .collect(Collectors.toList());

        // Platform Leads Share
        Map<String, Long> leadsByPlatform = allLeads.stream()
                .filter(l -> l.getSourcePlatform() != null)
                .collect(Collectors.groupingBy(Lead::getSourcePlatform, Collectors.counting()));
        List<PlatformShare> platformLeadsShare = leadsByPlatform.entrySet().stream()
                .map(entry -> PlatformShare.builder()
                        .platform(entry.getKey())
                        .count(entry.getValue())
                        .build())
                .collect(Collectors.toList());

        // Platform Revenue Share
        Map<String, BigDecimal> revByPlatform = campaigns.stream()
                .filter(c -> c.getPlatform() != null)
                .collect(Collectors.groupingBy(Campaign::getPlatform,
                        Collectors.reducing(BigDecimal.ZERO, Campaign::getRevenue, BigDecimal::add)));
        List<PlatformShare> platformRevenueShare = revByPlatform.entrySet().stream()
                .map(entry -> PlatformShare.builder()
                        .platform(entry.getKey())
                        .value(entry.getValue())
                        .build())
                .collect(Collectors.toList());

        // Weekly Trends Data (Recharts)
        Map<LocalDate, List<AdMetrics>> metricsByDate = metrics.stream()
                .collect(Collectors.groupingBy(AdMetrics::getDate));
        
        List<TrendDataPoint> trendList = new ArrayList<>();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMM dd");
        
        // Return trends for last 7 days
        for (int i = 6; i >= 0; i--) {
            LocalDate date = LocalDate.now().minusDays(i);
            List<AdMetrics> dayMetrics = metricsByDate.getOrDefault(date, Collections.emptyList());
            
            long dayClicks = dayMetrics.stream().mapToLong(AdMetrics::getClicks).sum();
            long dayImpressions = dayMetrics.stream().mapToLong(AdMetrics::getImpressions).sum();
            long dayConversions = dayMetrics.stream().mapToLong(AdMetrics::getConversions).sum();
            BigDecimal daySpend = dayMetrics.stream().map(AdMetrics::getSpend).reduce(BigDecimal.ZERO, BigDecimal::add);
            
            // Clicks/Impressions count from simulated values
            long dayLeads = allLeads.stream()
                    .filter(l -> l.getCreatedAt().toLocalDate().equals(date))
                    .count();

            trendList.add(TrendDataPoint.builder()
                    .date(date.format(formatter))
                    .clicks(dayClicks)
                    .impressions(dayImpressions)
                    .conversions(dayConversions)
                    .leads(dayLeads)
                    .spend(daySpend)
                    .revenue(daySpend.multiply(BigDecimal.valueOf(1.8))) // Mocking revenue trends
                    .build());
        }

        // Funnel data counts
        Map<String, Long> statusCounts = allLeads.stream()
                .filter(l -> l.getStatus() != null)
                .collect(Collectors.groupingBy(Lead::getStatus, Collectors.counting()));
        Map<String, Long> funnel = new LinkedHashMap<>();
        funnel.put("New", statusCounts.getOrDefault("New", 0L));
        funnel.put("Contacted", statusCounts.getOrDefault("Contacted", 0L));
        funnel.put("Qualified", statusCounts.getOrDefault("Qualified", 0L));
        funnel.put("Converted", statusCounts.getOrDefault("Converted", 0L));
        funnel.put("Rejected", statusCounts.getOrDefault("Rejected", 0L));

        // Team Activities
        List<TeamActivityDto> teamActivities = logs.stream()
                .limit(8)
                .map(l -> TeamActivityDto.builder()
                        .id(l.getId())
                        .userEmail(l.getUser() != null ? l.getUser().getEmail() : "System")
                        .userName(l.getUser() != null ? l.getUser().getFullName() : "System")
                        .action(l.getAction())
                        .description(l.getDescription())
                        .timestamp(l.getCreatedAt().toString())
                        .build())
                .collect(Collectors.toList());

        // Workspace Statistics (Admin Only)
        List<WorkspaceStatDto> workspaceStats = new ArrayList<>();
        if (isAdmin) {
            List<Workspace> workspaces = workspaceRepository.findAll();
            for (Workspace ws : workspaces) {
                long wsLeads = leadRepository.countByWorkspaceId(ws.getId());
                long wsCampaigns = campaignRepository.findByWorkspaceId(ws.getId()).size();
                workspaceStats.add(WorkspaceStatDto.builder()
                        .name(ws.getName())
                        .teamSize(ws.getTeamSize() != null ? ws.getTeamSize() : 1)
                        .activeCampaigns((int) wsCampaigns)
                        .totalLeads(wsLeads)
                        .industry(ws.getIndustry())
                        .build());
            }
        }

        return DashboardKpis.builder()
                .totalLeads(totalLeads)
                .totalClicks(totalClicks)
                .totalImpressions(totalImpressions)
                .totalConversions(totalConversions)
                .totalSpend(totalSpend)
                .totalRevenue(totalRevenue)
                .roas(roas)
                .ctr(ctr)
                .cpc(cpc)
                .recentLeads(recentLeads)
                .platformLeadsShare(platformLeadsShare)
                .platformRevenueShare(platformRevenueShare)
                .trends(trendList)
                .funnel(funnel)
                .teamActivities(teamActivities)
                .workspaceStats(workspaceStats)
                .build();
    }

    private LeadDto convertToLeadDto(Lead lead) {
        return LeadDto.builder()
                .id(lead.getId())
                .name(lead.getName())
                .email(lead.getEmail())
                .phone(lead.getPhone())
                .sourcePlatform(lead.getSourcePlatform())
                .campaignName(lead.getCampaignName())
                .campaignId(lead.getCampaign() != null ? lead.getCampaign().getId() : null)
                .status(lead.getStatus())
                .assignedToId(lead.getAssignedTo() != null ? lead.getAssignedTo().getId() : null)
                .assignedToName(lead.getAssignedTo() != null ? lead.getAssignedTo().getFullName() : "Unassigned")
                .createdAt(lead.getCreatedAt())
                .build();
    }

    public List<SearchResultDto> searchGlobal(String query, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        if (user.getWorkspace() == null) {
            throw new IllegalStateException("User does not belong to a workspace");
        }

        Long workspaceId = user.getWorkspace().getId();
        String q = query.toLowerCase().trim();
        List<SearchResultDto> results = new ArrayList<>();

        if (q.isEmpty()) {
            return results;
        }

        // 1. Search campaigns (limit 5)
        List<Campaign> campaigns = campaignRepository.findByWorkspaceId(workspaceId);
        campaigns.stream()
                .filter(c -> c.getName().toLowerCase().contains(q) || (c.getPlatform() != null && c.getPlatform().toLowerCase().contains(q)))
                .limit(5)
                .forEach(c -> results.add(new SearchResultDto(c.getName(), "CAMPAIGN", "Platform: " + c.getPlatform() + " | Status: " + c.getStatus(), "/campaigns")));

        // 2. Search leads (limit 5)
        List<Lead> leads = leadRepository.findByWorkspaceIdOrderByCreatedAtDesc(workspaceId);
        leads.stream()
                .filter(l -> l.getName().toLowerCase().contains(q) || (l.getEmail() != null && l.getEmail().toLowerCase().contains(q)))
                .limit(5)
                .forEach(l -> results.add(new SearchResultDto(l.getName(), "LEAD", "Email: " + l.getEmail() + " | Status: " + l.getStatus(), "/leads")));

        // 3. Search tasks (limit 5)
        List<Task> tasks = taskRepository.findByWorkspaceIdOrderByCreatedAtDesc(workspaceId);
        tasks.stream()
                .filter(t -> t.getTitle().toLowerCase().contains(q) || (t.getDescription() != null && t.getDescription().toLowerCase().contains(q)))
                .limit(5)
                .forEach(t -> results.add(new SearchResultDto(t.getTitle(), "TASK", "Priority: " + t.getPriority() + " | Status: " + t.getStatus(), "/tasks")));

        // 4. Search users (limit 5)
        List<User> users = userRepository.findByWorkspaceId(workspaceId);
        users.stream()
                .filter(u -> u.getFullName().toLowerCase().contains(q) || u.getEmail().toLowerCase().contains(q))
                .limit(5)
                .forEach(u -> results.add(new SearchResultDto(u.getFullName(), "USER", "Email: " + u.getEmail() + " | Designation: " + u.getDesignation(), "/users")));

        // 5. Search reports (limit 5)
        List<Report> reports = reportRepository.findByWorkspaceIdOrderByCreatedAtDesc(workspaceId);
        reports.stream()
                .filter(r -> r.getType().toLowerCase().contains(q) || (r.getFilePath() != null && r.getFilePath().toLowerCase().contains(q)))
                .limit(5)
                .forEach(r -> results.add(new SearchResultDto(r.getType() + " Report", "REPORT", "Generated by: " + (r.getGeneratedBy() != null ? r.getGeneratedBy().getFullName() : "System"), "/reports")));

        return results;
    }
}
