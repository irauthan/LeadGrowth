using LeadGrowth.DTOs;
using LeadGrowth.Models;

namespace LeadGrowth.Services;

public interface IUserService
{
    Task<User> UpdateProfileAsync(UserProfileRequest request, string userEmail);
    Task ChangePasswordAsync(PasswordChangeRequest request, string userEmail);
    Task<List<User>> GetWorkspaceMembersAsync(string userEmail);
    Task<List<User>> GetAssignableUsersAsync(string userEmail);
    Task<Invitation> InviteUserAsync(UserInviteRequest request, string inviterEmail);
    Task<User> UpdateUserRoleAsync(long userId, string roleName, string adminEmail);
    Task<User> UpdateUserStatusAsync(long userId, string status, string actorEmail);
    Task<User> EditUserDetailsAsync(long userId, UserProfileRequest request, string inviterEmail);
    Task DeleteUserAsync(long userId, string adminEmail);
    Task<User> ResetUserPasswordAsync(long userId, string newPassword, string adminEmail);
    Task<Workspace> TransferWorkspaceOwnershipAsync(long newOwnerId, string adminEmail);
    Task<User> UpdateAvailabilityStatusAsync(string availabilityStatus, string? reason, string email);
}
