package com.youtubesummarizer.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO para respuesta de YouTube API
 * Contiene información del video y su transcripción
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class YouTubeVideoResponse {
    
    private String videoId;
    private String title;
    private String description;
    private String channelTitle;
    private String publishedAt;
    private String duration;
    private String thumbnailUrl;
    private String viewCount;
    private String likeCount;
    
    // Información de la transcripción
    private boolean hasTranscript;
    private String transcriptLanguage;
    private String transcriptText;
    private Long transcriptLength;
}