package com.leadgrowth.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 100)
    private String email;

    @JsonIgnore
    @Column(nullable = false, length = 255)
    private String password;

    @Column(name = "full_name", nullable = false, length = 100)
    private String fullName;

    @Column(length = 100)
    private String designation;

    @Column(columnDefinition = "TEXT")
    private String bio;

    @Column(name = "profile_image", length = 255)
    private String profileImage;

    @Column(length = 20)
    private String phone;

    @Column(nullable = false, length = 20)
    private String status = "ACTIVE";

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "workspace_id")
    private Workspace workspace;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = "user_roles",
        joinColumns = @JoinColumn(name = "user_id"),
        inverseJoinColumns = @JoinColumn(name = "role_id")
    )
    private Set<Role> roles = new HashSet<>();

    @Column(length = 100)
    private String department;

    @Column(name = "last_active_at")
    private LocalDateTime lastActiveAt;

    @Column(name = "is_email_verified", nullable = false)
    private boolean isEmailVerified = false;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    // Constructors
    public User() {}

    public User(Long id, String email, String password, String fullName, String designation, String bio, String profileImage, String phone, Workspace workspace, Set<Role> roles, String status, String department, LocalDateTime lastActiveAt, boolean isEmailVerified, LocalDateTime createdAt) {
        this.id = id;
        this.email = email;
        this.password = password;
        this.fullName = fullName;
        this.designation = designation;
        this.bio = bio;
        this.profileImage = profileImage;
        this.phone = phone;
        this.workspace = workspace;
        this.roles = roles != null ? roles : new HashSet<>();
        this.status = status != null ? status : "ACTIVE";
        this.department = department;
        this.lastActiveAt = lastActiveAt;
        this.isEmailVerified = isEmailVerified;
        this.createdAt = createdAt;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getDesignation() { return designation; }
    public void setDesignation(String designation) { this.designation = designation; }

    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }

    public String getProfileImage() { return profileImage; }
    public void setProfileImage(String profileImage) { this.profileImage = profileImage; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Workspace getWorkspace() { return workspace; }
    public void setWorkspace(Workspace workspace) { this.workspace = workspace; }

    public Set<Role> getRoles() { return roles; }
    public void setRoles(Set<Role> roles) { this.roles = roles; }

    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }

    public LocalDateTime getLastActiveAt() { return lastActiveAt; }
    public void setLastActiveAt(LocalDateTime lastActiveAt) { this.lastActiveAt = lastActiveAt; }

    public boolean isEmailVerified() { return isEmailVerified; }
    public void setEmailVerified(boolean emailVerified) { isEmailVerified = emailVerified; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    // Builder
    public static UserBuilder builder() {
        return new UserBuilder();
    }

    public static class UserBuilder {
        private Long id;
        private String email;
        private String password;
        private String fullName;
        private String designation;
        private String bio;
        private String profileImage;
        private String phone;
        private String status = "ACTIVE";
        private Workspace workspace;
        private Set<Role> roles = new HashSet<>();
        private String department;
        private LocalDateTime lastActiveAt;
        private boolean isEmailVerified = false;
        private LocalDateTime createdAt;

        UserBuilder() {}

        public UserBuilder id(Long id) { this.id = id; return this; }
        public UserBuilder email(String email) { this.email = email; return this; }
        public UserBuilder password(String password) { this.password = password; return this; }
        public UserBuilder fullName(String fullName) { this.fullName = fullName; return this; }
        public UserBuilder designation(String designation) { this.designation = designation; return this; }
        public UserBuilder bio(String bio) { this.bio = bio; return this; }
        public UserBuilder profileImage(String profileImage) { this.profileImage = profileImage; return this; }
        public UserBuilder phone(String phone) { this.phone = phone; return this; }
        public UserBuilder status(String status) { this.status = status; return this; }
        public UserBuilder workspace(Workspace workspace) { this.workspace = workspace; return this; }
        public UserBuilder roles(Set<Role> roles) { this.roles = roles; return this; }
        public UserBuilder department(String department) { this.department = department; return this; }
        public UserBuilder lastActiveAt(LocalDateTime lastActiveAt) { this.lastActiveAt = lastActiveAt; return this; }
        public UserBuilder isEmailVerified(boolean isEmailVerified) { this.isEmailVerified = isEmailVerified; return this; }
        public UserBuilder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }

        public User build() {
            return new User(id, email, password, fullName, designation, bio, profileImage, phone, workspace, roles, status, department, lastActiveAt, isEmailVerified, createdAt);
        }
    }
}
