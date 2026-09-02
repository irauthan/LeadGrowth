using LeadGrowth.Data;
using LeadGrowth.DTOs;
using LeadGrowth.Models;
using LeadGrowth.Security;
using Microsoft.EntityFrameworkCore;

namespace LeadGrowth.Services;

public class AuthService : IAuthService
{
    private readonly LeadGrowthDbContext _context;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtService _jwtService;

    public AuthService(
        LeadGrowthDbContext context,
        IPasswordHasher passwordHasher,
        IJwtService jwtService)
    {
        _context = context;
        _passwordHasher = passwordHasher;
        _jwtService = jwtService;
    }

    public async Task<AuthResponse> RegisterAsync(RegisterRequest request)
    {
        var normalizedEmail = request.Email.Trim().ToLower();

        if (await _context.Users.AnyAsync(u => u.Email == normalizedEmail))
        {
            throw new ArgumentException("Email is already registered");
        }

        if (!string.IsNullOrWhiteSpace(request.ConfirmPassword) && !string.Equals(request.Password, request.ConfirmPassword))
        {
            throw new ArgumentException("Passwords do not match");
        }

        var user = new User
        {
            FullName = request.FullName,
            Email = normalizedEmail,
            Phone = request.Phone,
            Password = _passwordHasher.HashPassword(request.Password),
            Status = "ACTIVE",
            IsEmailVerified = false,
            CreatedAt = DateTime.UtcNow
        };

        if (string.Equals("CREATE", request.WorkspaceAction, StringComparison.OrdinalIgnoreCase))
        {
            var wsName = !string.IsNullOrWhiteSpace(request.WorkspaceName)
                ? request.WorkspaceName
                : $"{request.FullName}'s Workspace";

            var ws = new Workspace
            {
                Name = wsName,
                CompanyName = request.CompanyName,
                InviteCode = "WS-" + Guid.NewGuid().ToString("N")[..8].ToUpper(),
                Slug = wsName.ToLower().Replace(" ", "-") + "-" + Guid.NewGuid().ToString("N")[..4],
                SubscriptionPlan = "PROFESSIONAL",
                MaxUsers = 25,
                MaxLeads = 10000,
                MaxStorageMb = 5000,
                CreatedAt = DateTime.UtcNow
            };

            _context.Workspaces.Add(ws);
            await _context.SaveChangesAsync();

            user.WorkspaceId = ws.Id;
            user.Workspace = ws;

            var adminRole = await _context.Roles.FirstOrDefaultAsync(r => r.Name == "ROLE_ADMIN");
            if (adminRole == null)
            {
                adminRole = new Role { Name = "ROLE_ADMIN" };
                _context.Roles.Add(adminRole);
                await _context.SaveChangesAsync();
            }
            user.Roles.Add(adminRole);
        }
        else if (string.Equals("JOIN", request.WorkspaceAction, StringComparison.OrdinalIgnoreCase))
        {
            var cleanCode = request.InviteCode?.Trim();
            if (string.IsNullOrWhiteSpace(cleanCode))
            {
                throw new ArgumentException("Workspace invite code is required to join");
            }

            var ws = await _context.Workspaces.FirstOrDefaultAsync(w => 
                w.InviteCode == cleanCode || 
                w.InviteCode.ToLower() == cleanCode.ToLower());

            if (ws == null)
            {
                throw new ArgumentException("Invalid workspace invite code");
            }

            user.WorkspaceId = ws.Id;
            user.Workspace = ws;

            var userRole = await _context.Roles.FirstOrDefaultAsync(r => r.Name == "ROLE_USER");
            if (userRole == null)
            {
                userRole = new Role { Name = "ROLE_USER" };
                _context.Roles.Add(userRole);
                await _context.SaveChangesAsync();
            }
            user.Roles.Add(userRole);
        }

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var session = new UserSession
        {
            UserId = user.Id,
            IpAddress = "127.0.0.1",
            UserAgent = "Browser - Signup Flow",
            LoginTime = DateTime.UtcNow,
            LastActiveTime = DateTime.UtcNow,
            IsExpired = false
        };
        _context.UserSessions.Add(session);
        await _context.SaveChangesAsync();

        var jwtToken = _jwtService.GenerateToken(user);
        var refToken = await CreateRefreshTokenAsync(user, false);

        return BuildAuthResponse(user, jwtToken, refToken);
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request, string ipAddress, string userAgent)
    {
        var normalizedEmail = request.Email.Trim().ToLower();
        var user = await _context.Users
            .Include(u => u.Workspace)
            .Include(u => u.Roles)
            .FirstOrDefaultAsync(u => u.Email == normalizedEmail);

        if (user == null || !_passwordHasher.VerifyPassword(request.Password, user.Password))
        {
            throw new UnauthorizedAccessException("Invalid credentials");
        }

        if (string.Equals("SUSPENDED", user.Status, StringComparison.OrdinalIgnoreCase))
        {
            throw new ArgumentException("Your account has been suspended. Please contact your workspace administrator.");
        }

        user.LastActiveAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        var session = new UserSession
        {
            UserId = user.Id,
            IpAddress = ipAddress,
            UserAgent = userAgent,
            LoginTime = DateTime.UtcNow,
            LastActiveTime = DateTime.UtcNow,
            IsExpired = false
        };
        _context.UserSessions.Add(session);
        await _context.SaveChangesAsync();

        var jwtToken = _jwtService.GenerateToken(user);
        var refToken = await CreateRefreshTokenAsync(user, request.RememberMe);

        return BuildAuthResponse(user, jwtToken, refToken);
    }

