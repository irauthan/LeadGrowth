package com.leadgrowth.dto;

import java.time.LocalDateTime;

public class LeadHistoryDto {
    private Long id;
    private Long leadId;
    private String action;
    private String description;
    private Long performedById;
    private String performedByName;
    private String previousStatus;
    private String newStatus;
    private LocalDateTime timestamp;

    public LeadHistoryDto() {}

    public LeadHistoryDto(Long id, Long leadId, String action, String description, Long performedById, String performedByName, String previousStatus, String newStatus, LocalDateTime timestamp) {
        this.id = id;
        this.leadId = leadId;
        this.action = action;
        this.description = description;
        this.performedById = performedById;
        this.performedByName = performedByName;
        this.previousStatus = previousStatus;
        this.newStatus = newStatus;
        this.timestamp = timestamp;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getLeadId() { return leadId; }
    public void setLeadId(Long leadId) { this.leadId = leadId; }

    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Long getPerformedById() { return performedById; }
    public void setPerformedById(Long performedById) { this.performedById = performedById; }

    public String getPerformedByName() { return performedByName; }
    public void setPerformedByName(String performedByName) { this.performedByName = performedByName; }

    public String getPreviousStatus() { return previousStatus; }
    public void setPreviousStatus(String previousStatus) { this.previousStatus = previousStatus; }

    public String getNewStatus() { return newStatus; }
    public void setNewStatus(String newStatus) { this.newStatus = newStatus; }

    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
}
