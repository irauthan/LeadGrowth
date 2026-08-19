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
    public string FullName { get; set; } = string.Empty;
    public string? Designation { get; set; }
    public int TotalWorkUnits { get; set; }
    public int CallsCount { get; set; }
    public int TasksCompletedCount { get; set; }
    public int StageUpdatesCount { get; set; }
    public List<ExecutiveDayBreakdownDto> DailyBreakdown { get; set; } = new();
    public List<ExecutiveLeadWorkDto> LeadWork { get; set; } = new();
}

public class ExecutiveDayBreakdownDto
{
    public DateOnly Date { get; set; }
    public int WorkUnits { get; set; }
    public int Calls { get; set; }
    public int TasksCompleted { get; set; }
    public int StageUpdates { get; set; }
}

public class ExecutiveLeadWorkDto
{
    public long LeadId { get; set; }
    public string LeadName { get; set; } = string.Empty;
    public string? Status { get; set; }
    public int ActivityCount { get; set; }
    public DateTime LastWorkedAt { get; set; }
}
