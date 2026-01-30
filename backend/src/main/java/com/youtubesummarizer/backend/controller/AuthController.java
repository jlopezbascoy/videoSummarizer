package com.youtubesummarizer.backend.controller;

import com.youtubesummarizer.backend.dto.AuthResponse;
import com.youtubesummarizer.backend.dto.LoginRequest;
import com.youtubesummarizer.backend.dto.RegisterRequest;
import com.youtubesummarizer.backend.model.User;
import com.youtubesummarizer.backend.service.AuthService;
import com.youtubesummarizer.backend.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * Controller de autenticación
 * Endpoints: /api/auth/register, /api/auth/login, /api/auth/me
 */
@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*", maxAge = 3600)
public class AuthController {

    @Autowired
    private AuthService authService;

    @Autowired
    private UserService userService;

    /**
     * POST /api/auth/register
     * Registra un nuevo usuario
     */
    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        try {
            AuthResponse response = authService.register(request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }
    }

    /**
     * POST /api/auth/login
     * Autentica un usuario
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        try {
            AuthResponse response = authService.login(request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Credenciales inválidas");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
        }
    }

    /**
     * GET /api/auth/me
     * Obtiene la información del usuario autenticado
     */
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser() {
        try {
            User user = userService.getCurrentUser();

            Map<String, Object> response = new HashMap<>();
            response.put("id", user.getId());
            response.put("username", user.getUsername());
            response.put("email", user.getEmail());
            response.put("userType", user.getUserType().name());
            response.put("dailyLimit", user.getDailyLimit());
            response.put("maxVideoDuration", user.getMaxVideoDuration());
            response.put("createdAt", user.getCreatedAt());

            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "No autenticado");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
        }
    }

    /**
     * GET /api/auth/check
     * Verifica si el token es válido (útil para el frontend)
     */
    @GetMapping("/check")
    public ResponseEntity<?> checkAuth() {
        try {
            User user = userService.getCurrentUser();

            Map<String, Object> response = new HashMap<>();
            response.put("authenticated", true);
            response.put("username", user.getUsername());

            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, Object> response = new HashMap<>();
            response.put("authenticated", false);
            return ResponseEntity.ok(response);
        }
    }
}