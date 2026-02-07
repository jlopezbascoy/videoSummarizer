package com.youtubesummarizer.backend.controller;

import com.youtubesummarizer.backend.dto.GoogleAuthRequest;
import com.youtubesummarizer.backend.dto.GoogleAuthResponse;
import com.youtubesummarizer.backend.service.GoogleOAuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * Controlador para autenticación OAuth2 con Google
 */
@RestController
@RequestMapping("/api/auth")
public class OAuth2Controller {

    private final GoogleOAuthService googleOAuthService;

    public OAuth2Controller(GoogleOAuthService googleOAuthService) {
        this.googleOAuthService = googleOAuthService;
    }

    /**
     * Autenticar con Google
     * POST /api/auth/google
     * Body: { "token": "google-id-token" }
     */
    @PostMapping("/google")
    public ResponseEntity<?> authenticateWithGoogle(@RequestBody GoogleAuthRequest request) {
        try {
            GoogleAuthResponse response = googleOAuthService.authenticateWithGoogle(request.getToken());
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    /**
     * Health check
     * GET /api/auth/google/status
     */
    @GetMapping("/google/status")
    public ResponseEntity<Map<String, String>> getGoogleAuthStatus() {
        Map<String, String> status = new HashMap<>();
        status.put("status", "Google OAuth2 enabled");
        status.put("provider", "google");
        return ResponseEntity.ok(status);
    }
}