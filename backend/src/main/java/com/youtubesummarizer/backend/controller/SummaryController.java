package com.youtubesummarizer.backend.controller;

import com.youtubesummarizer.backend.dto.SummaryRequest;
import com.youtubesummarizer.backend.dto.SummaryResponse;
import com.youtubesummarizer.backend.service.RateLimitService;
import com.youtubesummarizer.backend.service.SummaryService;
import com.youtubesummarizer.backend.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Controller de resúmenes
 * Endpoints: /api/summaries/*
 */
@RestController
@RequestMapping("/api/summaries")
@CrossOrigin(origins = "*", maxAge = 3600)
public class SummaryController {

    @Autowired
    private SummaryService summaryService;

    @Autowired
    private RateLimitService rateLimitService;

    @Autowired
    private UserService userService;

    /**
     * POST /api/summaries/generate
     * Genera un resumen de un video de YouTube
     */
    @PostMapping("/generate")
    public ResponseEntity<?> generateSummary(@Valid @RequestBody SummaryRequest request) {
        try {
            SummaryResponse response = summaryService.generateSummary(request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }
    }

    /**
     * GET /api/summaries/history
     * Obtiene el historial de resúmenes del usuario
     */
    @GetMapping("/history")
    public ResponseEntity<?> getSummaryHistory() {
        try {
            List<SummaryResponse> summaries = summaryService.getUserSummaries();
            return ResponseEntity.ok(summaries);
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    /**
     * GET /api/summaries/recent?limit=10
     * Obtiene los últimos N resúmenes del usuario
     */
    @GetMapping("/recent")
    public ResponseEntity<?> getRecentSummaries(@RequestParam(defaultValue = "10") int limit) {
        try {
            List<SummaryResponse> summaries = summaryService.getRecentSummaries(limit);
            return ResponseEntity.ok(summaries);
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    /**
     * GET /api/summaries/{id}
     * Obtiene un resumen específico por ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getSummaryById(@PathVariable Long id) {
        try {
            SummaryResponse summary = summaryService.getSummaryById(id);
            return ResponseEntity.ok(summary);
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        }
    }

    /**
     * DELETE /api/summaries/{id}
     * Elimina un resumen
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteSummary(@PathVariable Long id) {
        try {
            summaryService.deleteSummary(id);

            Map<String, String> response = new HashMap<>();
            response.put("message", "Resumen eliminado correctamente");

            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        }
    }

    /**
     * GET /api/summaries/stats
     * Obtiene estadísticas del usuario (total de resúmenes, peticiones restantes)
     */
    @GetMapping("/stats")
    public ResponseEntity<?> getUserStats() {
        try {
            var user = userService.getCurrentUser();
            long totalSummaries = summaryService.getUserSummaryCount();
            int remainingRequests = rateLimitService.getRemainingRequests(user);
            int todayUsage = rateLimitService.getTodayUsageCount(user);

            Map<String, Object> stats = new HashMap<>();
            stats.put("totalSummaries", totalSummaries);
            stats.put("remainingRequests", remainingRequests);
            stats.put("todayUsage", todayUsage);
            stats.put("dailyLimit", user.getDailyLimit());
            stats.put("userType", user.getUserType().name());

            return ResponseEntity.ok(stats);
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
}