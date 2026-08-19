using LeadGrowth.Data;
using LeadGrowth.DTOs;
using LeadGrowth.Models;
using LeadGrowth.Security;
using Microsoft.EntityFrameworkCore;

namespace LeadGrowth.Services;

public class WorkspaceService : IWorkspaceService
{
    private readonly LeadGrowthDbContext _context;
    private readonly IJwtService _jwtService;

    public WorkspaceService(LeadGrowthDbContext context, IJwtService jwtService)
    {
        _context = context;
        _jwtService = jwtService;
    }

    public async Task<AuthResponse> CreateWorkspaceAsync(CreateWorkspaceRequest request, string userEmail)
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

        if (user.Workspace != null)
        {
            throw new InvalidOperationException("User is already a member of a workspace");
        }

        var baseSlug = request.Name.ToLower()
            .Replace(" ", "-");
        var slug = baseSlug;
        int count = 1;
        while (await _context.Workspaces.AnyAsync(w => w.Slug == slug))
        {
            slug = $"{baseSlug}-{count++}";
        }

        var inviteCode = GenerateInviteCode();
        while (await _context.Workspaces.AnyAsync(w => w.InviteCode == inviteCode))
        {
            inviteCode = GenerateInviteCode();
        }

        var workspace = new Workspace
        {
            Name = request.Name,
            CompanyName = request.CompanyName ?? request.Name,
            Industry = request.Industry,
            TeamSize = request.TeamSize ?? 1,
            Website = request.Website,
            Timezone = request.Timezone ?? "UTC",
            InviteCode = inviteCode,
            Slug = slug,
            SubscriptionPlan = "PROFESSIONAL",
            MaxUsers = 25,
            MaxLeads = 10000,
            MaxStorageMb = 5000,
            CreatedAt = DateTime.UtcNow
        };

        _context.Workspaces.Add(workspace);
        await _context.SaveChangesAsync();

        user.WorkspaceId = workspace.Id;
        user.Workspace = workspace;

        var adminRole = await _context.Roles.FirstOrDefaultAsync(r => r.Name == "ROLE_ADMIN");
        if (adminRole == null)
        {
            adminRole = new Role { Name = "ROLE_ADMIN" };
            _context.Roles.Add(adminRole);
            await _context.SaveChangesAsync();
        }

        user.Roles.Add(adminRole);
        await _context.SaveChangesAsync();

        var jwtToken = _jwtService.GenerateToken(user);
        var roles = user.Roles.Select(r => r.Name).ToHashSet();

