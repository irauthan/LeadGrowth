package com.leadgrowth.dto;

import java.time.LocalDateTime;
import java.util.List;

public class LeadDto {
    private Long id;
    private String name;
    private String email;
    private String phone;
    private String sourcePlatform;
    private String campaignName;
    private Long campaignId;
    private String status; // New, Contacted, Follow-up, Proposal Sent, Negotiation, Converted, Lost
    private Long assignedToId;
    private String assignedToName;
    private Integer qualityScore;
    private String qualityTier; // HOT, WARM, COLD
    private Double conversionProbability;
    private String queueStatus; // IN_QUEUE, ASSIGNED, ARCHIVED

    // Enterprise CRM fields
    private String company;
    private String location;
    private String priority; // HIGH, MEDIUM, LOW
    private String assignedByName;
    private LocalDateTime assignedDate;
    private Integer progressPercentage;
    private LocalDateTime lastFollowupDate;
    private LocalDateTime dueDate;
    private String clientNotes;
    private Double proposalAmount;
    private String proposalStatus;
    private List<SalesActivityDto> activities;
    private LocalDateTime createdAt;

    public LeadDto() {}

    public LeadDto(Long id, String name, String email, String phone, String sourcePlatform, String campaignName, Long campaignId, String status, Long assignedToId, String assignedToName, Integer qualityScore, String qualityTier, Double conversionProbability, String queueStatus, LocalDateTime createdAt) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.phone = phone;
        this.sourcePlatform = sourcePlatform;
        this.campaignName = campaignName;
        this.campaignId = campaignId;
        this.status = status;
        this.assignedToId = assignedToId;
        this.assignedToName = assignedToName;
        this.qualityScore = qualityScore;
        this.qualityTier = qualityTier;
        this.conversionProbability = conversionProbability;
        this.queueStatus = queueStatus;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getSourcePlatform() { return sourcePlatform; }
    public void setSourcePlatform(String sourcePlatform) { this.sourcePlatform = sourcePlatform; }

    public String getCampaignName() { return campaignName; }
    public void setCampaignName(String campaignName) { this.campaignName = campaignName; }

