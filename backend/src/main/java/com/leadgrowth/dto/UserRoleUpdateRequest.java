package com.leadgrowth.dto;

import jakarta.validation.constraints.NotBlank;

public class UserRoleUpdateRequest {

    @NotBlank(message = "Role is required")
    private String role; // "ADMIN", "MANAGER", "USER"

    public UserRoleUpdateRequest() {}

    public UserRoleUpdateRequest(String role) {
        this.role = role;
    }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
}