        return new AuthResponse
        {
            Token = jwtToken,
            UserId = user.Id,
            Email = user.Email,
            FullName = user.FullName,
            Roles = roles,
            WorkspaceId = workspace.Id,
            WorkspaceName = workspace.Name,
            WorkspaceSlug = workspace.Slug,
            InviteCode = workspace.InviteCode,
            AvailabilityStatus = user.AvailabilityStatus
        };
    }

    public async Task<AuthResponse> JoinWorkspaceAsync(JoinWorkspaceRequest request, string userEmail)
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

        if (user.Workspace != null)
        {
            throw new InvalidOperationException("User is already a member of a workspace");
        }

        var cleanCode = request.InviteCode?.Trim();
        if (string.IsNullOrWhiteSpace(cleanCode))
        {
            throw new ArgumentException("Invite code cannot be empty");
        }

        var workspace = await _context.Workspaces.FirstOrDefaultAsync(w => 
            w.InviteCode == cleanCode || 
            w.InviteCode.ToLower() == cleanCode.ToLower());

        if (workspace == null)
        {
            throw new ArgumentException("Invalid workspace invite code. Please check with your administrator.");
        }

        var userRole = await _context.Roles.FirstOrDefaultAsync(r => r.Name == "ROLE_USER");
        if (userRole == null)
        {
            userRole = new Role { Name = "ROLE_USER" };
            _context.Roles.Add(userRole);
            await _context.SaveChangesAsync();
        }

        user.WorkspaceId = workspace.Id;
        user.Workspace = workspace;
        user.Roles.Add(userRole);
        await _context.SaveChangesAsync();

        var jwtToken = _jwtService.GenerateToken(user);
        var roles = user.Roles.Select(r => r.Name).ToHashSet();

        return new AuthResponse
        {
            Token = jwtToken,
            UserId = user.Id,
            Email = user.Email,
            FullName = user.FullName,
            Roles = roles,
            WorkspaceId = workspace.Id,
            WorkspaceName = workspace.Name,
            WorkspaceSlug = workspace.Slug,
            InviteCode = workspace.InviteCode,
            AvailabilityStatus = user.AvailabilityStatus
        };
    }

    public async Task<Workspace> GetCurrentWorkspaceAsync(string userEmail)
    {
        var email = userEmail.Trim().ToLower();
        var user = await _context.Users
            .Include(u => u.Workspace)
            .FirstOrDefaultAsync(u => u.Email == email);

        if (user == null)
        {
            throw new KeyNotFoundException("User not found");
        }

        if (user.Workspace == null)
        {
            throw new InvalidOperationException("User does not belong to a workspace");
        }

        return user.Workspace;
    }

    public async Task<Workspace> UpdateWorkspaceAsync(WorkspaceUpdateRequest request, string userEmail)
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

        bool isAdmin = user.Roles.Any(r => r.Name == "ROLE_ADMIN");
        if (!isAdmin)
        {
            throw new InvalidOperationException("Only administrators can update the workspace");
        }

        var workspace = user.Workspace;
        if (workspace == null)
        {
            throw new InvalidOperationException("User does not belong to a workspace");
        }

        if (!string.Equals(workspace.InviteCode, request.InviteCode, StringComparison.OrdinalIgnoreCase))
        {
            if (await _context.Workspaces.AnyAsync(w => w.InviteCode == request.InviteCode))
            {
                throw new ArgumentException("Invite code is already in use");
            }
        }

        if (!string.Equals(workspace.Slug, request.Slug, StringComparison.OrdinalIgnoreCase))
        {
            if (await _context.Workspaces.AnyAsync(w => w.Slug == request.Slug))
            {
                throw new ArgumentException("URL slug is already in use");
            }
        }

        workspace.Name = request.Name;
        workspace.CompanyName = request.CompanyName;
        workspace.Industry = request.Industry;
        workspace.TeamSize = request.TeamSize;
        workspace.Website = request.Website;
        workspace.Timezone = request.Timezone;
        workspace.InviteCode = request.InviteCode;
        workspace.Slug = request.Slug;

        await _context.SaveChangesAsync();
        return workspace;
    }

    public async Task DeleteWorkspaceAsync(string userEmail)
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

        bool isAdmin = user.Roles.Any(r => r.Name == "ROLE_ADMIN");
        if (!isAdmin)
        {
            throw new InvalidOperationException("Only administrators can delete the workspace");
        }

        var workspace = user.Workspace;
        if (workspace == null)
        {
            throw new InvalidOperationException("User does not belong to a workspace");
        }

        var workspaceId = workspace.Id;

        // Delete cascade data in correct FK order
        var tasks = await _context.Tasks.Where(t => t.WorkspaceId == workspaceId).ToListAsync();
        _context.Tasks.RemoveRange(tasks);

        var leadNotes = await _context.LeadNotes.Where(n => n.Lead.WorkspaceId == workspaceId).ToListAsync();
        _context.LeadNotes.RemoveRange(leadNotes);

        var leads = await _context.Leads.Where(l => l.WorkspaceId == workspaceId).ToListAsync();
        _context.Leads.RemoveRange(leads);

        var adMetrics = await _context.AdMetrics.Where(a => a.WorkspaceId == workspaceId).ToListAsync();
        _context.AdMetrics.RemoveRange(adMetrics);

        var campaigns = await _context.Campaigns.Where(c => c.WorkspaceId == workspaceId).ToListAsync();
        _context.Campaigns.RemoveRange(campaigns);

        var reports = await _context.Reports.Where(r => r.WorkspaceId == workspaceId).ToListAsync();
        _context.Reports.RemoveRange(reports);

        var syncLogs = await _context.SyncLogs.Where(s => s.WorkspaceId == workspaceId).ToListAsync();
        _context.SyncLogs.RemoveRange(syncLogs);

        var integrations = await _context.Integrations.Where(i => i.WorkspaceId == workspaceId).ToListAsync();
        _context.Integrations.RemoveRange(integrations);

        var activityLogs = await _context.ActivityLogs.Where(a => a.WorkspaceId == workspaceId).ToListAsync();
        _context.ActivityLogs.RemoveRange(activityLogs);

        var members = await _context.Users
            .Include(u => u.Roles)
            .Where(u => u.WorkspaceId == workspaceId)
            .ToListAsync();

        foreach (var member in members)
        {
            var notifications = await _context.Notifications.Where(n => n.UserId == member.Id).ToListAsync();
            _context.Notifications.RemoveRange(notifications);
            member.WorkspaceId = null;
            member.Workspace = null;
            member.Roles.Clear();
        }

        _context.Workspaces.Remove(workspace);
        await _context.SaveChangesAsync();
    }

    private static string GenerateInviteCode()
    {
        const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        var random = new Random();
        var code = new char[6];
        for (int i = 0; i < 6; i++)
        {
            code[i] = chars[random.Next(chars.Length)];
        }
        return "LG-" + new string(code);
    }
}
