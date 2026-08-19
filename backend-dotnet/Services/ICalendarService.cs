using LeadGrowth.DTOs;
using LeadGrowth.Models;

namespace LeadGrowth.Services;

public interface ICalendarService
{
    Task<List<CalendarEventDto>> GetCalendarEventsAsync(string email, string? start, string? end);
    Task<CalendarEventDto> CreateEventAsync(CreateCalendarEventRequest request, string email);
    Task<CalendarEventDto> UpdateEventAsync(long id, CreateCalendarEventRequest request, string email);
    Task<CalendarEventDto> CompleteEventAsync(long id, string email);
    Task DeleteEventAsync(long id, string email);
    Task SyncFollowupToCalendarAsync(FollowupReminder followup);
}