    public async Task<AuthResponse> GetCurrentUserAsync(string email)
    {
        var normalizedEmail = email.Trim().ToLower();
        var user = await _context.Users
            .Include(u => u.Workspace)
            .Include(u => u.Roles)
            .FirstOrDefaultAsync(u => u.Email == normalizedEmail);

        if (user == null)
        {
            throw new KeyNotFoundException("User not found");
        }

        user.LastActiveAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return BuildAuthResponse(user, null, null);
    }

    public async Task<AuthResponse> RegisterInvitedAsync(RegisterInvitedRequest request)
    {
        var invitation = await _context.WorkspaceInvites
            .Include(i => i.Workspace)
            .FirstOrDefaultAsync(i => i.Token == request.Token);

        if (invitation == null)
        {
            throw new ArgumentException("Invalid invitation token");
        }

        if (string.Equals("ACCEPTED", invitation.Status, StringComparison.OrdinalIgnoreCase))
        {
            throw new ArgumentException("Invitation has already been accepted");
        }

        var normalizedEmail = request.Email.Trim().ToLower();
        if (await _context.Users.AnyAsync(u => u.Email == normalizedEmail))
        {
            throw new ArgumentException("Email is already registered");
        }

        if (!string.Equals(request.Password, request.ConfirmPassword))
        {
            throw new ArgumentException("Passwords do not match");
        }

        var roleName = "ROLE_" + invitation.Role.ToUpper();
        var role = await _context.Roles.FirstOrDefaultAsync(r => r.Name == roleName);
        if (role == null)
        {
            role = new Role { Name = roleName };
            _context.Roles.Add(role);
            await _context.SaveChangesAsync();
        }

        var user = new User
        {
            FullName = request.FullName,
            Email = normalizedEmail,
            Phone = request.Phone,
            Password = _passwordHasher.HashPassword(request.Password),
            WorkspaceId = invitation.WorkspaceId,
            Workspace = invitation.Workspace,
            Status = "ACTIVE",
            IsEmailVerified = true,
            LastActiveAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow
        };
        user.Roles.Add(role);

        _context.Users.Add(user);

        invitation.Status = "ACCEPTED";
        await _context.SaveChangesAsync();

        var session = new UserSession
        {
            UserId = user.Id,
            IpAddress = "127.0.0.1",
            UserAgent = "Browser - Joined via Invite",
            LoginTime = DateTime.UtcNow,
            LastActiveTime = DateTime.UtcNow,
            IsExpired = false
        };
        _context.UserSessions.Add(session);
        await _context.SaveChangesAsync();

        var jwtToken = _jwtService.GenerateToken(user);
        var refToken = await CreateRefreshTokenAsync(user, false);

        return BuildAuthResponse(user, jwtToken, refToken);
    }

