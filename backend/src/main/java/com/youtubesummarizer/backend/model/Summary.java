package com.youtubesummarizer.backend.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Entidad Summary - Representa un resumen de video de YouTube
 */
@Entity
@Table(name = "summaries", indexes = {
        @Index(name = "idx_user_id", columnList = "user_id"),
        @Index(name = "idx_created_at", columnList = "created_at")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Summary {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @NotNull(message = "El usuario es obligatorio")
    private User user;

    @NotBlank(message = "La URL del video es obligatoria")
    @Column(name = "video_url", nullable = false, length = 500)
    private String videoUrl;

    @Column(name = "video_title", columnDefinition = "TEXT")
    private String videoTitle;

    @NotBlank(message = "El texto del resumen es obligatorio")
    @Column(name = "summary_text", nullable = false, columnDefinition = "TEXT")
    private String summaryText;

    @NotBlank(message = "El idioma es obligatorio")
    @Column(nullable = false, length = 10)
    private String language;

    @Positive(message = "El conteo de palabras debe ser positivo")
    @Column(name = "word_count", nullable = false)
    private Integer wordCount;

    @Column(name = "video_duration_seconds")
    private Integer videoDurationSeconds;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /**
     * Constructor helper para crear un resumen
     */
    public static Summary create(User user, String videoUrl, String videoTitle,
                                 String summaryText, String language,
                                 Integer wordCount, Integer videoDuration) {
        return Summary.builder()
                .user(user)
                .videoUrl(videoUrl)
                .videoTitle(videoTitle)
                .summaryText(summaryText)
                .language(language)
                .wordCount(wordCount)
                .videoDurationSeconds(videoDuration)
                .build();
    }
}