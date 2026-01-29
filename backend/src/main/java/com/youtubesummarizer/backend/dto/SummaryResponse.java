package com.youtubesummarizer.backend.dto;

import com.youtubesummarizer.backend.model.Summary;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO para respuestas de resúmenes
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SummaryResponse {

    private Long id;
    private String videoUrl;
    private String videoTitle;
    private String summaryText;
    private String language;
    private Integer wordCount;
    private Integer videoDurationSeconds;
    private LocalDateTime createdAt;
    private int remainingRequests;

    /**
     * Constructor helper para crear respuesta desde entidad Summary
     */
    public static SummaryResponse from(Summary summary, int remainingRequests) {
        return SummaryResponse.builder()
                .id(summary.getId())
                .videoUrl(summary.getVideoUrl())
                .videoTitle(summary.getVideoTitle())
                .summaryText(summary.getSummaryText())
                .language(summary.getLanguage())
                .wordCount(summary.getWordCount())
                .videoDurationSeconds(summary.getVideoDurationSeconds())
                .createdAt(summary.getCreatedAt())
                .remainingRequests(remainingRequests)
                .build();
    }

    /**
     * Constructor simplificado sin remainingRequests (para historial)
     */
    public static SummaryResponse from(Summary summary) {
        return from(summary, 0);
    }
}