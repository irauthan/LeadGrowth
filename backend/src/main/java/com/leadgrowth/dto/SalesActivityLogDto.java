package com.leadgrowth.dto;

import java.time.LocalDateTime;

public class SalesActivityLogDto {
    private Long id;
    private Long salesActivityId;
    private Long leadId;
    private Integer activityNumber;
    private String communicationType;
    private String outcome;
    private String remarks;
    private String duration;
    private String status;
    private LocalDateTime nextFollowupDate;
    private String attachments;
    private Long loggedById;
    private String loggedByName;
    private LocalDateTime createdAt;

    public SalesActivityLogDto() {}

    public SalesActivityLogDto(
            Long id,
            Long salesActivityId,
            Long leadId,
            Integer activityNumber,
            String communicationType,
            String outcome,
            String remarks,
            String duration,
            String status,
            LocalDateTime nextFollowupDate,
            String attachments,
            Long loggedById,
            String loggedByName,
            LocalDateTime createdAt
    ) {
        this.id = id;
        this.salesActivityId = salesActivityId;
        this.leadId = leadId;
        this.activityNumber = activityNumber;
        this.communicationType = communicationType;
        this.outcome = outcome;
        this.remarks = remarks;
        this.duration = duration;
        this.status = status;
        this.nextFollowupDate = nextFollowupDate;
        this.attachments = attachments;
        this.loggedById = loggedById;
        this.loggedByName = loggedByName;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getSalesActivityId() { return salesActivityId; }
    public void setSalesActivityId(Long salesActivityId) { this.salesActivityId = salesActivityId; }

    public Long getLeadId() { return leadId; }
    public void setLeadId(Long leadId) { this.leadId = leadId; }

    public Integer getActivityNumber() { return activityNumber; }
    public void setActivityNumber(Integer activityNumber) { this.activityNumber = activityNumber; }

    public String getCommunicationType() { return communicationType; }
    public void setCommunicationType(String communicationType) { this.communicationType = communicationType; }

    public String getOutcome() { return outcome; }
    public void setOutcome(String outcome) { this.outcome = outcome; }

    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }

    public String getDuration() { return duration; }
    public void setDuration(String duration) { this.duration = duration; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getNextFollowupDate() { return nextFollowupDate; }
    public void setNextFollowupDate(LocalDateTime nextFollowupDate) { this.nextFollowupDate = nextFollowupDate; }

    public String getAttachments() { return attachments; }
    public void setAttachments(String attachments) { this.attachments = attachments; }

    public Long getLoggedById() { return loggedById; }
    public void setLoggedById(Long loggedById) { this.loggedById = loggedById; }

    public String getLoggedByName() { return loggedByName; }
    public void setLoggedByName(String loggedByName) { this.loggedByName = loggedByName; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
