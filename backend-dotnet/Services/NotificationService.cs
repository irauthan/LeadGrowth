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
        var user = await ResolveUserAsync(email);
        if (user == null)
        {
            return new List<Notification>();
        }

        return await _context.Notifications
            .Where(n => n.UserId == user.Id)
            .OrderByDescending(n => n.CreatedAt)
            .ToListAsync();
    }

    public async Task<Notification> MarkAsReadAsync(long notificationId, string email)
    {
        var user = await ResolveUserAsync(email);
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
        var user = await ResolveUserAsync(email);
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

    private async Task<User?> ResolveUserAsync(string identifier)
    {
        if (string.IsNullOrWhiteSpace(identifier)) return null;

        if (long.TryParse(identifier.Trim(), out var userId))
        {
            var userById = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
            if (userById != null) return userById;
        }

        var normalizedEmail = identifier.Trim().ToLower();
        return await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == normalizedEmail);
    }
}
