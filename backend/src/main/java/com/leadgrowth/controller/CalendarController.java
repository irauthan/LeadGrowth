package com.leadgrowth.controller;

import com.leadgrowth.dto.CalendarEventDto;
import com.leadgrowth.dto.CreateCalendarEventRequest;
import com.leadgrowth.service.CalendarService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/calendar")
public class CalendarController {

    private final CalendarService calendarService;

    public CalendarController(CalendarService calendarService) {
        this.calendarService = calendarService;
    }

    @GetMapping
    public ResponseEntity<List<CalendarEventDto>> getEvents(
            @RequestParam(required = false) String start,
            @RequestParam(required = false) String end
    ) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(calendarService.getCalendarEvents(email, start, end));
    }

    @PostMapping
    public ResponseEntity<CalendarEventDto> createEvent(@Valid @RequestBody CreateCalendarEventRequest request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(calendarService.createEvent(request, email));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CalendarEventDto> updateEvent(
            @PathVariable Long id,
            @RequestBody CreateCalendarEventRequest request
    ) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(calendarService.updateEvent(id, request, email));
    }

    @PatchMapping("/{id}/complete")
    public ResponseEntity<CalendarEventDto> completeEvent(@PathVariable Long id) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(calendarService.completeEvent(id, email));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEvent(@PathVariable Long id) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        calendarService.deleteEvent(id, email);
        return ResponseEntity.noContent().build();
    }
}
