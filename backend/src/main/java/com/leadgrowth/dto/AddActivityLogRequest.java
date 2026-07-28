package com.leadgrowth.dto;

import java.time.LocalDateTime;
import java.time.ZonedDateTime;

public class AddActivityLogRequest {
    private String communicationType; // PHONE_CALL, WHATSAPP, EMAIL, GOOGLE_MEET, ZOOM, OFFICE_VISIT, VIDEO_CALL, OTHER
    private String outcome; // BUSY, NOT_ANSWERED, REJECTED_CALL, WRONG_NUMBER, INTERESTED, NOT_INTERESTED, CALL_BACK_LATER, MEETING_SCHEDULED, DEMO_SCHEDULED, PROPOSAL_REQUESTED, NEGOTIATION_STARTED, CONVERTED, LOST, CUSTOM_OUTCOME
    private String remarks;
    private String duration;
    private String status; // ATTEMPTED, IN_PROGRESS, WAITING, SCHEDULED, SUCCESSFUL, COMPLETED, CANCELLED
    private LocalDateTime nextFollowupDate;
    private String attachments;

    public AddActivityLogRequest() {}

    public AddActivityLogRequest(String communicationType, String outcome, String remarks, String duration, String status, LocalDateTime nextFollowupDate, String attachments) {
        this.communicationType = communicationType;
        this.outcome = outcome;
        this.remarks = remarks;
        this.duration = duration;
        this.status = status;
        this.nextFollowupDate = nextFollowupDate;
        this.attachments = attachments;
    }

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
    
    public void setNextFollowupDate(Object dateObj) {
        if (dateObj == null) {
            this.nextFollowupDate = null;
        } else if (dateObj instanceof String str) {
            if (str.isBlank()) {
                this.nextFollowupDate = null;
            } else {
                try {
                    this.nextFollowupDate = ZonedDateTime.parse(str).toLocalDateTime();
                } catch (Exception e1) {
                    try {
                        this.nextFollowupDate = LocalDateTime.parse(str);
                    } catch (Exception e2) {
                        try {
                            this.nextFollowupDate = LocalDateTime.parse(str.replace("Z", "").split("\\.")[0]);
                        } catch (Exception e3) {
                            this.nextFollowupDate = null;
                        }
                    }
                }
            }
        } else if (dateObj instanceof LocalDateTime ldt) {
            this.nextFollowupDate = ldt;
        }
    }

    public String getAttachments() { return attachments; }
    public void setAttachments(String attachments) { this.attachments = attachments; }
}
