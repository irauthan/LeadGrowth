package com.leadgrowth.scheduler;

import com.leadgrowth.entity.CalendarEvent;
import com.leadgrowth.entity.FollowupReminder;
import com.leadgrowth.entity.Notification;
import com.leadgrowth.entity.User;
import com.leadgrowth.repository.CalendarEventRepository;
import com.leadgrowth.repository.FollowupRepository;
import com.leadgrowth.repository.NotificationRepository;
import com.leadgrowth.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class CalendarReminderScheduler {

    private static final Logger log = LoggerFactory.getLogger(CalendarReminderScheduler.class);

    private final CalendarEventRepository calendarEventRepository;
    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final FollowupRepository followupRepository;

    public CalendarReminderScheduler(
            CalendarEventRepository calendarEventRepository,
            NotificationRepository notificationRepository,
            UserRepository userRepository,
            FollowupRepository followupRepository
    ) {
        this.calendarEventRepository = calendarEventRepository;
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
        this.followupRepository = followupRepository;
    }

    // Runs every 1 minute to trigger upcoming calendar event reminders
    @Scheduled(fixedRate = 60000)
    public void scanAndSendCalendarReminders() {
        LocalDateTime now = LocalDateTime.now();

        // Scan events starting within the next 2 hours that haven't sent reminders yet
        List<CalendarEvent> upcomingEvents = calendarEventRepository.findUpcomingEventsNeedingReminder(now.plusHours(2));

        for (CalendarEvent event : upcomingEvents) {
            int reminderMins = event.getReminderMinutes() != null ? event.getReminderMinutes() : 15;
            LocalDateTime reminderTime = event.getStartTime().minusMinutes(reminderMins);

            if (now.isAfter(reminderTime) || now.isEqual(reminderTime)) {
                if (event.getAssignedUserId() != null) {
                    User user = userRepository.findById(event.getAssignedUserId()).orElse(null);
                    if (user != null) {
                        String title = "Upcoming Event Reminder: " + event.getTitle();
                        String message = String.format("Reminder: '%s' (%s) is scheduled for %s.",
                                event.getTitle(), event.getEventType(), event.getStartTime().toString().replace('T', ' '));

                        Notification notification = Notification.builder()
                                .user(user)
                                .title(title)
                                .message(message)
                                .isRead(false)
                                .build();

                        notificationRepository.save(notification);
                        log.info("Sent calendar reminder notification to user ID {} for event ID {}", user.getId(), event.getId());
                    }
                }

                event.setReminderSent(true);
                calendarEventRepository.save(event);
            }
        }
    }

    // Runs every 1 minute to scan for overdue follow-up reminders
    @Scheduled(fixedRate = 60000)
    public void scanAndMarkOverdueFollowups() {
        LocalDateTime now = LocalDateTime.now();
        List<FollowupReminder> pending = followupRepository.findAll().stream()
                .filter(f -> ("UPCOMING".equalsIgnoreCase(f.getStatus()) || "PENDING".equalsIgnoreCase(f.getStatus())) && f.getScheduledAt() != null && f.getScheduledAt().isBefore(now))
                .collect(Collectors.toList());

        for (FollowupReminder r : pending) {
            r.setStatus("OVERDUE");
            followupRepository.save(r);

            if (r.getAssignedTo() != null) {
                String leadName = r.getLead() != null ? r.getLead().getName() : "Lead";
                Notification notification = Notification.builder()
                        .user(r.getAssignedTo())
                        .title("Overdue Follow-up Alert")
                        .message(String.format("Follow-up for '%s' was scheduled for %s and is now OVERDUE.", leadName, r.getScheduledAt().toString().replace('T', ' ')))
                        .isRead(false)
                        .build();
                notificationRepository.save(notification);
                log.info("Marked follow-up ID {} OVERDUE for lead {}", r.getId(), leadName);
            }
        }
    }
}