    public async Task<AuthResponse> RefreshAccessTokenAsync(string token)
    {
        var refreshToken = await _context.RefreshTokens
            .Include(r => r.User)
                .ThenInclude(u => u!.Workspace)
            .Include(r => r.User)
                .ThenInclude(u => u!.Roles)
            .FirstOrDefaultAsync(r => r.Token == token);

        if (refreshToken == null || refreshToken.User == null)
        {
            throw new ArgumentException("Refresh token not found or user invalid");
        }

        if (refreshToken.ExpiryDate < DateTime.UtcNow)
        {
            _context.RefreshTokens.Remove(refreshToken);
            await _context.SaveChangesAsync();
            throw new ArgumentException("Refresh token has expired. Please sign in again.");
        }

        var user = refreshToken.User;
        if (string.Equals("SUSPENDED", user.Status, StringComparison.OrdinalIgnoreCase))
        {
            throw new ArgumentException("Account is suspended.");
        }

        var newToken = Guid.NewGuid().ToString("N");
        refreshToken.Token = newToken;
        refreshToken.ExpiryDate = DateTime.UtcNow.AddHours(24);
        await _context.SaveChangesAsync();

        var jwtToken = _jwtService.GenerateToken(user);

        return BuildAuthResponse(user, jwtToken, newToken);
    }

    public async Task RequestPasswordResetAsync(string email)
    {
        var normalizedEmail = email.Trim().ToLower();
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == normalizedEmail);
        if (user == null)
        {
            throw new KeyNotFoundException("Email address not found.");
        }

        var token = Guid.NewGuid().ToString("N")[..8].ToUpper();
        var resetToken = new PasswordResetToken
        {
            UserId = user.Id,
            User = user,
            Token = token,
            ExpiryDate = DateTime.UtcNow.AddHours(2)
        };

        _context.PasswordResetTokens.Add(resetToken);
        await _context.SaveChangesAsync();

