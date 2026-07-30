package com.leadgrowth.dto;

import java.time.LocalDateTime;

public class ContactRepoDto {

    private Long leadId;
    private String name;
    private String company;
    private String email;
    private String phone;
    private String sourcePlatform;
    private String currentStage;
    private Long assignedToId;
    private String assignedToName;
    private Integer qualityScore;
    private String qualityTier;
    private Double conversionProbability;

    private LocalDateTime firstContactDate;
    private LocalDateTime lastContactDate;
    private long totalCalls;
    private long totalEmails;
    private long totalWhatsApp;
    private long totalInteractionsCount;
    private String lastActivityDescription;
    private LocalDateTime createdAt;

    public ContactRepoDto() {}

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

    public LocalDateTime getFirstContactDate() { return firstContactDate; }
    public void setFirstContactDate(LocalDateTime firstContactDate) { this.firstContactDate = firstContactDate; }

    public LocalDateTime getLastContactDate() { return lastContactDate; }
    public void setLastContactDate(LocalDateTime lastContactDate) { this.lastContactDate = lastContactDate; }

    public long getTotalCalls() { return totalCalls; }
    public void setTotalCalls(long totalCalls) { this.totalCalls = totalCalls; }

    public long getTotalEmails() { return totalEmails; }
    public void setTotalEmails(long totalEmails) { this.totalEmails = totalEmails; }

    public long getTotalWhatsApp() { return totalWhatsApp; }
    public void setTotalWhatsApp(long totalWhatsApp) { this.totalWhatsApp = totalWhatsApp; }

    public long getTotalInteractionsCount() { return totalInteractionsCount; }
    public void setTotalInteractionsCount(long totalInteractionsCount) { this.totalInteractionsCount = totalInteractionsCount; }

    public String getLastActivityDescription() { return lastActivityDescription; }
    public void setLastActivityDescription(String lastActivityDescription) { this.lastActivityDescription = lastActivityDescription; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
