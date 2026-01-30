package com.youtubesummarizer.backend.controller;

import com.youtubesummarizer.backend.model.User;
import com.youtubesummarizer.backend.service.RateLimitService;
import com.youtubesummarizer.backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * Controller de usuarios
 * Endpoints: /api/users/*
 */
@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*", maxAge = 3600)
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private RateLimitService rateLimitService;

    /**
     * GET /api/users/profile
     * Obtiene el perfil completo del usuario autenticado
     */
    @GetMapping("/profile")
    public ResponseEntity<?> getUserProfile() {
        try {
            User user = userService.getCurrentUser();

            Map<String, Object> profile = new HashMap<>();
            profile.put("id", user.getId());
            profile.put("username", user.getUsername());
            profile.put("email", user.getEmail());
            profile.put("userType", user.getUserType().name());
            profile.put("dailyLimit", user.getDailyLimit());
            profile.put("maxVideoDuration", user.getMaxVideoDuration());
            profile.put("createdAt", user.getCreatedAt());
            profile.put("updatedAt", user.getUpdatedAt());

            // Información de uso
            int remainingRequests = rateLimitService.getRemainingRequests(user);
            int todayUsage = rateLimitService.getTodayUsageCount(user);

            profile.put("remainingRequests", remainingRequests);
            profile.put("todayUsage", todayUsage);

            return ResponseEntity.ok(profile);
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
        }
    }

    /**
     * GET /api/users/limits
     * Obtiene información sobre los límites del usuario
     */
    @GetMapping("/limits")
    public ResponseEntity<?> getUserLimits() {
        try {
            User user = userService.getCurrentUser();

            Map<String, Object> limits = new HashMap<>();
            limits.put("userType", user.getUserType().name());
            limits.put("dailyLimit", user.getDailyLimit());
            limits.put("maxVideoDurationSeconds", user.getMaxVideoDuration());
            limits.put("remainingRequests", rateLimitService.getRemainingRequests(user));
            limits.put("todayUsage", rateLimitService.getTodayUsageCount(user));
            limits.put("hasReachedLimit", rateLimitService.hasReachedLimit(user));

            return ResponseEntity.ok(limits);
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
        }
    }

    /**
     * PUT /api/users/upgrade
     * Actualiza el tipo de usuario (solo para testing, en producción se haría con pagos)
     * TODO: Reemplazar con integración de Stripe
     */
    @PutMapping("/upgrade")
    public ResponseEntity<?> upgradeUserType(@RequestParam String type) {
        try {
            User user = userService.getCurrentUser();

            User.UserType newType;
            try {
                newType = User.UserType.valueOf(type.toUpperCase());
            } catch (IllegalArgumentException e) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Tipo de usuario inválido. Opciones: FREE, PREMIUM, VIP");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
            }

            User updatedUser = userService.updateUserType(user.getId(), newType);

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Tipo de usuario actualizado correctamente");
            response.put("newType", updatedUser.getUserType().name());
            response.put("dailyLimit", updatedUser.getDailyLimit());
            response.put("maxVideoDuration", updatedUser.getMaxVideoDuration());

            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
}