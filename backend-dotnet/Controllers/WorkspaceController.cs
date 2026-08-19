using System.Security.Claims;
using LeadGrowth.DTOs;
using LeadGrowth.Models;
using LeadGrowth.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LeadGrowth.Controllers;

[ApiController]
[Route("api/workspaces")]
[Authorize]
public class WorkspaceController : ControllerBase
{
    private readonly IWorkspaceService _workspaceService;

    public WorkspaceController(IWorkspaceService workspaceService)
    {
        _workspaceService = workspaceService;
    }

    [HttpPost]
    [HttpPost("create")]
    public async Task<ActionResult<AuthResponse>> CreateWorkspace([FromBody] CreateWorkspaceRequest request)
    {
        var email = GetUserEmail();
        try
        {
            var response = await _workspaceService.CreateWorkspaceAsync(request, email);
            return Ok(response);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("join")]
    public async Task<ActionResult<AuthResponse>> JoinWorkspace([FromBody] JoinWorkspaceRequest request)
    {
        var email = GetUserEmail();
        try
        {
            var response = await _workspaceService.JoinWorkspaceAsync(request, email);
            return Ok(response);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("current")]
    public async Task<ActionResult<Workspace>> GetCurrentWorkspace()
    {
        var email = GetUserEmail();
        try
        {
            var workspace = await _workspaceService.GetCurrentWorkspaceAsync(email);
            return Ok(workspace);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("current")]
    public async Task<ActionResult<Workspace>> UpdateWorkspace([FromBody] WorkspaceUpdateRequest request)
    {
        var email = GetUserEmail();
        try
        {
            var workspace = await _workspaceService.UpdateWorkspaceAsync(request, email);
            return Ok(workspace);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpDelete("current")]
    public async Task<IActionResult> DeleteWorkspace()
    {
        var email = GetUserEmail();
        try
        {
            await _workspaceService.DeleteWorkspaceAsync(email);
            return Ok(new { message = "Workspace deleted successfully" });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    private string GetUserEmail()
    {
        return User.FindFirstValue(ClaimTypes.Name) ?? User.FindFirstValue(ClaimTypes.Email) ?? string.Empty;
    }
}
