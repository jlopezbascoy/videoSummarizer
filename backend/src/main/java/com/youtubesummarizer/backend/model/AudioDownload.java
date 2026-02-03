package com.youtubesummarizer.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Entidad para tracking de descargas de audio
 * Guarda informacion sobre cada descarga que hace un usuario
 */
@Entity
@Table(name = "audio_downloads")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AudioDownload {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "video_url", nullable = false, length = 500)
    private String videoUrl;

    @Column(name = "video_id", nullable = false, length = 20)
    private String videoId;

    @Column(name = "video_title", length = 200)
    private String videoTitle;

    @Column(name = "file_size_bytes")
    private Long fileSizeBytes;

    @Column(name = "file_size_mb")
    private String fileSizeMB;

    @Column(name = "download_time_ms")
    private Long downloadTimeMs;

    @Column(name = "status", length = 20)
    private String status; // SUCCESS, FAILED, PROCESSING

    @Column(name = "error_message", length = 500)
    private String errorMessage;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    /**
     * Crea una nueva descarga exitosa
     */
    public static AudioDownload createSuccess(
            User user,
            String videoUrl,
            String videoId,
            String videoTitle,
            long fileSizeBytes,
            long downloadTimeMs
    ) {
        AudioDownload download = new AudioDownload();
        download.setUser(user);
        download.setVideoUrl(videoUrl);
        download.setVideoId(videoId);
        download.setVideoTitle(videoTitle);
        download.setFileSizeBytes(fileSizeBytes);
        download.setFileSizeMB(String.format("%.2f MB", fileSizeBytes / (1024.0 * 1024.0)));
        download.setDownloadTimeMs(downloadTimeMs);
        download.setStatus("SUCCESS");
        download.setCreatedAt(LocalDateTime.now());
        return download;
    }

    /**
     * Crea una descarga fallida
     */
    public static AudioDownload createFailed(
            User user,
            String videoUrl,
            String videoId,
            String errorMessage
    ) {
        AudioDownload download = new AudioDownload();
        download.setUser(user);
        download.setVideoUrl(videoUrl);
        download.setVideoId(videoId);
        download.setStatus("FAILED");
        download.setErrorMessage(errorMessage);
        download.setCreatedAt(LocalDateTime.now());
        return download;
    }

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}