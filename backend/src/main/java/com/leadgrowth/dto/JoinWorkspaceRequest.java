package com.leadgrowth.dto;

import jakarta.validation.constraints.NotBlank;

public class JoinWorkspaceRequest {

    @NotBlank(message = "Invite code is required")
    private String inviteCode;

    public JoinWorkspaceRequest() {}

    public JoinWorkspaceRequest(String inviteCode) {
        this.inviteCode = inviteCode;
    }

    public String getInviteCode() { return inviteCode; }
    public void setInviteCode(String inviteCode) { this.inviteCode = inviteCode; }
}
