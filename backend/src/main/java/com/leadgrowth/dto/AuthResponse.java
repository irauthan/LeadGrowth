package com.leadgrowth.dto;

import java.util.Set;

public class AuthResponse {
    private String token;
    private String refreshToken;
    private Long userId;
    private String email;
    private String fullName;
    private String designation;
    private String profileImage;
    private Set<String> roles;
    private Long workspaceId;
    private String workspaceName;
    private String workspaceSlug;
    private String inviteCode;
    private String availabilityStatus;

    public AuthResponse() {}

    public AuthResponse(String token, String refreshToken, Long userId, String email, String fullName, String designation, String profileImage, Set<String> roles, Long workspaceId, String workspaceName, String workspaceSlug, String inviteCode, String availabilityStatus) {
        this.token = token;
        this.refreshToken = refreshToken;
        this.userId = userId;
        this.email = email;
        this.fullName = fullName;
        this.designation = designation;
        this.profileImage = profileImage;
        this.roles = roles;
        this.workspaceId = workspaceId;
        this.workspaceName = workspaceName;
        this.workspaceSlug = workspaceSlug;
        this.inviteCode = inviteCode;
        this.availabilityStatus = availabilityStatus;
    }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public String getRefreshToken() { return refreshToken; }
    public void setRefreshToken(String refreshToken) { this.refreshToken = refreshToken; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getDesignation() { return designation; }
    public void setDesignation(String designation) { this.designation = designation; }

    public String getProfileImage() { return profileImage; }
    public void setProfileImage(String profileImage) { this.profileImage = profileImage; }

    public Set<String> getRoles() { return roles; }
    public void setRoles(Set<String> roles) { this.roles = roles; }

    public Long getWorkspaceId() { return workspaceId; }
    public void setWorkspaceId(Long workspaceId) { this.workspaceId = workspaceId; }

    public String getWorkspaceName() { return workspaceName; }
    public void setWorkspaceName(String workspaceName) { this.workspaceName = workspaceName; }

    public String getWorkspaceSlug() { return workspaceSlug; }
    public void setWorkspaceSlug(String workspaceSlug) { this.workspaceSlug = workspaceSlug; }

    public String getInviteCode() { return inviteCode; }
    public void setInviteCode(String inviteCode) { this.inviteCode = inviteCode; }

    public String getAvailabilityStatus() { return availabilityStatus; }
    public void setAvailabilityStatus(String availabilityStatus) { this.availabilityStatus = availabilityStatus; }

    // Builder
    public static AuthResponseBuilder builder() {
        return new AuthResponseBuilder();
    }

    public static class AuthResponseBuilder {
        private String token;
        private String refreshToken;
        private Long userId;
        private String email;
        private String fullName;
        private String designation;
        private String profileImage;
        private Set<String> roles;
        private Long workspaceId;
        private String workspaceName;
        private String workspaceSlug;
        private String inviteCode;
        private String availabilityStatus;

        AuthResponseBuilder() {}

        public AuthResponseBuilder token(String token) { this.token = token; return this; }
        public AuthResponseBuilder refreshToken(String refreshToken) { this.refreshToken = refreshToken; return this; }
        public AuthResponseBuilder userId(Long userId) { this.userId = userId; return this; }
        public AuthResponseBuilder email(String email) { this.email = email; return this; }
        public AuthResponseBuilder fullName(String fullName) { this.fullName = fullName; return this; }
        public AuthResponseBuilder designation(String designation) { this.designation = designation; return this; }
        public AuthResponseBuilder profileImage(String profileImage) { this.profileImage = profileImage; return this; }
        public AuthResponseBuilder roles(Set<String> roles) { this.roles = roles; return this; }
        public AuthResponseBuilder workspaceId(Long workspaceId) { this.workspaceId = workspaceId; return this; }
        public AuthResponseBuilder workspaceName(String workspaceName) { this.workspaceName = workspaceName; return this; }
        public AuthResponseBuilder workspaceSlug(String workspaceSlug) { this.workspaceSlug = workspaceSlug; return this; }
        public AuthResponseBuilder inviteCode(String inviteCode) { this.inviteCode = inviteCode; return this; }
        public AuthResponseBuilder availabilityStatus(String availabilityStatus) { this.availabilityStatus = availabilityStatus; return this; }

        public AuthResponse build() {
            return new AuthResponse(token, refreshToken, userId, email, fullName, designation, profileImage, roles, workspaceId, workspaceName, workspaceSlug, inviteCode, availabilityStatus);
        }
    }
}
