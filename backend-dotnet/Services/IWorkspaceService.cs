using LeadGrowth.DTOs;
using LeadGrowth.Models;

namespace LeadGrowth.Services;

public interface IWorkspaceService
{
    Task<AuthResponse> CreateWorkspaceAsync(CreateWorkspaceRequest request, string userEmail);
    Task<AuthResponse> JoinWorkspaceAsync(JoinWorkspaceRequest request, string userEmail);
    Task<Workspace> GetCurrentWorkspaceAsync(string userEmail);
    Task<Workspace> UpdateWorkspaceAsync(WorkspaceUpdateRequest request, string userEmail);
    Task DeleteWorkspaceAsync(string userEmail);
}
