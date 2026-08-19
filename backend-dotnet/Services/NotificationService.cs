using LeadGrowth.Data;
using LeadGrowth.Models;
using Microsoft.EntityFrameworkCore;

namespace LeadGrowth.Services;

public class NotificationService : INotificationService
{
    private readonly LeadGrowthDbContext _context;

    public NotificationService(LeadGrowthDbContext context)
    {
        _context = context;
    }

    public async Task<List<Notification>> GetNotificationsForUserAsync(string email)
    {
        var userEmail = email.Trim().ToLower();
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == userEmail);
        if (user == null)
        {
            throw new KeyNotFoundException("User not found");
        }

        return await _context.Notifications
            .Where(n => n.UserId == user.Id)
            .OrderByDescending(n => n.CreatedAt)
            .ToListAsync();
    }

    public async Task<Notification> MarkAsReadAsync(long notificationId, string email)
    {
        var userEmail = email.Trim().ToLower();
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == userEmail);
        if (user == null)
        {
            throw new KeyNotFoundException("User not found");
        }

        var notification = await _context.Notifications
            .FirstOrDefaultAsync(n => n.Id == notificationId && n.UserId == user.Id);

        if (notification == null)
        {
            throw new ArgumentException("Notification not found");
        }

        notification.IsRead = true;
        await _context.SaveChangesAsync();

        return notification;
    }

    public async Task MarkAllAsReadAsync(string email)
    {
        var userEmail = email.Trim().ToLower();
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == userEmail);
        if (user == null)
        {
            throw new KeyNotFoundException("User not found");
        }

        var unread = await _context.Notifications
            .Where(n => n.UserId == user.Id && !n.IsRead)
            .ToListAsync();

        foreach (var n in unread)
        {
            n.IsRead = true;
        }

        await _context.SaveChangesAsync();
    }
}
