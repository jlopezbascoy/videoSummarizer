package com.youtubesummarizer.backend.dto;

import com.youtubesummarizer.backend.model.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO para respuestas de autenticación (login/register)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthResponse {

    private String token;

    @Builder.Default
    private String type = "Bearer";

    private Long userId;
    private String username;
    private String email;
    private String userType;
    private int dailyLimit;
    private int maxVideoDuration;

    /**
     * Constructor helper para crear respuesta desde usuario y token
     */
    public static AuthResponse from(User user, String token) {
        return AuthResponse.builder()
                .token(token)
                .type("Bearer")
                .userId(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .userType(user.getUserType().name())
                .dailyLimit(user.getDailyLimit())
                .maxVideoDuration(user.getMaxVideoDuration())
                .build();
    }
}