package com.leadgrowth.dto;

import java.time.LocalDateTime;

public class UserSessionDto {
    private Long id;
    private String ipAddress;
    private String userAgent;
    private LocalDateTime loginTime;
    private LocalDateTime lastActiveTime;
    private boolean isExpired;

    public UserSessionDto() {}

    public UserSessionDto(Long id, String ipAddress, String userAgent, LocalDateTime loginTime, LocalDateTime lastActiveTime, boolean isExpired) {
        this.id = id;
        this.ipAddress = ipAddress;
        this.userAgent = userAgent;
        this.loginTime = loginTime;
        this.lastActiveTime = lastActiveTime;
        this.isExpired = isExpired;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getIpAddress() { return ipAddress; }
    public void setIpAddress(String ipAddress) { this.ipAddress = ipAddress; }

    public String getUserAgent() { return userAgent; }
    public void setUserAgent(String userAgent) { this.userAgent = userAgent; }

    public LocalDateTime getLoginTime() { return loginTime; }
    public void setLoginTime(LocalDateTime loginTime) { this.loginTime = loginTime; }

    public LocalDateTime getLastActiveTime() { return lastActiveTime; }
    public void setLastActiveTime(LocalDateTime lastActiveTime) { this.lastActiveTime = lastActiveTime; }

    public boolean isExpired() { return isExpired; }
    public void setExpired(boolean expired) { isExpired = expired; }
}
