package com.leadgrowth.service;

import com.leadgrowth.entity.Lead;
import com.leadgrowth.entity.LeadActivity;
import com.leadgrowth.entity.LeadHistory;
import com.leadgrowth.entity.User;
import com.leadgrowth.repository.LeadActivityRepository;
import com.leadgrowth.repository.LeadHistoryRepository;
import com.leadgrowth.repository.LeadRepository;
import com.leadgrowth.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class LeadTimelineService {

    private final LeadActivityRepository leadActivityRepository;
    private final LeadHistoryRepository leadHistoryRepository;
    private final LeadRepository leadRepository;
    private final UserRepository userRepository;

    public LeadTimelineService(
            LeadActivityRepository leadActivityRepository,
            LeadHistoryRepository leadHistoryRepository,
            LeadRepository leadRepository,
            UserRepository userRepository
    ) {
        this.leadActivityRepository = leadActivityRepository;
        this.leadHistoryRepository = leadHistoryRepository;
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

        // 1. Fetch LeadActivity
        List<LeadActivity> activities = leadActivityRepository.findByLeadIdOrderByCreatedAtDesc(leadId);
        for (LeadActivity a : activities) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", "act_" + a.getId());
            map.put("leadId", a.getLead().getId());
            map.put("leadName", a.getLead().getName());
            map.put("performedByName", a.getActor() != null ? a.getActor().getFullName() : "System");
            map.put("action", a.getTitle() != null ? a.getTitle() : a.getActivityType());
            map.put("description", a.getDescription());
            map.put("timestamp", a.getCreatedAt() != null ? a.getCreatedAt().toString() : "");
            timeline.add(map);
        }

        // 2. Fetch LeadHistory
        List<LeadHistory> histories = leadHistoryRepository.findByLeadIdOrderByTimestampDesc(leadId);
        for (LeadHistory h : histories) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", "hist_" + h.getId());
            map.put("leadId", h.getLead().getId());
            map.put("leadName", h.getLead().getName());
            map.put("performedByName", h.getPerformedBy() != null ? h.getPerformedBy().getFullName() : "System");
            map.put("action", h.getAction());
            map.put("description", h.getDescription());
            map.put("timestamp", h.getTimestamp() != null ? h.getTimestamp().toString() : "");
            timeline.add(map);
        }

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
