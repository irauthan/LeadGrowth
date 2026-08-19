using LeadGrowth.Models;

namespace LeadGrowth.Services;

public interface INotificationService
{
    Task<List<Notification>> GetNotificationsForUserAsync(string email);
    Task<Notification> MarkAsReadAsync(long notificationId, string email);
    Task MarkAllAsReadAsync(string email);
}
