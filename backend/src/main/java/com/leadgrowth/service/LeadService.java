package com.leadgrowth.service;

import com.leadgrowth.dto.LeadDto;
import com.leadgrowth.dto.LeadNoteRequest;
import com.leadgrowth.entity.Campaign;
import com.leadgrowth.entity.Lead;
import com.leadgrowth.entity.LeadNote;
import com.leadgrowth.entity.User;
import com.leadgrowth.repository.CampaignRepository;
import com.leadgrowth.repository.LeadNoteRepository;
import com.leadgrowth.repository.LeadRepository;
import com.leadgrowth.repository.UserRepository;
import com.leadgrowth.websocket.WebSocketManager;
import org.springframework.context.annotation.Lazy;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class LeadService {

    private final LeadRepository leadRepository;
    private final LeadNoteRepository leadNoteRepository;
    private final UserRepository userRepository;
    private final CampaignRepository campaignRepository;
    private final WebSocketManager webSocketManager;

    public LeadService(
            LeadRepository leadRepository,
            LeadNoteRepository leadNoteRepository,
            UserRepository userRepository,
            CampaignRepository campaignRepository,
            @Lazy WebSocketManager webSocketManager
    ) {
        this.leadRepository = leadRepository;
        this.leadNoteRepository = leadNoteRepository;
        this.userRepository = userRepository;
        this.campaignRepository = campaignRepository;
        this.webSocketManager = webSocketManager;
    }

    public List<LeadDto> getLeads(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        if (user.getWorkspace() == null) {
            throw new IllegalStateException("User does not belong to a workspace");
        }

        boolean isUserOnly = user.getRoles().stream()
                .anyMatch(r -> r.getName().equals("ROLE_USER")) &&
                user.getRoles().stream().noneMatch(r -> r.getName().equals("ROLE_ADMIN") || r.getName().equals("ROLE_MANAGER"));

        List<Lead> leads;
        if (isUserOnly) {
            leads = leadRepository.findByWorkspaceIdAndAssignedToIdOrderByCreatedAtDesc(
                    user.getWorkspace().getId(), user.getId()
            );
        } else {
            leads = leadRepository.findByWorkspaceIdOrderByCreatedAtDesc(user.getWorkspace().getId());
        }

        return leads.stream().map(this::convertToDto).collect(Collectors.toList());
    }

    @Transactional
    public LeadDto createLead(LeadDto dto, String userEmail) {
        User creator = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        
        Campaign campaign = null;
        if (dto.getCampaignId() != null) {
            campaign = campaignRepository.findById(dto.getCampaignId()).orElse(null);
        }

        User assignedTo = null;
        if (dto.getAssignedToId() != null && dto.getAssignedToId() > 0) {
            assignedTo = userRepository.findById(dto.getAssignedToId()).orElse(null);
        } else if (dto.getAssignedToId() != null && dto.getAssignedToId() == -1) {
            assignedTo = findEqualDistributionLeadAssignee(creator.getWorkspace().getId());
        }

        Lead lead = Lead.builder()
                .workspace(creator.getWorkspace())
                .campaign(campaign)
                .name(dto.getName())
                .email(dto.getEmail())
                .phone(dto.getPhone())
                .sourcePlatform(dto.getSourcePlatform())
                .campaignName(dto.getCampaignName())
                .status("New")
                .assignedTo(assignedTo)
                .build();

        Lead saved = leadRepository.save(lead);

        // Track and increment campaign stats
        if (campaign != null) {
            campaign.setLeadsCount(campaign.getLeadsCount() + 1);
            campaignRepository.save(campaign);
        }

        LeadDto resultDto = convertToDto(saved);

        // Broadcast lead to web socket for live feed monitoring
        webSocketManager.broadcastLead(creator.getWorkspace().getId(), resultDto);

        return resultDto;
    }

    @Transactional
    public LeadDto updateStatus(Long leadId, String status, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        Lead lead = leadRepository.findById(leadId)
                .orElseThrow(() -> new IllegalArgumentException("Lead not found"));

        // RBAC check: standard user can only edit their assigned leads
        boolean isUserOnly = user.getRoles().stream()
                .anyMatch(r -> r.getName().equals("ROLE_USER")) &&
                user.getRoles().stream().noneMatch(r -> r.getName().equals("ROLE_ADMIN") || r.getName().equals("ROLE_MANAGER"));

        if (isUserOnly && (lead.getAssignedTo() == null || !lead.getAssignedTo().getId().equals(user.getId()))) {
            throw new IllegalStateException("You are not authorized to update this lead's status");
        }

        lead.setStatus(status);
        
        // Track Conversion in campaign stats
        if ("Converted".equalsIgnoreCase(status) && lead.getCampaign() != null) {
            Campaign c = lead.getCampaign();
            c.setConversions(c.getConversions() + 1);
            campaignRepository.save(c);
        }

        return convertToDto(leadRepository.save(lead));
    }

    @Transactional
    public LeadDto assignLead(Long leadId, Long userId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        Lead lead = leadRepository.findById(leadId)
                .orElseThrow(() -> new IllegalArgumentException("Lead not found"));

        User assignTarget = userId == -1 
                ? findEqualDistributionLeadAssignee(user.getWorkspace().getId())
                : userRepository.findById(userId).orElseThrow(() -> new IllegalArgumentException("Target user not found"));

        lead.setAssignedTo(assignTarget);
        return convertToDto(leadRepository.save(lead));
    }

    @Transactional
    public List<LeadDto> bulkAssignLeads(List<Long> leadIds, Long userId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        User assignTarget = userId == -1
                ? findEqualDistributionLeadAssignee(user.getWorkspace().getId())
                : userRepository.findById(userId).orElseThrow(() -> new IllegalArgumentException("Target user not found"));

        List<LeadDto> updated = new ArrayList<>();
        for (Long id : leadIds) {
            Lead lead = leadRepository.findById(id).orElse(null);
            if (lead != null && lead.getWorkspace().getId().equals(user.getWorkspace().getId())) {
                lead.setAssignedTo(assignTarget);
                updated.add(convertToDto(leadRepository.save(lead)));
            }
        }
        return updated;
    }

    @Transactional
    public List<LeadDto> bulkRandomAssignLeads(List<Long> leadIds, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        List<LeadDto> updated = new ArrayList<>();
        for (Long id : leadIds) {
            Lead lead = leadRepository.findById(id).orElse(null);
            if (lead != null && lead.getWorkspace().getId().equals(user.getWorkspace().getId())) {
                User assignTarget = findEqualDistributionLeadAssignee(user.getWorkspace().getId());
                lead.setAssignedTo(assignTarget);
                updated.add(convertToDto(leadRepository.save(lead)));
            }
        }
        return updated;
    }

    @Transactional
    public List<LeadDto> bulkUpdateLeadStatus(List<Long> leadIds, String status, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        List<LeadDto> updated = new ArrayList<>();
        for (Long id : leadIds) {
            Lead lead = leadRepository.findById(id).orElse(null);
            if (lead != null && lead.getWorkspace().getId().equals(user.getWorkspace().getId())) {
                lead.setStatus(status);
                
                if ("Converted".equalsIgnoreCase(status) && lead.getCampaign() != null) {
                    Campaign c = lead.getCampaign();
                    c.setConversions(c.getConversions() + 1);
                    campaignRepository.save(c);
                }
                updated.add(convertToDto(leadRepository.save(lead)));
            }
        }
        return updated;
    }

    @Transactional
    public void addNote(Long leadId, LeadNoteRequest request, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        Lead lead = leadRepository.findById(leadId)
                .orElseThrow(() -> new IllegalArgumentException("Lead not found"));

        // Check permission: ROLE_USER must be assigned
        boolean isUserOnly = user.getRoles().stream()
                .anyMatch(r -> r.getName().equals("ROLE_USER")) &&
                user.getRoles().stream().noneMatch(r -> r.getName().equals("ROLE_ADMIN") || r.getName().equals("ROLE_MANAGER"));

        if (isUserOnly && (lead.getAssignedTo() == null || !lead.getAssignedTo().getId().equals(user.getId()))) {
            throw new IllegalStateException("You cannot add notes to a lead not assigned to you");
        }

        LeadNote note = LeadNote.builder()
                .lead(lead)
                .user(user)
                .note(request.getNote())
                .build();

        leadNoteRepository.save(note);
    }

    public List<LeadNote> getNotes(Long leadId) {
        return leadNoteRepository.findByLeadIdOrderByCreatedAtDesc(leadId);
    }

    public LeadDto getLeadById(Long leadId) {
        Lead lead = leadRepository.findById(leadId)
                .orElseThrow(() -> new IllegalArgumentException("Lead not found"));
        return convertToDto(lead);
    }

    private User findEqualDistributionLeadAssignee(Long workspaceId) {
        List<User> members = userRepository.findByWorkspaceId(workspaceId);
        List<User> activeMembers = members.stream()
                .filter(u -> !"SUSPENDED".equalsIgnoreCase(u.getStatus()))
                .collect(Collectors.toList());

        if (activeMembers.isEmpty()) {
            return null;
        }

        User bestMember = activeMembers.get(0);
        long minCount = Long.MAX_VALUE;
        for (User u : activeMembers) {
            long count = leadRepository.countByAssignedToAndStatusIn(u, List.of("New", "Contacted", "Qualified"));
            if (count < minCount) {
                minCount = count;
                bestMember = u;
            }
        }
        return bestMember;
    }

    private LeadDto convertToDto(Lead lead) {
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
}
