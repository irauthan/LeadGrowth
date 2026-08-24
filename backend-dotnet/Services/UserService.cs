using LeadGrowth.Data;
using LeadGrowth.DTOs;
using LeadGrowth.Models;
using LeadGrowth.Security;
using Microsoft.EntityFrameworkCore;

namespace LeadGrowth.Services;

public class UserService : IUserService
{
    private readonly LeadGrowthDbContext _context;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IWebHostEnvironment _env;

    public UserService(
        LeadGrowthDbContext context, 
        IPasswordHasher passwordHasher,
        IWebHostEnvironment env)
    {
        _context = context;
        _passwordHasher = passwordHasher;
        _env = env;
    }

    private async Task<string?> ProcessProfileImageAsync(string? rawImage, long userId)
    {
        if (string.IsNullOrWhiteSpace(rawImage))
        {
            return rawImage;
        }

        if (!rawImage.StartsWith("data:image/", StringComparison.OrdinalIgnoreCase))
        {
            return rawImage;
        }

        try
        {
            var commaIndex = rawImage.IndexOf(',');
            if (commaIndex == -1) return rawImage;

            var header = rawImage.Substring(0, commaIndex);
            var base64Data = rawImage.Substring(commaIndex + 1);

            string extension = ".jpg";
            if (header.Contains("png", StringComparison.OrdinalIgnoreCase)) extension = ".png";
            else if (header.Contains("webp", StringComparison.OrdinalIgnoreCase)) extension = ".webp";
            else if (header.Contains("gif", StringComparison.OrdinalIgnoreCase)) extension = ".gif";

            var bytes = Convert.FromBase64String(base64Data);

            var webRoot = _env.WebRootPath;
            if (string.IsNullOrEmpty(webRoot))
            {
                webRoot = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
            }
            var uploadsDir = Path.Combine(webRoot, "uploads", "avatars");

            if (!Directory.Exists(uploadsDir))
            {
                Directory.CreateDirectory(uploadsDir);
            }

            var fileName = $"avatar_{userId}_{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}{extension}";
            var filePath = Path.Combine(uploadsDir, fileName);

            await File.WriteAllBytesAsync(filePath, bytes);

            return $"/uploads/avatars/{fileName}";
        }
        catch
        {
            return rawImage;
        }
    }

    public async Task<User> UpdateProfileAsync(UserProfileRequest request, string userEmail)
    {
        var email = userEmail.Trim().ToLower();
        var user = await _context.Users
            .Include(u => u.Workspace)
            .Include(u => u.Roles)
            .FirstOrDefaultAsync(u => u.Email == email);

        if (user == null)
        {
            throw new KeyNotFoundException("User not found");
        }

        user.FullName = request.FullName;
        user.Phone = request.Phone;
        user.Designation = request.Designation;
        user.Bio = request.Bio;
        user.Department = request.Department;

        if (request.ProfileImage != null)
        {
            user.ProfileImage = await ProcessProfileImageAsync(request.ProfileImage, user.Id);
        }

        await _context.SaveChangesAsync();
        return user;
    }

    public async Task ChangePasswordAsync(PasswordChangeRequest request, string userEmail)
    {
        var email = userEmail.Trim().ToLower();
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
        if (user == null)
        {
            throw new KeyNotFoundException("User not found");
        }

        if (!_passwordHasher.VerifyPassword(request.OldPassword, user.Password))
        {
            throw new ArgumentException("Incorrect old password");
        }

        if (!string.Equals(request.NewPassword, request.ConfirmPassword))
        {
            throw new ArgumentException("New passwords do not match");
        }

        user.Password = _passwordHasher.HashPassword(request.NewPassword);
        await _context.SaveChangesAsync();
    }

    public async Task<List<User>> GetWorkspaceMembersAsync(string userEmail)
    {
        var email = userEmail.Trim().ToLower();
        var user = await _context.Users
            .Include(u => u.Workspace)
            .FirstOrDefaultAsync(u => u.Email == email);

        if (user == null)
        {
            throw new KeyNotFoundException("User not found");
        }

        if (user.WorkspaceId == null)
        {
            throw new InvalidOperationException("User does not belong to a workspace");
        }

        return await _context.Users
            .Include(u => u.Roles)
            .Include(u => u.Workspace)
            .Where(u => u.WorkspaceId == user.WorkspaceId)
            .ToListAsync();
    }

