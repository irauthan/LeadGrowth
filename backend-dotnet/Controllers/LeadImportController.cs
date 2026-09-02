using System.Security.Claims;
using LeadGrowth.DTOs;
using LeadGrowth.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LeadGrowth.Controllers;

[ApiController]
[Route("api/leads/import")]
[Authorize]
public class LeadImportController : ControllerBase
{
    private readonly ILeadImportService _leadImportService;

    public LeadImportController(ILeadImportService leadImportService)
    {
        _leadImportService = leadImportService;
    }

    [HttpGet("template")]
    public IActionResult DownloadTemplate()
    {
        try
        {
            var bytes = _leadImportService.GenerateSampleTemplate();
            var fileName = $"LeadGrowth_Lead_Intake_Template_{DateTime.UtcNow:yyyyMMdd}.xlsx";
            return File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = $"Failed to generate template: {ex.Message}" });
        }
    }

    [HttpPost("preview")]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<LeadImportPreviewResponse>> PreviewImport([FromForm] IFormFile file)
    {
        var email = GetUserEmail();
        if (string.IsNullOrEmpty(email))
        {
            return Unauthorized(new { message = "User not authenticated." });
        }

        try
        {
            var preview = await _leadImportService.ParseAndPreviewAsync(file, email);
            return Ok(preview);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = $"Error parsing file: {ex.Message}" });
        }
    }

    [HttpPost("execute")]
    public async Task<ActionResult<LeadImportResultDto>> ExecuteImport([FromBody] LeadImportExecuteRequest request)
    {
        var email = GetUserEmail();
        if (string.IsNullOrEmpty(email))
        {
            return Unauthorized(new { message = "User not authenticated." });
        }

        try
        {
            var result = await _leadImportService.ExecuteImportAsync(request, email);
            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = $"Error executing lead intake: {ex.Message}" });
        }
    }

    private string GetUserEmail()
    {
        return User.FindFirst(ClaimTypes.Email)?.Value
            ?? User.FindFirst("email")?.Value
            ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? string.Empty;
    }
}
