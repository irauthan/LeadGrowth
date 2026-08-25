using System.Security.Claims;
using LeadGrowth.DTOs;
using LeadGrowth.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LeadGrowth.Controllers;

[ApiController]
[Route("api/leaves")]
[Authorize]
public class LeaveController : ControllerBase
{
    private readonly ILeaveService _leaveService;

    public LeaveController(ILeaveService leaveService)
    {
        _leaveService = leaveService;
    }

    [HttpPost("request")]
    public async Task<ActionResult<LeaveRequestDto>> CreateLeaveRequest([FromBody] LeaveRequestCreateDto dto)
    {
        var email = GetUserEmail();
        try
        {
            var result = await _leaveService.CreateLeaveRequestAsync(dto, email);
            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
    }

    [HttpGet("my")]
    public async Task<ActionResult<List<LeaveRequestDto>>> GetMyLeaveRequests()
    {
        var email = GetUserEmail();
        try
        {
            var list = await _leaveService.GetMyLeaveRequestsAsync(email);
            return Ok(list);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpGet("workspace")]
    [Authorize(Policy = "RequireManagerOrAdmin")]
    public async Task<ActionResult<List<LeaveRequestDto>>> GetWorkspaceLeaveRequests()
    {
        var email = GetUserEmail();
        try
        {
            var list = await _leaveService.GetWorkspaceLeaveRequestsAsync(email);
            return Ok(list);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid(ex.Message);
        }
    }

    [HttpPost("{id}/review")]
    [Authorize(Policy = "RequireManagerOrAdmin")]
    public async Task<ActionResult<LeaveRequestDto>> ReviewLeave(long id, [FromBody] LeaveRequestReviewDto dto)
    {
        var email = GetUserEmail();
        try
        {
            var result = await _leaveService.ReviewLeaveRequestAsync(id, dto, email);
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid(ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> CancelLeave(long id)
    {
        var email = GetUserEmail();
        try
        {
            await _leaveService.CancelLeaveRequestAsync(id, email);
            return Ok(new { message = "Leave request cancelled successfully." });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid(ex.Message);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    private string GetUserEmail()
    {
        return User.FindFirstValue(ClaimTypes.Name) ?? User.FindFirstValue(ClaimTypes.Email) ?? string.Empty;
    }
}
