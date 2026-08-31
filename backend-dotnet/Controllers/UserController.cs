using System.Security.Claims;
using LeadGrowth.DTOs;
using LeadGrowth.Models;
using LeadGrowth.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LeadGrowth.Controllers;

[ApiController]
[Route("api/users")]
[Authorize]
public class UserController : ControllerBase
{
    private readonly IUserService _userService;
    private readonly IProductivityService _productivityService;

    public UserController(IUserService userService, IProductivityService productivityService)
    {
        _userService = userService;
        _productivityService = productivityService;
    }

    [HttpPut("profile")]
    public async Task<ActionResult<User>> UpdateProfile([FromBody] UserProfileRequest request)
    {
        var email = GetUserEmail();
        var user = await _userService.UpdateProfileAsync(request, email);
        return Ok(user);
    }

    [HttpPost("change-password")]
    public async Task<IActionResult> ChangePassword([FromBody] PasswordChangeRequest request)
    {
        var email = GetUserEmail();
        try
        {
            await _userService.ChangePasswordAsync(request, email);
            return Ok(new { message = "Password updated successfully" });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("members")]
    public async Task<ActionResult<List<User>>> GetWorkspaceMembers()
    {
        var email = GetUserEmail();
        try
        {
            var members = await _userService.GetWorkspaceMembersAsync(email);
            return Ok(members);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("assignable")]
    public async Task<ActionResult<List<User>>> GetAssignableUsers()
    {
        var email = GetUserEmail();
        try
        {
            var assignable = await _userService.GetAssignableUsersAsync(email);
            return Ok(assignable);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("invite")]
    public async Task<ActionResult<Invitation>> InviteUser([FromBody] UserInviteRequest request)
    {
        var email = GetUserEmail();
        try
        {
            var invitation = await _userService.InviteUserAsync(request, email);
            return Ok(invitation);
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

    [HttpPut("{userId}/role")]
    [Authorize(Policy = "RequireAdmin")]
    public async Task<ActionResult<User>> UpdateUserRole(long userId, [FromBody] UserRoleUpdateRequest request)
    {
        var email = GetUserEmail();
        try
        {
            var user = await _userService.UpdateUserRoleAsync(userId, request.Role, email);
            return Ok(user);
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

    [HttpPut("{userId}/status")]
    [Authorize(Policy = "RequireManagerOrAdmin")]
    public async Task<ActionResult<User>> UpdateUserStatus(long userId, [FromBody] UserStatusUpdateRequest request)
    {
        var email = GetUserEmail();
        try
        {
            var user = await _userService.UpdateUserStatusAsync(userId, request.Status, email);
            return Ok(user);
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

    [HttpPut("{userId}/details")]
    [Authorize(Policy = "RequireManagerOrAdmin")]
    public async Task<ActionResult<User>> EditUserDetails(long userId, [FromBody] UserProfileRequest request)
    {
        var email = GetUserEmail();
        try
        {
            var user = await _userService.EditUserDetailsAsync(userId, request, email);
            return Ok(user);
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

    [HttpDelete("{userId}")]
    [Authorize(Policy = "RequireAdmin")]
    public async Task<IActionResult> DeleteUser(long userId)
    {
        var email = GetUserEmail();
        try
        {
            await _userService.DeleteUserAsync(userId, email);
            return Ok(new { message = "User deleted successfully" });
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

    [HttpPost("{userId}/reset-password")]
    [Authorize(Policy = "RequireAdmin")]
    public async Task<ActionResult<User>> ResetUserPassword(long userId, [FromBody] PasswordResetConfirmRequest? request, [FromQuery] string? newPassword)
    {
        var email = GetUserEmail();
        var pwd = !string.IsNullOrWhiteSpace(request?.NewPassword) ? request.NewPassword : newPassword;
        if (string.IsNullOrWhiteSpace(pwd))
        {
            return BadRequest(new { message = "New password is required" });
        }

        try
        {
            var user = await _userService.ResetUserPasswordAsync(userId, pwd, email);
            return Ok(user);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("transfer-ownership")]
    [Authorize(Policy = "RequireAdmin")]
    public async Task<ActionResult<Workspace>> TransferWorkspaceOwnership([FromQuery] long newOwnerId)
    {
        var email = GetUserEmail();
        try
        {
            var workspace = await _userService.TransferWorkspaceOwnershipAsync(newOwnerId, email);
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

    [HttpPut("availability")]
    public async Task<ActionResult<User>> UpdateAvailabilityStatus([FromQuery] string status)
    {
        var email = GetUserEmail();
        try
        {
            var user = await _userService.UpdateAvailabilityStatusAsync(status, email);
            return Ok(user);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("productivity")]
    public async Task<ActionResult<List<TeamProductivityDto>>> GetTeamProductivity()
    {
        var email = GetUserEmail();
        try
        {
            var productivity = await _productivityService.GetTeamProductivityAsync(email);
            return Ok(productivity);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    private string GetUserEmail()
    {
        return User.FindFirstValue(ClaimTypes.Name) ?? User.FindFirstValue(ClaimTypes.Email) ?? string.Empty;
    }
}
