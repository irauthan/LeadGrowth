package com.leadgrowth.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_sessions")
public class UserSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Column(name = "user_agent", length = 255)
    private String userAgent;

    @Column(name = "login_time", nullable = false)
    private LocalDateTime loginTime;

    @Column(name = "last_active_time", nullable = false)
    private LocalDateTime lastActiveTime;

    @Column(name = "is_expired", nullable = false)
    private boolean isExpired = false;

    public UserSession() {}

    public UserSession(Long id, User user, String ipAddress, String userAgent, LocalDateTime loginTime, LocalDateTime lastActiveTime, boolean isExpired) {
        this.id = id;
        this.user = user;
        this.ipAddress = ipAddress;
        this.userAgent = userAgent;
        this.loginTime = loginTime;
        this.lastActiveTime = lastActiveTime;
        this.isExpired = isExpired;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

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
