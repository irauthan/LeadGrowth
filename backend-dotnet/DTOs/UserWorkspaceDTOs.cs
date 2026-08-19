using System.ComponentModel.DataAnnotations;

namespace LeadGrowth.DTOs;

public class CreateWorkspaceRequest
{
    [Required]
    public string Name { get; set; } = string.Empty;
    public string? CompanyName { get; set; }
    public string? Industry { get; set; }
    public int? TeamSize { get; set; }
    public string? Website { get; set; }
    public string? Timezone { get; set; }
}

public class JoinWorkspaceRequest
{
    [Required]
    public string InviteCode { get; set; } = string.Empty;
}

public class WorkspaceUpdateRequest
{
    [Required]
    public string Name { get; set; } = string.Empty;
    public string? CompanyName { get; set; }
    public string? Industry { get; set; }
    public int TeamSize { get; set; } = 1;
    public string? Website { get; set; }
    public string? Timezone { get; set; }
    [Required]
    public string InviteCode { get; set; } = string.Empty;
    [Required]
    public string Slug { get; set; } = string.Empty;
}

public class UserProfileRequest
{
    [Required]
    public string FullName { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? Designation { get; set; }
    public string? Bio { get; set; }
    public string? Department { get; set; }
    public string? ProfileImage { get; set; }
}

public class PasswordChangeRequest
{
    [Required]
    public string OldPassword { get; set; } = string.Empty;

    [Required]
    [MinLength(6)]
    public string NewPassword { get; set; } = string.Empty;

    public string ConfirmPassword { get; set; } = string.Empty;
}

public class UserInviteRequest
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    public string Role { get; set; } = "USER";
}

public class UserRoleUpdateRequest
{
    [Required]
    public string Role { get; set; } = string.Empty;
}

public class UserStatusUpdateRequest
{
    [Required]
    public string Status { get; set; } = string.Empty;
}

public class TeamProductivityDto
{
    public long UserId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public int CompletedTasks { get; set; }
    public int CompletedLeads { get; set; }
    public double ConversionRate { get; set; }
    public double AverageResponseTime { get; set; }
    public double Score { get; set; }
    public string Category { get; set; } = "Average Performer";
}
