package com.leadgrowth.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "lead_notes")
public class LeadNote {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lead_id", nullable = false)
    private Lead lead;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String note;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    // Constructors
    public LeadNote() {}

    public LeadNote(Long id, Lead lead, User user, String note, LocalDateTime createdAt) {
        this.id = id;
        this.lead = lead;
        this.user = user;
        this.note = note;
        this.createdAt = createdAt;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Lead getLead() { return lead; }
    public void setLead(Lead lead) { this.lead = lead; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    // Builder
    public static LeadNoteBuilder builder() {
        return new LeadNoteBuilder();
    }

    public static class LeadNoteBuilder {
        private Long id;
        private Lead lead;
        private User user;
        private String note;
        private LocalDateTime createdAt;

        LeadNoteBuilder() {}

        public LeadNoteBuilder id(Long id) { this.id = id; return this; }
        public LeadNoteBuilder lead(Lead lead) { this.lead = lead; return this; }
        public LeadNoteBuilder user(User user) { this.user = user; return this; }
        public LeadNoteBuilder note(String note) { this.note = note; return this; }
        public LeadNoteBuilder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }

        public LeadNote build() {
            return new LeadNote(id, lead, user, note, createdAt);
        }
    }
}
