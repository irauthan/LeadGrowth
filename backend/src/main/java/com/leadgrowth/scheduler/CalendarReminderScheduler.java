package com.leadgrowth.scheduler;

import com.leadgrowth.entity.CalendarEvent;
import com.leadgrowth.entity.Notification;
import com.leadgrowth.entity.User;
import com.leadgrowth.repository.CalendarEventRepository;
import com.leadgrowth.repository.NotificationRepository;
import com.leadgrowth.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
public class CalendarReminderScheduler {

    private static final Logger log = LoggerFactory.getLogger(CalendarReminderScheduler.class);

    private final CalendarEventRepository calendarEventRepository;
    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public CalendarReminderScheduler(
            CalendarEventRepository calendarEventRepository,
            NotificationRepository notificationRepository,
            UserRepository userRepository
    ) {
        this.calendarEventRepository = calendarEventRepository;
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
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
}
