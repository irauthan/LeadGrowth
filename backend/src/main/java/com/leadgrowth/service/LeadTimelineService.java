package com.leadgrowth.service;

import com.leadgrowth.entity.*;
import com.leadgrowth.repository.*;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class LeadTimelineService {

    private final LeadActivityRepository leadActivityRepository;
    private final LeadHistoryRepository leadHistoryRepository;
    private final SalesActivityLogRepository salesActivityLogRepository;
    private final CallHistoryRepository callHistoryRepository;
    private final FollowupRepository followupRepository;
    private final LeadNoteRepository leadNoteRepository;
    private final LeadRepository leadRepository;
    private final UserRepository userRepository;

    public LeadTimelineService(
            LeadActivityRepository leadActivityRepository,
            LeadHistoryRepository leadHistoryRepository,
            SalesActivityLogRepository salesActivityLogRepository,
            CallHistoryRepository callHistoryRepository,
            FollowupRepository followupRepository,
            LeadNoteRepository leadNoteRepository,
            LeadRepository leadRepository,
            UserRepository userRepository
    ) {
        this.leadActivityRepository = leadActivityRepository;
        this.leadHistoryRepository = leadHistoryRepository;
        this.salesActivityLogRepository = salesActivityLogRepository;
        this.callHistoryRepository = callHistoryRepository;
        this.followupRepository = followupRepository;
        this.leadNoteRepository = leadNoteRepository;
        this.leadRepository = leadRepository;
        this.userRepository = userRepository;
    }

    public void logActivity(Lead lead, User actor, String activityType, String title, String description) {
        if (lead == null || lead.getWorkspace() == null) return;
        LeadActivity activity = new LeadActivity(lead, actor, lead.getWorkspace(), activityType, title, description);
        leadActivityRepository.save(activity);
    }

    public List<Map<String, Object>> getLeadTimeline(Long leadId) {
        List<Map<String, Object>> timeline = new ArrayList<>();
        Lead lead = leadRepository.findById(leadId).orElse(null);
        String currentStage = lead != null ? (lead.getStatus() != null ? lead.getStatus() : "New Lead") : "New Lead";
        String leadName = lead != null ? lead.getName() : "";

        DateTimeFormatter dateFmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        DateTimeFormatter timeFmt = DateTimeFormatter.ofPattern("HH:mm:ss");

        // 1. Fetch LeadActivity
        List<LeadActivity> activities = leadActivityRepository.findByLeadIdOrderByCreatedAtDesc(leadId);
        for (LeadActivity a : activities) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", "act_" + a.getId());
            map.put("leadId", leadId);
            map.put("leadName", leadName);
            map.put("performedByName", a.getActor() != null ? a.getActor().getFullName() : "System");
            map.put("action", a.getTitle() != null ? a.getTitle() : a.getActivityType());
            map.put("activityType", a.getActivityType() != null ? a.getActivityType() : "SYSTEM");
            map.put("description", a.getDescription() != null ? a.getDescription() : "");
            map.put("remarks", a.getDescription() != null ? a.getDescription() : "");
            map.put("leadStage", currentStage);
            map.put("duration", "");
            if (a.getCreatedAt() != null) {
                map.put("timestamp", a.getCreatedAt().toString());
                map.put("date", a.getCreatedAt().format(dateFmt));
                map.put("time", a.getCreatedAt().format(timeFmt));
            } else {
                map.put("timestamp", "");
                map.put("date", "");
                map.put("time", "");
            }
            timeline.add(map);
        }

        // 2. Fetch LeadHistory
        List<LeadHistory> histories = leadHistoryRepository.findByLeadIdOrderByTimestampDesc(leadId);
        for (LeadHistory h : histories) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", "hist_" + h.getId());
            map.put("leadId", leadId);
            map.put("leadName", leadName);
            map.put("performedByName", h.getPerformedBy() != null ? h.getPerformedBy().getFullName() : "System");
            map.put("action", h.getAction());
            map.put("activityType", "STAGE_CHANGE");
            map.put("description", h.getDescription() != null ? h.getDescription() : "");
            map.put("remarks", h.getDescription() != null ? h.getDescription() : "");
            map.put("leadStage", currentStage);
            map.put("duration", "");
            if (h.getTimestamp() != null) {
                map.put("timestamp", h.getTimestamp().toString());
                map.put("date", h.getTimestamp().format(dateFmt));
                map.put("time", h.getTimestamp().format(timeFmt));
            } else {
                map.put("timestamp", "");
                map.put("date", "");
                map.put("time", "");
            }
            timeline.add(map);
        }

        // 3. Fetch SalesActivityLog
        List<SalesActivityLog> salesLogs = salesActivityLogRepository.findByLeadIdOrderByCreatedAtDesc(leadId);
        for (SalesActivityLog s : salesLogs) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", "sales_" + s.getId());
            map.put("leadId", leadId);
            map.put("leadName", leadName);
            map.put("performedByName", s.getLoggedBy() != null ? s.getLoggedBy().getFullName() : "Sales Exec");
            map.put("action", s.getOutcome() != null ? "Activity: " + s.getOutcome() : "Sales Activity Logged");
            map.put("activityType", s.getCommunicationType() != null ? s.getCommunicationType() : "CALL");
            map.put("description", s.getRemarks() != null ? s.getRemarks() : "");
            map.put("remarks", s.getRemarks() != null ? s.getRemarks() : "");
            map.put("leadStage", currentStage);
            map.put("duration", s.getDuration() != null ? s.getDuration() : "");
            if (s.getCreatedAt() != null) {
                map.put("timestamp", s.getCreatedAt().toString());
                map.put("date", s.getCreatedAt().format(dateFmt));
                map.put("time", s.getCreatedAt().format(timeFmt));
            } else {
                map.put("timestamp", "");
                map.put("date", "");
                map.put("time", "");
            }
            timeline.add(map);
        }

        // 4. Fetch CallHistory
        List<CallHistory> callLogs = callHistoryRepository.findByLeadIdOrderByStartTimeDesc(leadId);
        for (CallHistory c : callLogs) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", "call_" + c.getId());
            map.put("leadId", leadId);
            map.put("leadName", leadName);
            map.put("performedByName", c.getUser() != null ? c.getUser().getFullName() : "Agent");
            map.put("action", "Call (" + (c.getStatus() != null ? c.getStatus() : "COMPLETED") + ")");
            map.put("activityType", "CALL");
            map.put("description", c.getNotes() != null ? c.getNotes() : "");
            map.put("remarks", c.getNotes() != null ? c.getNotes() : "");
            map.put("leadStage", currentStage);
            map.put("duration", c.getFormattedDuration() != null ? c.getFormattedDuration() : (c.getDurationSeconds() != null ? c.getDurationSeconds() + "s" : ""));
            if (c.getStartTime() != null) {
                map.put("timestamp", c.getStartTime().toString());
                map.put("date", c.getStartTime().format(dateFmt));
                map.put("time", c.getStartTime().format(timeFmt));
            } else {
                map.put("timestamp", "");
                map.put("date", "");
                map.put("time", "");
            }
            timeline.add(map);
        }

        // 5. Fetch LeadNotes
        List<LeadNote> notes = leadNoteRepository.findByLeadIdOrderByCreatedAtDesc(leadId);
        for (LeadNote n : notes) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", "note_" + n.getId());
            map.put("leadId", leadId);
            map.put("leadName", leadName);
            map.put("performedByName", n.getUser() != null ? n.getUser().getFullName() : "User");
            map.put("action", "Note Added");
            map.put("activityType", "NOTE");
            map.put("description", n.getNote() != null ? n.getNote() : "");
            map.put("remarks", n.getNote() != null ? n.getNote() : "");
            map.put("leadStage", currentStage);
            map.put("duration", "");
            if (n.getCreatedAt() != null) {
                map.put("timestamp", n.getCreatedAt().toString());
                map.put("date", n.getCreatedAt().format(dateFmt));
                map.put("time", n.getCreatedAt().format(timeFmt));
            } else {
                map.put("timestamp", "");
                map.put("date", "");
                map.put("time", "");
            }
            timeline.add(map);
        }

        // Sort newest first
        timeline.sort((a, b) -> {
            String tsA = (String) a.getOrDefault("timestamp", "");
            String tsB = (String) b.getOrDefault("timestamp", "");
            return tsB.compareTo(tsA);
        });

        return timeline;
    }

    public Map<String, Object> addNote(Long leadId, String userEmail, String title, String description) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Lead lead = leadRepository.findById(leadId)
                .orElseThrow(() -> new RuntimeException("Lead not found"));

        LeadActivity activity = new LeadActivity(lead, user, user.getWorkspace(), "NOTE", title, description);
        LeadActivity saved = leadActivityRepository.save(activity);

        Map<String, Object> map = new HashMap<>();
        map.put("id", saved.getId());
        map.put("leadId", saved.getLead().getId());
        map.put("leadName", saved.getLead().getName());
        map.put("performedByName", saved.getActor() != null ? saved.getActor().getFullName() : "System");
        map.put("action", saved.getTitle());
        map.put("description", saved.getDescription());
        map.put("timestamp", saved.getCreatedAt().toString());
        return map;
    }
}

