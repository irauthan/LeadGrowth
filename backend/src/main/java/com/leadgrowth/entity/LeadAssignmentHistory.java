package com.leadgrowth.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "lead_assignment_history")
public class LeadAssignmentHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lead_id", nullable = false)
    private Lead lead;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "from_user_id")
    private User fromUser;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "to_user_id", nullable = false)
    private User toUser;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_by_id", nullable = false)
    private User assignedBy;

    @Column(name = "assigned_at", nullable = false)
    private LocalDateTime assignedAt;

    @Column(name = "reason")
    private String reason;

    public LeadAssignmentHistory() {}

    public LeadAssignmentHistory(Lead lead, User fromUser, User toUser, User assignedBy, String reason) {
        this.lead = lead;
        this.fromUser = fromUser;
        this.toUser = toUser;
        this.assignedBy = assignedBy;
        this.reason = reason;
        this.assignedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Lead getLead() { return lead; }
    public void setLead(Lead lead) { this.lead = lead; }

    public User getFromUser() { return fromUser; }
    public void setFromUser(User fromUser) { this.fromUser = fromUser; }

    public User getToUser() { return toUser; }
    public void setToUser(User toUser) { this.toUser = toUser; }

    public User getAssignedBy() { return assignedBy; }
    public void setAssignedBy(User assignedBy) { this.assignedBy = assignedBy; }

    public LocalDateTime getAssignedAt() { return assignedAt; }
    public void setAssignedAt(LocalDateTime assignedAt) { this.assignedAt = assignedAt; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
}
