package com.leadgrowth.dto;

import java.time.LocalDateTime;

public class LeadDto {
    private Long id;
    private String name;
    private String email;
    private String phone;
    private String sourcePlatform;
    private String campaignName;
    private Long campaignId;
    private String status; // New, Contacted, Qualified, Converted, Rejected
    private Long assignedToId;
    private String assignedToName;
    private Integer qualityScore;
    private String qualityTier; // HOT, WARM, COLD
    private Double conversionProbability;
    private String queueStatus; // IN_QUEUE, ASSIGNED, ARCHIVED
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

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    // Builder
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
        public LeadDtoBuilder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }

        public LeadDto build() {
            return new LeadDto(id, name, email, phone, sourcePlatform, campaignName, campaignId, status, assignedToId, assignedToName, qualityScore, qualityTier, conversionProbability, queueStatus, createdAt);
        }
    }
}
