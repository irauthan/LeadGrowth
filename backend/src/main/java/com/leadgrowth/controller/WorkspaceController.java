package com.leadgrowth.controller;

import com.leadgrowth.dto.AuthResponse;
import com.leadgrowth.dto.CreateWorkspaceRequest;
import com.leadgrowth.dto.JoinWorkspaceRequest;
import com.leadgrowth.dto.WorkspaceUpdateRequest;
import com.leadgrowth.entity.Workspace;
import com.leadgrowth.service.WorkspaceService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/workspaces")
public class WorkspaceController {

    private final WorkspaceService workspaceService;

    public WorkspaceController(WorkspaceService workspaceService) {
        this.workspaceService = workspaceService;
    }

    @PostMapping("/create")
    public ResponseEntity<AuthResponse> createWorkspace(@Valid @RequestBody CreateWorkspaceRequest request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(workspaceService.createWorkspace(request, email));
    }

    @PostMapping("/join")
    public ResponseEntity<AuthResponse> joinWorkspace(@Valid @RequestBody JoinWorkspaceRequest request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(workspaceService.joinWorkspace(request, email));
    }

    @GetMapping("/current")
    public ResponseEntity<Workspace> getCurrentWorkspace() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(workspaceService.getCurrentWorkspace(email));
    }

    @PutMapping("/current")
    public ResponseEntity<Workspace> updateWorkspace(@Valid @RequestBody WorkspaceUpdateRequest request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(workspaceService.updateWorkspace(request, email));
    }

    @DeleteMapping("/current")
    public ResponseEntity<Void> deleteWorkspace() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        workspaceService.deleteWorkspace(email);
        return ResponseEntity.ok().build();
    }
}
