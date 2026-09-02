using System.ComponentModel.DataAnnotations;

namespace LeadGrowth.DTOs;

public class LeadImportRowDto
{
    public int RowNumber { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? Company { get; set; }
    public string? SourcePlatform { get; set; }
    public string? CampaignName { get; set; }
    public string? Priority { get; set; }
    public string? Status { get; set; }
    public string? Location { get; set; }
    public double? ProposalAmount { get; set; }
    public string? ClientNotes { get; set; }

    public bool IsValid { get; set; } = true;
    public List<string> ValidationErrors { get; set; } = new();
    public bool IsDuplicate { get; set; }
    public string? DuplicateReason { get; set; }
    public long? ExistingLeadId { get; set; }
}

public class LeadImportPreviewResponse
{
    public int TotalRows { get; set; }
    public int ValidRows { get; set; }
    public int DuplicateRows { get; set; }
    public int InvalidRows { get; set; }
    public List<string> DetectedColumns { get; set; } = new();
    public Dictionary<string, string> ColumnMappings { get; set; } = new();
    public List<LeadImportRowDto> Rows { get; set; } = new();
}

public class LeadImportExecuteRequest
{
    public List<LeadImportRowDto> Rows { get; set; } = new();

    // Assignment strategy: "ME", "SPECIFIC", "AUTO", "UNASSIGNED"
    public string AssignmentStrategy { get; set; } = "AUTO";
    public long? AssignedToId { get; set; }

    // Duplicate strategy: "SKIP", "UPDATE", "ALLOW"
    public string DuplicateStrategy { get; set; } = "SKIP";

    public string DefaultSourcePlatform { get; set; } = "Excel Intake";
    public string DefaultPriority { get; set; } = "MEDIUM";
    public string DefaultStatus { get; set; } = "New";
    public long? CampaignId { get; set; }
}

public class LeadImportResultDto
{
    public bool Success { get; set; }
    public int TotalProcessed { get; set; }
    public int ImportedCount { get; set; }
    public int UpdatedCount { get; set; }
    public int SkippedCount { get; set; }
    public int ErrorCount { get; set; }
    public List<string> Messages { get; set; } = new();
    public List<long> CreatedLeadIds { get; set; } = new();
}
