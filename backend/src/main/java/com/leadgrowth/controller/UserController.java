package com.leadgrowth.controller;

import com.leadgrowth.dto.PasswordChangeRequest;
import com.leadgrowth.dto.UserProfileRequest;
import com.leadgrowth.dto.UserInviteRequest;
import com.leadgrowth.dto.UserRoleUpdateRequest;
import com.leadgrowth.dto.UserStatusUpdateRequest;
import com.leadgrowth.entity.Invitation;
import com.leadgrowth.entity.User;
import com.leadgrowth.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;
    private final com.leadgrowth.service.ProductivityService productivityService;

    public UserController(UserService userService, com.leadgrowth.service.ProductivityService productivityService) {
        this.userService = userService;
        this.productivityService = productivityService;
    }

    @PutMapping("/profile")
    public ResponseEntity<User> updateProfile(@Valid @RequestBody UserProfileRequest request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(userService.updateProfile(request, email));
    }

    @PostMapping("/password")
    public ResponseEntity<Void> changePassword(@Valid @RequestBody PasswordChangeRequest request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        userService.changePassword(request, email);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/members")
    public ResponseEntity<List<User>> getWorkspaceMembers() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(userService.getWorkspaceMembers(email));
    }

    @PostMapping("/invite")
    public ResponseEntity<Invitation> inviteUser(@Valid @RequestBody UserInviteRequest request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(userService.inviteUser(request, email));
    }

    @PutMapping("/{id}/role")
    public ResponseEntity<User> updateUserRole(@PathVariable Long id, @Valid @RequestBody UserRoleUpdateRequest request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(userService.updateUserRole(id, request.getRole(), email));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<User> updateUserStatus(@PathVariable Long id, @Valid @RequestBody UserStatusUpdateRequest request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(userService.updateUserStatus(id, request.getStatus(), email));
    }

    @PutMapping("/{id}/details")
    public ResponseEntity<User> editUserDetails(@PathVariable Long id, @Valid @RequestBody UserProfileRequest request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(userService.editUserDetails(id, request, email));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        userService.deleteUser(id, email);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/reset-password")
    public ResponseEntity<User> resetUserPassword(@PathVariable Long id, @RequestParam String newPassword) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(userService.resetUserPassword(id, newPassword, email));
    }

    @PostMapping("/transfer-ownership")
    public ResponseEntity<com.leadgrowth.entity.Workspace> transferWorkspaceOwnership(@RequestParam Long newOwnerId) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(userService.transferWorkspaceOwnership(newOwnerId, email));
    }

    @PutMapping("/availability")
    public ResponseEntity<User> updateAvailabilityStatus(@RequestParam String status) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(userService.updateAvailabilityStatus(status, email));
    }

    @GetMapping("/productivity")
    public ResponseEntity<List<com.leadgrowth.dto.TeamProductivityDto>> getTeamProductivity() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(productivityService.getTeamProductivity(email));
    }
}