    public Long getCampaignId() { return campaignId; }
    public void setCampaignId(Long campaignId) { this.campaignId = campaignId; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Long getAssignedToId() { return assignedToId; }
    public void setAssignedToId(Long assignedToId) { this.assignedToId = assignedToId; }

    public String getAssignedToName() { return assignedToName; }
    public void setAssignedToName(String assignedToName) { this.assignedToName = assignedToName; }

    public Integer getQualityScore() { return qualityScore; }
    public void setQualityScore(Integer qualityScore) { this.qualityScore = qualityScore; }

    public String getQualityTier() { return qualityTier; }
    public void setQualityTier(String qualityTier) { this.qualityTier = qualityTier; }

    public Double getConversionProbability() { return conversionProbability; }
    public void setConversionProbability(Double conversionProbability) { this.conversionProbability = conversionProbability; }

    public String getQueueStatus() { return queueStatus; }
    public void setQueueStatus(String queueStatus) { this.queueStatus = queueStatus; }

    public String getCompany() { return company; }
    public void setCompany(String company) { this.company = company; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }

    public String getAssignedByName() { return assignedByName; }
    public void setAssignedByName(String assignedByName) { this.assignedByName = assignedByName; }

    public LocalDateTime getAssignedDate() { return assignedDate; }
    public void setAssignedDate(LocalDateTime assignedDate) { this.assignedDate = assignedDate; }

    public Integer getProgressPercentage() { return progressPercentage; }
    public void setProgressPercentage(Integer progressPercentage) { this.progressPercentage = progressPercentage; }

    public LocalDateTime getLastFollowupDate() { return lastFollowupDate; }
    public void setLastFollowupDate(LocalDateTime lastFollowupDate) { this.lastFollowupDate = lastFollowupDate; }

    public LocalDateTime getDueDate() { return dueDate; }
    public void setDueDate(LocalDateTime dueDate) { this.dueDate = dueDate; }

    public String getClientNotes() { return clientNotes; }
    public void setClientNotes(String clientNotes) { this.clientNotes = clientNotes; }

    public Double getProposalAmount() { return proposalAmount; }
    public void setProposalAmount(Double proposalAmount) { this.proposalAmount = proposalAmount; }

    public String getProposalStatus() { return proposalStatus; }
    public void setProposalStatus(String proposalStatus) { this.proposalStatus = proposalStatus; }

    public List<SalesActivityDto> getActivities() { return activities; }
    public void setActivities(List<SalesActivityDto> activities) { this.activities = activities; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public static LeadDtoBuilder builder() {
        return new LeadDtoBuilder();
    }

    public static class LeadDtoBuilder {
        private Long id;
        private String name;
        private String email;
        private String phone;
        private String sourcePlatform;
        private String campaignName;
        private Long campaignId;
        private String status;
        private Long assignedToId;
        private String assignedToName;
        private Integer qualityScore;
        private String qualityTier;
        private Double conversionProbability;
        private String queueStatus;
        private String company;
        private String location;
        private String priority;
        private String assignedByName;
        private LocalDateTime assignedDate;
        private Integer progressPercentage;
        private LocalDateTime lastFollowupDate;
        private LocalDateTime dueDate;
        private String clientNotes;
        private Double proposalAmount;
        private String proposalStatus;
        private List<SalesActivityDto> activities;
        private LocalDateTime createdAt;

        LeadDtoBuilder() {}

        public LeadDtoBuilder id(Long id) { this.id = id; return this; }
        public LeadDtoBuilder name(String name) { this.name = name; return this; }
        public LeadDtoBuilder email(String email) { this.email = email; return this; }
        public LeadDtoBuilder phone(String phone) { this.phone = phone; return this; }
        public LeadDtoBuilder sourcePlatform(String sourcePlatform) { this.sourcePlatform = sourcePlatform; return this; }
        public LeadDtoBuilder campaignName(String campaignName) { this.campaignName = campaignName; return this; }
        public LeadDtoBuilder campaignId(Long campaignId) { this.campaignId = campaignId; return this; }
        public LeadDtoBuilder status(String status) { this.status = status; return this; }
        public LeadDtoBuilder assignedToId(Long assignedToId) { this.assignedToId = assignedToId; return this; }
        public LeadDtoBuilder assignedToName(String assignedToName) { this.assignedToName = assignedToName; return this; }
        public LeadDtoBuilder qualityScore(Integer qualityScore) { this.qualityScore = qualityScore; return this; }
        public LeadDtoBuilder qualityTier(String qualityTier) { this.qualityTier = qualityTier; return this; }
        public LeadDtoBuilder conversionProbability(Double conversionProbability) { this.conversionProbability = conversionProbability; return this; }
        public LeadDtoBuilder queueStatus(String queueStatus) { this.queueStatus = queueStatus; return this; }
        public LeadDtoBuilder company(String company) { this.company = company; return this; }
        public LeadDtoBuilder location(String location) { this.location = location; return this; }
        public LeadDtoBuilder priority(String priority) { this.priority = priority; return this; }
        public LeadDtoBuilder assignedByName(String assignedByName) { this.assignedByName = assignedByName; return this; }
        public LeadDtoBuilder assignedDate(LocalDateTime assignedDate) { this.assignedDate = assignedDate; return this; }
        public LeadDtoBuilder progressPercentage(Integer progressPercentage) { this.progressPercentage = progressPercentage; return this; }
        public LeadDtoBuilder lastFollowupDate(LocalDateTime lastFollowupDate) { this.lastFollowupDate = lastFollowupDate; return this; }
        public LeadDtoBuilder dueDate(LocalDateTime dueDate) { this.dueDate = dueDate; return this; }
        public LeadDtoBuilder clientNotes(String clientNotes) { this.clientNotes = clientNotes; return this; }
        public LeadDtoBuilder proposalAmount(Double proposalAmount) { this.proposalAmount = proposalAmount; return this; }
        public LeadDtoBuilder proposalStatus(String proposalStatus) { this.proposalStatus = proposalStatus; return this; }
        public LeadDtoBuilder activities(List<SalesActivityDto> activities) { this.activities = activities; return this; }
        public LeadDtoBuilder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }

        public LeadDto build() {
            LeadDto dto = new LeadDto();
            dto.id = this.id;
            dto.name = this.name;
            dto.email = this.email;
            dto.phone = this.phone;
            dto.sourcePlatform = this.sourcePlatform;
            dto.campaignName = this.campaignName;
            dto.campaignId = this.campaignId;
            dto.status = this.status;
            dto.assignedToId = this.assignedToId;
            dto.assignedToName = this.assignedToName;
            dto.qualityScore = this.qualityScore;
            dto.qualityTier = this.qualityTier;
            dto.conversionProbability = this.conversionProbability;
            dto.queueStatus = this.queueStatus;
            dto.company = this.company;
            dto.location = this.location;
            dto.priority = this.priority;
            dto.assignedByName = this.assignedByName;
            dto.assignedDate = this.assignedDate;
            dto.progressPercentage = this.progressPercentage;
            dto.lastFollowupDate = this.lastFollowupDate;
            dto.dueDate = this.dueDate;
            dto.clientNotes = this.clientNotes;
            dto.proposalAmount = this.proposalAmount;
            dto.proposalStatus = this.proposalStatus;
            dto.activities = this.activities;
            dto.createdAt = this.createdAt;
            return dto;
        }
    }
}
