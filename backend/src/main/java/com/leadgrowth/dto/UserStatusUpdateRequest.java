package com.leadgrowth.dto;

import jakarta.validation.constraints.NotBlank;

public class UserStatusUpdateRequest {

    @NotBlank(message = "Status is required")
    private String status; // "ACTIVE", "SUSPENDED"

    public UserStatusUpdateRequest() {}

    public UserStatusUpdateRequest(String status) {
        this.status = status;
    }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
