package com.leadgrowth.dto;

import java.time.LocalDateTime;

public class PriorityDto {

    private Long leadId;
    private String name;
    private String company;
    private String email;
    private String phone;
    private String sourcePlatform;
    private String currentStage;
    private Integer qualityScore;
    private String qualityTier;
    private Double conversionProbability;

    // Priority Information
    private String priorityLevel; // P1_OVERDUE_FOLLOWUP, P2_TODAY_NEGOTIATION, P3_TODAY_PROPOSAL, P4_TODAY_FOLLOWUP, P5_TODAY_NEW_LEAD, P6_REMAINING_PIPELINE
    private String priorityLabel; // Priority 1, Priority 2, etc.
    private String dueDate;
    private String dueTime;
    private String urgencyReason;

    private Long assignedToId;
    private String assignedToName;
    private LocalDateTime createdAt;
    private LocalDateTime lastActivityAt;
    private String lastActivityDescription;

    public PriorityDto() {}

    // Getters and Setters
    public Long getLeadId() { return leadId; }
    public void setLeadId(Long leadId) { this.leadId = leadId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getCompany() { return company; }
    public void setCompany(String company) { this.company = company; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getSourcePlatform() { return sourcePlatform; }
    public void setSourcePlatform(String sourcePlatform) { this.sourcePlatform = sourcePlatform; }

    public String getCurrentStage() { return currentStage; }
    public void setCurrentStage(String currentStage) { this.currentStage = currentStage; }

    public Integer getQualityScore() { return qualityScore; }
    public void setQualityScore(Integer qualityScore) { this.qualityScore = qualityScore; }

    public String getQualityTier() { return qualityTier; }
    public void setQualityTier(String qualityTier) { this.qualityTier = qualityTier; }

    public Double getConversionProbability() { return conversionProbability; }
    public void setConversionProbability(Double conversionProbability) { this.conversionProbability = conversionProbability; }

    public String getPriorityLevel() { return priorityLevel; }
    public void setPriorityLevel(String priorityLevel) { this.priorityLevel = priorityLevel; }

    public String getPriorityLabel() { return priorityLabel; }
    public void setPriorityLabel(String priorityLabel) { this.priorityLabel = priorityLabel; }

    public String getDueDate() { return dueDate; }
    public void setDueDate(String dueDate) { this.dueDate = dueDate; }

    public String getDueTime() { return dueTime; }
    public void setDueTime(String dueTime) { this.dueTime = dueTime; }

    public String getUrgencyReason() { return urgencyReason; }
    public void setUrgencyReason(String urgencyReason) { this.urgencyReason = urgencyReason; }

    public Long getAssignedToId() { return assignedToId; }
    public void setAssignedToId(Long assignedToId) { this.assignedToId = assignedToId; }

    public String getAssignedToName() { return assignedToName; }
    public void setAssignedToName(String assignedToName) { this.assignedToName = assignedToName; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getLastActivityAt() { return lastActivityAt; }
    public void setLastActivityAt(LocalDateTime lastActivityAt) { this.lastActivityAt = lastActivityAt; }

    public String getLastActivityDescription() { return lastActivityDescription; }
    public void setLastActivityDescription(String lastActivityDescription) { this.lastActivityDescription = lastActivityDescription; }
}
