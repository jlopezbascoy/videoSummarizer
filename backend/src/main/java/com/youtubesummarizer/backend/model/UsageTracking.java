package com.youtubesummarizer.backend.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Entidad UsageTracking - Controla el uso diario de los usuarios para rate limiting
 */
@Entity
@Table(name = "usage_tracking",
        uniqueConstraints = @UniqueConstraint(
                name = "unique_user_date",
                columnNames = {"user_id", "request_date"}
        ),
        indexes = {
                @Index(name = "idx_user_date", columnList = "user_id,request_date")
        })
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UsageTracking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @NotNull(message = "El usuario es obligatorio")
    private User user;

    @NotNull(message = "La fecha de petición es obligatoria")
    @Column(name = "request_date", nullable = false)
    private LocalDate requestDate;

    @PositiveOrZero(message = "El conteo diario no puede ser negativo")
    @Column(name = "daily_count", nullable = false)
    @Builder.Default
    private Integer dailyCount = 0;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    /**
     * Incrementa el contador diario
     */
    public void incrementCount() {
        this.dailyCount++;
    }

    /**
     * Verifica si el usuario ha alcanzado su límite diario
     */
    public boolean hasReachedLimit(int dailyLimit) {
        return this.dailyCount >= dailyLimit;
    }

    /**
     * Obtiene las peticiones restantes del día
     */
    public int getRemainingRequests(int dailyLimit) {
        return Math.max(0, dailyLimit - this.dailyCount);
    }

    /**
     * Factory method para crear un nuevo tracking
     */
    public static UsageTracking createForToday(User user) {
        return UsageTracking.builder()
                .user(user)
                .requestDate(LocalDate.now())
                .dailyCount(0)
                .build();
    }
}