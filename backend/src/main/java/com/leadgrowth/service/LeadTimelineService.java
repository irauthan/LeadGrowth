package com.leadgrowth.service;

import com.leadgrowth.entity.Lead;
import com.leadgrowth.entity.LeadActivity;
import com.leadgrowth.entity.User;
import com.leadgrowth.repository.LeadActivityRepository;
import com.leadgrowth.repository.LeadRepository;
import com.leadgrowth.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class LeadTimelineService {

    private final LeadActivityRepository leadActivityRepository;
    private final LeadRepository leadRepository;
    private final UserRepository userRepository;

    public LeadTimelineService(
            LeadActivityRepository leadActivityRepository,
            LeadRepository leadRepository,
            UserRepository userRepository
    ) {
        this.leadActivityRepository = leadActivityRepository;
        this.leadRepository = leadRepository;
        this.userRepository = userRepository;
    }

    public void logActivity(Lead lead, User actor, String activityType, String title, String description) {
        if (lead == null || lead.getWorkspace() == null) return;
        LeadActivity activity = new LeadActivity(lead, actor, lead.getWorkspace(), activityType, title, description);
        leadActivityRepository.save(activity);
    }

    public List<Map<String, Object>> getLeadTimeline(Long leadId) {
        List<LeadActivity> activities = leadActivityRepository.findByLeadIdOrderByCreatedAtDesc(leadId);
        return activities.stream().map(this::convertToMap).collect(Collectors.toList());
    }

    public Map<String, Object> addNote(Long leadId, String userEmail, String title, String description) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Lead lead = leadRepository.findById(leadId)
                .orElseThrow(() -> new RuntimeException("Lead not found"));

        LeadActivity activity = new LeadActivity(lead, user, user.getWorkspace(), "NOTE", title, description);
        LeadActivity saved = leadActivityRepository.save(activity);
        return convertToMap(saved);
    }

    private Map<String, Object> convertToMap(LeadActivity a) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", a.getId());
        map.put("leadId", a.getLead().getId());
        map.put("leadName", a.getLead().getName());
        map.put("actorName", a.getActor() != null ? a.getActor().getFullName() : "System");
        map.put("activityType", a.getActivityType());
        map.put("title", a.getTitle());
        map.put("description", a.getDescription());
        map.put("createdAt", a.getCreatedAt().toString());
        return map;
    }
}
