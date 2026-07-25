package com.leadgrowth.controller;

import com.leadgrowth.entity.Notification;
import com.leadgrowth.service.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    public ResponseEntity<List<Notification>> getNotifications() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(notificationService.getNotificationsForUser(email));
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<Notification> markAsRead(@PathVariable Long id) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(notificationService.markAsRead(id, email));
    }

    @PatchMapping("/read-all")
    public ResponseEntity<Void> markAllAsRead() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        notificationService.markAllAsRead(email);
        return ResponseEntity.ok().build();
    }
}
