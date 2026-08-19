using LeadGrowth.DTOs;

namespace LeadGrowth.Services;

public interface IAuthService
{
    Task<AuthResponse> RegisterAsync(RegisterRequest request);
    Task<AuthResponse> RegisterInvitedAsync(RegisterInvitedRequest request);
    Task<AuthResponse> LoginAsync(LoginRequest request, string ipAddress, string userAgent);
    Task<AuthResponse> GetCurrentUserAsync(string email);
    Task<AuthResponse> RefreshAccessTokenAsync(string refreshToken);
    Task RequestPasswordResetAsync(string email);
    Task ConfirmPasswordResetAsync(PasswordResetConfirmRequest request);
    Task RequestEmailVerificationAsync(string email);
    Task VerifyEmailAsync(string token);
    Task<List<UserSessionDto>> GetSessionsAsync(string email);
    Task RevokeSessionAsync(long id, string email);
}