        Console.WriteLine($"[PASSWORD RESET] Token generated for {email}: {token}");
    }

    public async Task ConfirmPasswordResetAsync(PasswordResetConfirmRequest request)
    {
        var resetToken = await _context.PasswordResetTokens
            .Include(r => r.User)
            .FirstOrDefaultAsync(r => r.Token == request.Token);

        if (resetToken == null)
        {
            throw new ArgumentException("Invalid or expired reset token");
        }

        if (resetToken.ExpiryDate < DateTime.UtcNow)
        {
            _context.PasswordResetTokens.Remove(resetToken);
            await _context.SaveChangesAsync();
            throw new ArgumentException("Reset token has expired");
        }

        if (!string.Equals(request.NewPassword, request.ConfirmPassword))
        {
            throw new ArgumentException("Passwords do not match");
        }

        var user = resetToken.User;
        if (user == null)
        {
            throw new ArgumentException("User associated with reset token was not found");
        }

        user.Password = _passwordHasher.HashPassword(request.NewPassword);
        _context.PasswordResetTokens.Remove(resetToken);
        await _context.SaveChangesAsync();
    }

    public async Task RequestEmailVerificationAsync(string email)
    {
        var normalizedEmail = email.Trim().ToLower();
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == normalizedEmail);
        if (user == null)
        {
            throw new KeyNotFoundException("User not found");
        }

        var token = Guid.NewGuid().ToString("N");
        var verificationToken = new EmailVerificationToken
        {
            UserId = user.Id,
            User = user,
            Token = token,
            ExpiryDate = DateTime.UtcNow.AddDays(1)
        };

        _context.EmailVerificationTokens.Add(verificationToken);
        await _context.SaveChangesAsync();

        Console.WriteLine($"[EMAIL VERIFICATION] Token generated for {email}: {token}");
    }

    public async Task VerifyEmailAsync(string token)
    {
        var verificationToken = await _context.EmailVerificationTokens
            .Include(v => v.User)
            .FirstOrDefaultAsync(v => v.Token == token);

        if (verificationToken == null)
        {
            throw new ArgumentException("Invalid verification token");
        }

        if (verificationToken.ExpiryDate < DateTime.UtcNow)
        {
            _context.EmailVerificationTokens.Remove(verificationToken);
            await _context.SaveChangesAsync();
            throw new ArgumentException("Verification token has expired");
        }

        var user = verificationToken.User;
        if (user != null)
        {
            user.IsEmailVerified = true;
        }
        _context.EmailVerificationTokens.Remove(verificationToken);
        await _context.SaveChangesAsync();
    }

    public async Task<List<UserSessionDto>> GetSessionsAsync(string email)
    {
        var normalizedEmail = email.Trim().ToLower();
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == normalizedEmail);
        if (user == null)
        {
            throw new KeyNotFoundException("User not found");
        }

        var sessions = await _context.UserSessions
            .Where(s => s.UserId == user.Id)
            .OrderByDescending(s => s.LastActiveTime)
            .ToListAsync();

        return sessions.Select(s => new UserSessionDto
        {
            Id = s.Id,
            IpAddress = s.IpAddress,
            UserAgent = s.UserAgent,
            LoginTime = s.LoginTime,
            LastActiveTime = s.LastActiveTime,
            IsExpired = s.IsExpired
        }).ToList();
    }

    public async Task RevokeSessionAsync(long id, string email)
    {
        var normalizedEmail = email.Trim().ToLower();
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == normalizedEmail);
        if (user == null)
        {
            throw new KeyNotFoundException("User not found");
        }

        var session = await _context.UserSessions.FirstOrDefaultAsync(s => s.Id == id && s.UserId == user.Id);
        if (session == null)
        {
            throw new ArgumentException("Session not found");
        }

        session.IsExpired = true;
        await _context.SaveChangesAsync();
    }

    private async Task<string> CreateRefreshTokenAsync(User user, bool rememberMe)
    {
        var oldTokens = await _context.RefreshTokens.Where(r => r.UserId == user.Id).ToListAsync();
        _context.RefreshTokens.RemoveRange(oldTokens);
        await _context.SaveChangesAsync();

        var expirationDays = rememberMe ? 30 : 1;
        var token = Guid.NewGuid().ToString("N");
        var refreshToken = new RefreshToken
        {
            UserId = user.Id,
            User = user,
            Token = token,
            ExpiryDate = DateTime.UtcNow.AddDays(expirationDays)
        };

        _context.RefreshTokens.Add(refreshToken);
        await _context.SaveChangesAsync();

        return token;
    }

    private static AuthResponse BuildAuthResponse(User user, string? token, string? refreshToken)
    {
        var roles = user.Roles.Select(r => r.Name).ToHashSet();
        var ws = user.Workspace;

        return new AuthResponse
        {
            Token = token ?? string.Empty,
            RefreshToken = refreshToken ?? string.Empty,
            Type = "Bearer",
            UserId = user.Id,
            Email = user.Email,
            FullName = user.FullName,
            Designation = user.Designation,
            Bio = user.Bio,
            ProfileImage = user.ProfileImage,
            Phone = user.Phone,
            Status = user.Status,
            Roles = roles,
            WorkspaceId = ws?.Id,
            WorkspaceName = ws?.Name,
            WorkspaceSlug = ws?.Slug,
            InviteCode = ws?.InviteCode,
            AvailabilityStatus = user.AvailabilityStatus
        };
    }
}
