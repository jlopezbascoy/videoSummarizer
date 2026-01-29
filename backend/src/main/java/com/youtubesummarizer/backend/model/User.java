package com.youtubesummarizer.backend.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Entidad User - Representa un usuario del sistema
 */
@Entity
@Table(name = "users", indexes = {
    @Index(name = "idx_username", columnList = "username"),
    @Index(name = "idx_email", columnList = "email"),
    @Index(name = "idx_user_type", columnList = "user_type")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "El nombre de usuario es obligatorio")
    @Size(min = 3, max = 50, message = "El nombre de usuario debe tener entre 3 y 50 caracteres")
    @Column(nullable = false, unique = true, length = 50)
    private String username;

    @NotBlank(message = "El email es obligatorio")
    @Email(message = "El email debe ser válido")
    @Size(max = 100, message = "El email no puede exceder 100 caracteres")
    @Column(nullable = false, unique = true, length = 100)
    private String email;

    @NotBlank(message = "La contraseña es obligatoria")
    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(name = "user_type", nullable = false, length = 10)
    @Builder.Default
    private UserType userType = UserType.FREE;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Relación con summaries (un usuario tiene muchos resúmenes)
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Summary> summaries = new ArrayList<>();

    // Relación con usage tracking
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<UsageTracking> usageTrackings = new ArrayList<>();

    /**
     * Enum para tipos de usuario
     */
    public enum UserType {
        FREE(3, 600),      // 3 resúmenes/día, videos max 10 min (600 seg)
        PREMIUM(20, 1800), // 20 resúmenes/día, videos max 30 min (1800 seg)
        VIP(100, 3600);    // 100 resúmenes/día, videos max 60 min (3600 seg)

        private final int dailyLimit;
        private final int maxVideoDurationSeconds;

        UserType(int dailyLimit, int maxVideoDurationSeconds) {
            this.dailyLimit = dailyLimit;
            this.maxVideoDurationSeconds = maxVideoDurationSeconds;
        }

        public int getDailyLimit() {
            return dailyLimit;
        }

        public int getMaxVideoDurationSeconds() {
            return maxVideoDurationSeconds;
        }
    }

    /**
     * Método helper para obtener el límite diario según el tipo de usuario
     */
    public int getDailyLimit() {
        return userType.getDailyLimit();
    }

    /**
     * Método helper para obtener la duración máxima de video permitida
     */
    public int getMaxVideoDuration() {
        return userType.getMaxVideoDurationSeconds();
    }
}