    public async Task<List<User>> GetAssignableUsersAsync(string userEmail)
    {
        var members = await GetWorkspaceMembersAsync(userEmail);
        return members
            .Where(u => !string.Equals("SUSPENDED", u.Status, StringComparison.OrdinalIgnoreCase))
            .Where(u => !u.Roles.Any(r => r.Name.Contains("ADMIN", StringComparison.OrdinalIgnoreCase)))
            .ToList();
    }

    public async Task<Invitation> InviteUserAsync(UserInviteRequest request, string inviterEmail)
    {
        var email = inviterEmail.Trim().ToLower();
        var inviter = await _context.Users
            .Include(u => u.Workspace)
            .Include(u => u.Roles)
            .FirstOrDefaultAsync(u => u.Email == email);

        if (inviter == null)
        {
            throw new KeyNotFoundException("Inviter not found");
        }

        var workspace = inviter.Workspace;
        if (workspace == null)
        {
            throw new InvalidOperationException("Inviter does not belong to a workspace");
        }

        bool isAdmin = inviter.Roles.Any(r => r.Name == "ROLE_ADMIN");
        bool isManager = inviter.Roles.Any(r => r.Name == "ROLE_MANAGER");

        if (!isAdmin && !isManager)
        {
            throw new InvalidOperationException("Unauthorized to send invitations");
        }

        if (isManager && !string.Equals("USER", request.Role, StringComparison.OrdinalIgnoreCase))
        {
            throw new ArgumentException("Managers are only permitted to invite Users");
        }

        var targetRoleName = "ROLE_" + request.Role.ToUpper();
        var role = await _context.Roles.FirstOrDefaultAsync(r => r.Name == targetRoleName);
        if (role == null)
        {
            throw new ArgumentException($"Invalid role: {targetRoleName}");
        }

        var inviteEmail = request.Email.Trim().ToLower();
        var existingUser = await _context.Users.FirstOrDefaultAsync(u => u.Email == inviteEmail);
        if (existingUser != null && existingUser.WorkspaceId != null)
        {
            throw new ArgumentException($"User with email {request.Email} is already a member of a workspace.");
        }

        var token = Guid.NewGuid().ToString();
        var invitation = new Invitation
        {
            Email = inviteEmail,
            Role = targetRoleName.Replace("ROLE_", ""),
            Token = token,
            WorkspaceId = workspace.Id,
            Workspace = workspace,
            Status = "PENDING",
            ExpiryDate = DateTime.UtcNow.AddDays(7),
            InvitedById = inviter.Id,
            InvitedBy = inviter,
            CreatedAt = DateTime.UtcNow
        };

        _context.WorkspaceInvites.Add(invitation);

        var log = new ActivityLog
        {
            WorkspaceId = workspace.Id,
            Workspace = workspace,
            UserId = inviter.Id,
            User = inviter,
            Action = "MEMBER_INVITE",
            Description = $"Invited {request.Email} as {invitation.Role}",
            CreatedAt = DateTime.UtcNow
        };
        _context.ActivityLogs.Add(log);

        await _context.SaveChangesAsync();
        return invitation;
    }

    public async Task<User> UpdateUserRoleAsync(long userId, string roleName, string adminEmail)
    {
        var email = adminEmail.Trim().ToLower();
        var admin = await _context.Users
            .Include(u => u.Workspace)
            .Include(u => u.Roles)
            .FirstOrDefaultAsync(u => u.Email == email);

        if (admin == null)
        {
            throw new KeyNotFoundException("Admin not found");
        }

        bool isAdmin = admin.Roles.Any(r => r.Name == "ROLE_ADMIN");
        if (!isAdmin)
        {
            throw new InvalidOperationException("Only administrators can change user roles");
        }

        var targetUser = await _context.Users
            .Include(u => u.Roles)
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (targetUser == null)
        {
            throw new ArgumentException("User not found");
        }

        if (targetUser.Id == admin.Id)
        {
            throw new ArgumentException("You cannot change your own role");
        }

        if (targetUser.WorkspaceId != admin.WorkspaceId)
        {
            throw new ArgumentException("User does not belong to your workspace");
        }

        var targetRoleName = "ROLE_" + roleName.ToUpper();
        var newRole = await _context.Roles.FirstOrDefaultAsync(r => r.Name == targetRoleName);
        if (newRole == null)
        {
            newRole = new Role { Name = targetRoleName };
            _context.Roles.Add(newRole);
            await _context.SaveChangesAsync();
        }

        targetUser.Roles.Clear();
        targetUser.Roles.Add(newRole);
        await _context.SaveChangesAsync();

        return targetUser;
    }

