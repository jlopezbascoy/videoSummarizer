package com.youtubesummarizer.backend.controller;

import com.youtubesummarizer.backend.dto.YouTubeVideoResponse;
import com.youtubesummarizer.backend.service.YouTubeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * Controller para testing y validación de YouTube API
 * Endpoints: /api/youtube/*
 */
@RestController
@RequestMapping("/api/youtube")
@CrossOrigin(origins = "*", maxAge = 3600)
public class YouTubeController {

    @Autowired
    private YouTubeService youTubeService;

    /**
     * POST /api/youtube/validate
     * Valida una URL de YouTube y extrae el ID del video
     */
    @PostMapping("/validate")
    public ResponseEntity<?> validateUrl(@RequestBody Map<String, String> request) {
        try {
            String videoUrl = request.get("url");
            if (videoUrl == null || videoUrl.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "URL es requerida"));
            }

            String videoId = youTubeService.extractVideoId(videoUrl);
            
            Map<String, Object> response = new HashMap<>();
            response.put("valid", true);
            response.put("videoId", videoId);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("valid", false);
            response.put("error", e.getMessage());
            return ResponseEntity.ok(response);
        }
    }

    /**
     * GET /api/youtube/video/{videoId}
     * Obtiene información de un video específico
     */
    @GetMapping("/video/{videoId}")
    public ResponseEntity<?> getVideoInfo(@PathVariable String videoId) {
        try {
            YouTubeVideoResponse videoInfo = youTubeService.getVideoInfo(videoId);
            return ResponseEntity.ok(videoInfo);
            
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    /**
     * GET /api/youtube/transcript/{videoId}
     * Obtiene la transcripción de un video (si está disponible)
     */
    @GetMapping("/transcript/{videoId}")
    public ResponseEntity<?> getTranscript(@PathVariable String videoId, 
                                         @RequestParam(defaultValue = "es") String language) {
        try {
            String transcript = youTubeService.getVideoTranscript(videoId, language);
            
            Map<String, Object> response = new HashMap<>();
            response.put("videoId", videoId);
            response.put("language", language);
            response.put("transcript", transcript);
            response.put("available", transcript != null && !transcript.trim().isEmpty());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    /**
     * POST /api/youtube/extract-id
     * Extrae el ID del video de una URL
     */
    @PostMapping("/extract-id")
    public ResponseEntity<?> extractVideoId(@RequestBody Map<String, String> request) {
        try {
            String videoUrl = request.get("url");
            if (videoUrl == null || videoUrl.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "URL es requerida"));
            }

            String videoId = youTubeService.extractVideoId(videoUrl);
            
            return ResponseEntity.ok(Map.of("videoId", videoId));
            
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
}