package com.leadgrowth.controller;

import com.leadgrowth.dto.WorkloadScoreDto;
import com.leadgrowth.service.SmartAssignmentService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/assignments")
public class SmartAssignmentController {

    private final SmartAssignmentService smartAssignmentService;

    public SmartAssignmentController(SmartAssignmentService smartAssignmentService) {
        this.smartAssignmentService = smartAssignmentService;
    }

    @GetMapping("/workload-scores")
    public ResponseEntity<List<WorkloadScoreDto>> getWorkloadScores() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(smartAssignmentService.calculateWorkspaceWorkloadScores(email));
    }
}
