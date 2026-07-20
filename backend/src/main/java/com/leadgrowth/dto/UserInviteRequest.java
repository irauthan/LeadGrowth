package com.leadgrowth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public class UserInviteRequest {

    @NotBlank(message = "Email is required")
    @Email(message = "Email should be valid")
    private String email;

    @NotBlank(message = "Role is required")
    private String role; // "ADMIN", "MANAGER", "USER"

    public UserInviteRequest() {}

    public UserInviteRequest(String email, String role) {
        this.email = email;
        this.role = role;
    }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
}
