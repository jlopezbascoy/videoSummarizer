package com.youtubesummarizer.backend.dto;

import com.youtubesummarizer.backend.model.AudioDownload;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO para respuestas de descarga de audio
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AudioDownloadResponse {

    private Long id;
    private String videoUrl;
    private String videoId;
    private String videoTitle;
    private String fileSizeMB;
    private Long fileSizeBytes;
    private Long downloadTimeMs;
    private String status;
    private String errorMessage;
    private LocalDateTime createdAt;

    /**
     * Convierte una entidad AudioDownload a DTO
     */
    public static AudioDownloadResponse from(AudioDownload download) {
        return new AudioDownloadResponse(
                download.getId(),
                download.getVideoUrl(),
                download.getVideoId(),
                download.getVideoTitle(),
                download.getFileSizeMB(),
                download.getFileSizeBytes(),
                download.getDownloadTimeMs(),
                download.getStatus(),
                download.getErrorMessage(),
                download.getCreatedAt()
        );
    }
}