using System.Security.Claims;
using LeadGrowth.DTOs;
using LeadGrowth.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LeadGrowth.Controllers;

[ApiController]
[Route("api/calendar")]
[Authorize]
public class CalendarController : ControllerBase
{
    private readonly ICalendarService _calendarService;

    public CalendarController(ICalendarService calendarService)
    {
        _calendarService = calendarService;
    }

    [HttpGet]
    public async Task<ActionResult<List<CalendarEventDto>>> GetEvents([FromQuery] string? start, [FromQuery] string? end)
    {
        var email = GetUserEmail();
        var events = await _calendarService.GetCalendarEventsAsync(email, start, end);
        return Ok(events);
    }

    [HttpPost]
    public async Task<ActionResult<CalendarEventDto>> CreateEvent([FromBody] CreateCalendarEventRequest request)
    {
        var email = GetUserEmail();
        try
        {
            var calEvent = await _calendarService.CreateEventAsync(request, email);
            return Ok(calEvent);
        }
        catch (KeyNotFoundException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<CalendarEventDto>> UpdateEvent(long id, [FromBody] CreateCalendarEventRequest request)
    {
        var email = GetUserEmail();
        try
        {
            var calEvent = await _calendarService.UpdateEventAsync(id, request, email);
            return Ok(calEvent);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPatch("{id}/complete")]
    public async Task<ActionResult<CalendarEventDto>> CompleteEvent(long id)
    {
        var email = GetUserEmail();
        try
        {
            var calEvent = await _calendarService.CompleteEventAsync(id, email);
            return Ok(calEvent);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteEvent(long id)
    {
        var email = GetUserEmail();
        try
        {
            await _calendarService.DeleteEventAsync(id, email);
            return NoContent();
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    private string GetUserEmail()
    {
        return User.FindFirstValue(ClaimTypes.Name) ?? User.FindFirstValue(ClaimTypes.Email) ?? string.Empty;
    }
}
