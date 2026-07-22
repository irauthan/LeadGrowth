package com.leadgrowth.entity;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "user_productivity")
public class UserProductivity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workspace_id", nullable = false)
    private Workspace workspace;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "completed_tasks_count", nullable = false)
    private int completedTasksCount = 0;

    @Column(name = "completed_leads_count", nullable = false)
    private int completedLeadsCount = 0;

    @Column(name = "conversion_rate", nullable = false)
    private double conversionRate = 0.0;

    @Column(name = "average_response_time", nullable = false)
    private double averageResponseTime = 0.0; // In hours

    @Column(name = "productivity_score", nullable = false)
    private double productivityScore = 0.0;

    @Column(name = "record_date", nullable = false)
    private LocalDate date;

    public UserProductivity() {}

    public UserProductivity(Workspace workspace, User user, int completedTasksCount, int completedLeadsCount, double conversionRate, double averageResponseTime, double productivityScore, LocalDate date) {
        this.workspace = workspace;
        this.user = user;
        this.completedTasksCount = completedTasksCount;
        this.completedLeadsCount = completedLeadsCount;
        this.conversionRate = conversionRate;
        this.averageResponseTime = averageResponseTime;
        this.productivityScore = productivityScore;
        this.date = date;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Workspace getWorkspace() { return workspace; }
    public void setWorkspace(Workspace workspace) { this.workspace = workspace; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public int getCompletedTasksCount() { return completedTasksCount; }
    public void setCompletedTasksCount(int completedTasksCount) { this.completedTasksCount = completedTasksCount; }

    public int getCompletedLeadsCount() { return completedLeadsCount; }
    public void setCompletedLeadsCount(int completedLeadsCount) { this.completedLeadsCount = completedLeadsCount; }

    public double getConversionRate() { return conversionRate; }
    public void setConversionRate(double conversionRate) { this.conversionRate = conversionRate; }

    public double getAverageResponseTime() { return averageResponseTime; }
    public void setAverageResponseTime(double averageResponseTime) { this.averageResponseTime = averageResponseTime; }

    public double getProductivityScore() { return productivityScore; }
    public void setProductivityScore(double productivityScore) { this.productivityScore = productivityScore; }

    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }
}
