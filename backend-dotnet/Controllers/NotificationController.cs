using System.Security.Claims;
using LeadGrowth.Models;
using LeadGrowth.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LeadGrowth.Controllers;

[ApiController]
[Route("api/notifications")]
[Authorize]
public class NotificationController : ControllerBase
{
    private readonly INotificationService _notificationService;

    public NotificationController(INotificationService notificationService)
    {
        _notificationService = notificationService;
    }

    [HttpGet]
    public async Task<ActionResult<List<Notification>>> GetNotifications()
    {
        var email = GetUserEmail();
        var list = await _notificationService.GetNotificationsForUserAsync(email);
        return Ok(list);
    }

    [HttpPatch("{id}/read")]
    public async Task<ActionResult<Notification>> MarkAsRead(long id)
    {
        var email = GetUserEmail();
        try
        {
            var notification = await _notificationService.MarkAsReadAsync(id, email);
            return Ok(notification);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPatch("read-all")]
    public async Task<IActionResult> MarkAllAsRead()
    {
        var email = GetUserEmail();
        await _notificationService.MarkAllAsReadAsync(email);
        return Ok();
    }

    [HttpDelete("clear")]
    public async Task<IActionResult> ClearAllNotifications()
    {
        var email = GetUserEmail();
        try
        {
            await _notificationService.ClearAllNotificationsAsync(email);
            return Ok(new { message = "All notifications cleared" });
        }
        catch (KeyNotFoundException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    private string GetUserEmail()
    {
        return User.FindFirstValue(ClaimTypes.Name) ?? User.FindFirstValue(ClaimTypes.Email) ?? string.Empty;
    }
}
