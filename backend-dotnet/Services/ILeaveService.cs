using LeadGrowth.DTOs;

namespace LeadGrowth.Services;

public interface ILeaveService
{
    Task<LeaveRequestDto> CreateLeaveRequestAsync(LeaveRequestCreateDto dto, string userEmail);
    Task<List<LeaveRequestDto>> GetMyLeaveRequestsAsync(string userEmail);
    Task<List<LeaveRequestDto>> GetWorkspaceLeaveRequestsAsync(string userEmail);
    Task<LeaveRequestDto> ReviewLeaveRequestAsync(long requestId, LeaveRequestReviewDto dto, string reviewerEmail);
    Task CancelLeaveRequestAsync(long requestId, string userEmail);
}
