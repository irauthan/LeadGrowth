using System.Security.Claims;
using LeadGrowth.DTOs;
using LeadGrowth.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LeadGrowth.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> Register([FromBody] RegisterRequest request)
    {
        try
        {
            var response = await _authService.RegisterAsync(request);
            return Ok(response);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("register-invited")]
    public async Task<ActionResult<AuthResponse>> RegisterInvited([FromBody] RegisterInvitedRequest request)
    {
        try
        {
            var response = await _authService.RegisterInvitedAsync(request);
            return Ok(response);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login([FromBody] LoginRequest request)
    {
        try
        {
            var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";
            var userAgent = Request.Headers.UserAgent.ToString();
            if (string.IsNullOrEmpty(userAgent))
            {
                userAgent = "Unknown Device";
            }

            var response = await _authService.LoginAsync(request, ipAddress, userAgent);
            return Ok(response);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<AuthResponse>> GetCurrentUser()
    {
        var email = User.FindFirstValue(ClaimTypes.Name) ?? User.FindFirstValue(ClaimTypes.Email);
        if (string.IsNullOrEmpty(email))
        {
            return Unauthorized();
        }

        try
        {
            var response = await _authService.GetCurrentUserAsync(email);
            return Ok(response);
        }
        catch (KeyNotFoundException)
        {
            return Unauthorized();
        }
    }

    [HttpPost("refresh-token")]
    public async Task<ActionResult<AuthResponse>> RefreshToken([FromBody] RefreshTokenRequest request)
    {
        try
        {
            var response = await _authService.RefreshAccessTokenAsync(request.RefreshToken);
            return Ok(response);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("password-reset/request")]
    public async Task<IActionResult> RequestPasswordReset([FromBody] PasswordResetRequest request)
    {
        try
        {
            await _authService.RequestPasswordResetAsync(request.Email);
            return Ok();
        }
        catch (KeyNotFoundException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("password-reset/confirm")]
    public async Task<IActionResult> ConfirmPasswordReset([FromBody] PasswordResetConfirmRequest request)
    {
        try
        {
            await _authService.ConfirmPasswordResetAsync(request);
            return Ok();
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("email-verification/request")]
    public async Task<IActionResult> RequestEmailVerification([FromQuery] string email)
    {
        try
        {
            await _authService.RequestEmailVerificationAsync(email);
            return Ok();
        }
        catch (KeyNotFoundException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("email-verification/verify")]
    public async Task<IActionResult> VerifyEmail([FromQuery] string token)
    {
        try
        {
            await _authService.VerifyEmailAsync(token);
            return Ok();
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("sessions")]
    [Authorize]
    public async Task<ActionResult<List<UserSessionDto>>> GetSessions()
    {
        var email = User.FindFirstValue(ClaimTypes.Name) ?? User.FindFirstValue(ClaimTypes.Email);
        if (string.IsNullOrEmpty(email))
        {
            return Unauthorized();
        }

        var sessions = await _authService.GetSessionsAsync(email);
        return Ok(sessions);
    }

    [HttpDelete("sessions/{id}")]
    [Authorize]
    public async Task<IActionResult> RevokeSession(long id)
    {
        var email = User.FindFirstValue(ClaimTypes.Name) ?? User.FindFirstValue(ClaimTypes.Email);
        if (string.IsNullOrEmpty(email))
        {
            return Unauthorized();
        }

        try
        {
            await _authService.RevokeSessionAsync(id, email);
            return Ok();
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
