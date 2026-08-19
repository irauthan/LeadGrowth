using System.ComponentModel.DataAnnotations;

namespace LeadGrowth.DTOs;

public class LoginRequest
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    public string Password { get; set; } = string.Empty;

    public bool RememberMe { get; set; } = false;
}

public class RegisterRequest
{
    [Required]
    public string FullName { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    public string? Phone { get; set; }

    [Required]
    [MinLength(6)]
    public string Password { get; set; } = string.Empty;

    public string ConfirmPassword { get; set; } = string.Empty;

    // "CREATE" or "JOIN"
    public string WorkspaceAction { get; set; } = "CREATE";

    public string? WorkspaceName { get; set; }

    public string? CompanyName { get; set; }

    public string? InviteCode { get; set; }
}

public class RegisterInvitedRequest
{
    [Required]
    public string Token { get; set; } = string.Empty;

    [Required]
    public string FullName { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    public string? Phone { get; set; }

    [Required]
    [MinLength(6)]
    public string Password { get; set; } = string.Empty;

    public string ConfirmPassword { get; set; } = string.Empty;
}

public class RefreshTokenRequest
{
    [Required]
    public string RefreshToken { get; set; } = string.Empty;
}

public class PasswordResetRequest
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;
}

public class PasswordResetConfirmRequest
{
    [Required]
    public string Token { get; set; } = string.Empty;

    [Required]
    [MinLength(6)]
    public string NewPassword { get; set; } = string.Empty;

    public string ConfirmPassword { get; set; } = string.Empty;
}

public class AuthResponse
{
    public string Token { get; set; } = string.Empty;
    public string RefreshToken { get; set; } = string.Empty;
    public string Type { get; set; } = "Bearer";
    public long UserId { get; set; }
    public long Id => UserId;
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? Designation { get; set; }
    public string? Bio { get; set; }
    public string? ProfileImage { get; set; }
    public string? Phone { get; set; }
    public string Status { get; set; } = "ACTIVE";
    public HashSet<string> Roles { get; set; } = new();
    public long? WorkspaceId { get; set; }
    public string? WorkspaceName { get; set; }
    public string? WorkspaceSlug { get; set; }
    public string? InviteCode { get; set; }
    public string AvailabilityStatus { get; set; } = "AVAILABLE";
}

public class UserSessionDto
{
    public long Id { get; set; }
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
    public DateTime LoginTime { get; set; }
    public DateTime LastActiveTime { get; set; }
    public bool IsExpired { get; set; }
}