    public async Task<User> UpdateUserStatusAsync(long userId, string status, string actorEmail)
    {
        var email = actorEmail.Trim().ToLower();
        var actor = await _context.Users
            .Include(u => u.Workspace)
            .Include(u => u.Roles)
            .FirstOrDefaultAsync(u => u.Email == email);

        if (actor == null)
        {
            throw new KeyNotFoundException("User not found");
        }

        bool actorIsAdmin = actor.Roles.Any(r => r.Name == "ROLE_ADMIN");
        bool actorIsManager = actor.Roles.Any(r => r.Name == "ROLE_MANAGER");

        if (!actorIsAdmin && !actorIsManager)
        {
            throw new InvalidOperationException("Only administrators or managers can suspend/reactivate accounts");
        }

        var targetUser = await _context.Users
            .Include(u => u.Roles)
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (targetUser == null)
        {
            throw new ArgumentException("User not found");
        }

        if (targetUser.Id == actor.Id)
        {
            throw new ArgumentException("You cannot suspend your own account");
        }

        if (targetUser.WorkspaceId != actor.WorkspaceId)
        {
            throw new ArgumentException("User does not belong to your workspace");
        }

        bool targetIsAdmin = targetUser.Roles.Any(r => r.Name == "ROLE_ADMIN");
        if (actorIsManager && targetIsAdmin)
        {
            throw new InvalidOperationException("Managers are not authorized to suspend Administrator accounts");
        }

        var targetStatus = status.ToUpper();
        if (!string.Equals("ACTIVE", targetStatus) && !string.Equals("SUSPENDED", targetStatus))
        {
            throw new ArgumentException($"Invalid status: {status}");
        }

        targetUser.Status = targetStatus;
        await _context.SaveChangesAsync();
        return targetUser;
    }

    public async Task<User> EditUserDetailsAsync(long userId, UserProfileRequest request, string inviterEmail)
    {
        var email = inviterEmail.Trim().ToLower();
        var actor = await _context.Users
            .Include(u => u.Workspace)
            .Include(u => u.Roles)
            .FirstOrDefaultAsync(u => u.Email == email);

        if (actor == null)
        {
            throw new KeyNotFoundException("Actor not found");
        }

        var targetUser = await _context.Users
            .Include(u => u.Roles)
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (targetUser == null)
        {
            throw new ArgumentException("User not found");
        }

        if (targetUser.WorkspaceId != actor.WorkspaceId)
        {
            throw new ArgumentException("User does not belong to your workspace");
        }

        bool actorIsAdmin = actor.Roles.Any(r => r.Name == "ROLE_ADMIN");
        bool actorIsManager = actor.Roles.Any(r => r.Name == "ROLE_MANAGER");

        if (!actorIsAdmin && !actorIsManager)
        {
            throw new InvalidOperationException("Unauthorized to edit team member details");
        }

        bool targetIsAdmin = targetUser.Roles.Any(r => r.Name == "ROLE_ADMIN");
        if (actorIsManager && targetIsAdmin)
        {
            throw new InvalidOperationException("Managers are not authorized to edit Administrator accounts");
        }

        targetUser.FullName = request.FullName;
        targetUser.Phone = request.Phone;
        targetUser.Designation = request.Designation;
        targetUser.Bio = request.Bio;
        targetUser.Department = request.Department;
        if (request.ProfileImage != null)
        {
            targetUser.ProfileImage = await ProcessProfileImageAsync(request.ProfileImage, targetUser.Id);
        }

        await _context.SaveChangesAsync();
        return targetUser;
    }

