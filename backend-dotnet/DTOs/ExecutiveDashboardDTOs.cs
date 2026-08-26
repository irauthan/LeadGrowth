namespace LeadGrowth.DTOs;

public class DashboardKpis
{
    public int TotalLeads { get; set; }
    public int ConvertedLeads { get; set; }
    public int TotalConversions { get; set; }
    public double ConversionRate { get; set; }
    public decimal TotalRevenue { get; set; }
    public decimal TotalSpend { get; set; }
    public decimal ActiveBudget { get; set; }
    public double Roas { get; set; }
    public double Cpc { get; set; }
    public double Ctr { get; set; }
    public int ActiveCampaigns { get; set; }
    public int ActiveUsers { get; set; }
    public List<LeadDto> RecentLeads { get; set; } = new();
    public Dictionary<string, int> Funnel { get; set; } = new();
    public List<Dictionary<string, object>> Trends { get; set; } = new();
}

public class SearchResultDto
{
    public long Id { get; set; }
    public string Type { get; set; } = "LEAD"; // LEAD, TASK, CAMPAIGN, USER
    public string Title { get; set; } = string.Empty;
    public string Subtitle { get; set; } = string.Empty;
    public string? Url { get; set; }
}

public class ExecutiveWorkSummaryDto
{
    public long UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string UserEmail { get; set; } = string.Empty;
    public string UserRole { get; set; } = string.Empty;
    public string? ProfileImage { get; set; }
    public string Timeframe { get; set; } = string.Empty;

    public int TotalAssignedLeads { get; set; }
    public int TotalActivitiesLogged { get; set; }
    public int TotalCallsMade { get; set; }
    public int TotalMeetingsHeld { get; set; }
    public int TotalEmailsSent { get; set; }
    public int TotalWhatsappSent { get; set; }
    public int CompletedFollowupsCount { get; set; }
    public int OverdueFollowupsCount { get; set; }
    public int TotalConvertedLeads { get; set; }

    public double ConversionRate { get; set; }
    public double ActivityCompletionRate { get; set; }

    public List<ExecutiveDayBreakdownDto> DailyBreakdown { get; set; } = new();
    public List<ExecutiveLeadWorkDto> LeadWorkList { get; set; } = new();
}

public class ExecutiveDayBreakdownDto
{
    public string Date { get; set; } = string.Empty;
    public string DayOfWeek { get; set; } = string.Empty;
    public int CallsCount { get; set; }
    public int MeetingsCount { get; set; }
    public int EmailsCount { get; set; }
    public int WhatsappCount { get; set; }
    public int TotalActivitiesCount { get; set; }
    public int FollowupsCompletedCount { get; set; }
}

public class ExecutiveLeadWorkDto
{
    public long LeadId { get; set; }
    public string LeadName { get; set; } = string.Empty;
    public string? LeadPhone { get; set; }
    public string LeadStatus { get; set; } = string.Empty;
    public string AssignedToName { get; set; } = string.Empty;
    public int ActivityCount { get; set; }
    public DateTime LastWorkedAt { get; set; }

    public List<ExecutiveActivityLogDto> ActivityLogs { get; set; } = new();
    public List<ExecutiveFollowupDto> Followups { get; set; } = new();
    public List<ExecutiveTimelineHistoryDto> TimelineHistory { get; set; } = new();
}

public class ExecutiveActivityLogDto
{
    public long Id { get; set; }
    public int ActivityNumber { get; set; }
    public string CommunicationType { get; set; } = string.Empty;
    public string Outcome { get; set; } = string.Empty;
    public string? Duration { get; set; }
    public string? Remarks { get; set; }
    public DateTime? CreatedAt { get; set; }
    public string LoggedByName { get; set; } = string.Empty;
}

public class ExecutiveFollowupDto
{
    public long Id { get; set; }
    public string Status { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public DateTime? ScheduledAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public bool IsOverdue { get; set; }
}

public class ExecutiveTimelineHistoryDto
{
    public long Id { get; set; }
    public string Action { get; set; } = string.Empty;
    public string? Details { get; set; }
    public DateTime? CreatedAt { get; set; }
    public string PerformedByName { get; set; } = string.Empty;
}
