package com.leadgrowth.dto;

import jakarta.validation.constraints.NotBlank;

public class ReportReviewRequest {
    @NotBlank
    private String status; // APPROVED, REJECTED

    private String managerComment;

    public ReportReviewRequest() {}

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getManagerComment() { return managerComment; }
    public void setManagerComment(String managerComment) { this.managerComment = managerComment; }
}