    public async Task DeleteUserAsync(long userId, string adminEmail)
    {
        var email = adminEmail.Trim().ToLower();
        var admin = await _context.Users
            .Include(u => u.Workspace)
            .Include(u => u.Roles)
            .FirstOrDefaultAsync(u => u.Email == email);

        if (admin == null)
        {
            throw new KeyNotFoundException("Actor not found");
        }

        bool isAdmin = admin.Roles.Any(r => r.Name == "ROLE_ADMIN");
        if (!isAdmin)
        {
            throw new InvalidOperationException("Only administrators can remove users");
        }

        var targetUser = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
        if (targetUser == null)
        {
            throw new ArgumentException("User not found");
        }

        if (targetUser.Id == admin.Id)
        {
            throw new ArgumentException("You cannot remove yourself");
        }

        if (targetUser.WorkspaceId != admin.WorkspaceId)
        {
            throw new ArgumentException("User does not belong to your workspace");
        }

        _context.Users.Remove(targetUser);
        await _context.SaveChangesAsync();
    }

    public async Task<User> ResetUserPasswordAsync(long userId, string newPassword, string adminEmail)
    {
        var email = adminEmail.Trim().ToLower();
        var admin = await _context.Users
            .Include(u => u.Workspace)
            .Include(u => u.Roles)
            .FirstOrDefaultAsync(u => u.Email == email);

        if (admin == null)
        {
            throw new KeyNotFoundException("Admin not found");
        }

        bool isAdmin = admin.Roles.Any(r => r.Name == "ROLE_ADMIN");
        if (!isAdmin)
        {
            throw new InvalidOperationException("Only administrators can reset passwords");
        }

        var targetUser = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
        if (targetUser == null)
        {
            throw new ArgumentException("User not found");
        }

        if (targetUser.WorkspaceId != admin.WorkspaceId)
        {
            throw new ArgumentException("User does not belong to your workspace");
        }

        targetUser.Password = _passwordHasher.HashPassword(newPassword);
        await _context.SaveChangesAsync();
        return targetUser;
    }

    public async Task<Workspace> TransferWorkspaceOwnershipAsync(long newOwnerId, string adminEmail)
    {
        var email = adminEmail.Trim().ToLower();
        var admin = await _context.Users
            .Include(u => u.Workspace)
            .Include(u => u.Roles)
            .FirstOrDefaultAsync(u => u.Email == email);

        if (admin == null)
        {
            throw new KeyNotFoundException("Admin not found");
        }

        bool isAdmin = admin.Roles.Any(r => r.Name == "ROLE_ADMIN");
        if (!isAdmin)
        {
            throw new InvalidOperationException("Only the workspace administrator can transfer ownership");
        }

        var targetUser = await _context.Users
            .Include(u => u.Roles)
            .FirstOrDefaultAsync(u => u.Id == newOwnerId);

        if (targetUser == null)
        {
            throw new ArgumentException("Target user not found");
        }

        if (targetUser.WorkspaceId != admin.WorkspaceId)
        {
            throw new ArgumentException("Target user must belong to your workspace");
        }

        if (string.Equals("SUSPENDED", targetUser.Status, StringComparison.OrdinalIgnoreCase))
        {
            throw new ArgumentException("Cannot transfer ownership to a suspended user");
        }

        var adminRole = await _context.Roles.FirstOrDefaultAsync(r => r.Name == "ROLE_ADMIN");
        var managerRole = await _context.Roles.FirstOrDefaultAsync(r => r.Name == "ROLE_MANAGER");

        if (adminRole == null || managerRole == null)
        {
            throw new InvalidOperationException("Roles not seeded properly");
        }

        admin.Roles.Clear();
        admin.Roles.Add(managerRole);

        targetUser.Roles.Clear();
        targetUser.Roles.Add(adminRole);

        await _context.SaveChangesAsync();
        return admin.Workspace!;
    }

    public async Task<User> UpdateAvailabilityStatusAsync(string availabilityStatus, string email)
    {
        var userEmail = email.Trim().ToLower();
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == userEmail);
        if (user == null)
        {
            throw new KeyNotFoundException("User not found");
        }

        var status = availabilityStatus.ToUpper();
        var validStatuses = new[] { "AVAILABLE", "BUSY", "ON_BREAK", "OFFLINE", "ON_LEAVE" };
        if (!validStatuses.Contains(status))
        {
            throw new ArgumentException($"Invalid availability status: {availabilityStatus}");
        }

        user.AvailabilityStatus = status;
        user.LastActiveAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return user;
    }
}
