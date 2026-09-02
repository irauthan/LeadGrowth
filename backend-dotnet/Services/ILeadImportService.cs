using LeadGrowth.DTOs;
using Microsoft.AspNetCore.Http;

namespace LeadGrowth.Services;

public interface ILeadImportService
{
    byte[] GenerateSampleTemplate();
    Task<LeadImportPreviewResponse> ParseAndPreviewAsync(IFormFile file, string userEmail);
    Task<LeadImportResultDto> ExecuteImportAsync(LeadImportExecuteRequest request, string userEmail);
}
