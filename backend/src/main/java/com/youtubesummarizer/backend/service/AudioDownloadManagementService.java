package com.youtubesummarizer.backend.service;

import com.youtubesummarizer.backend.dto.AudioDownloadResponse;
import com.youtubesummarizer.backend.model.AudioDownload;
import com.youtubesummarizer.backend.model.User;
import com.youtubesummarizer.backend.repository.AudioDownloadRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Servicio para gestionar descargas de audio de usuarios
 */
@Service
public class AudioDownloadManagementService {

    private static final Logger logger = LoggerFactory.getLogger(AudioDownloadManagementService.class);

    @Autowired
    private AudioDownloadRepository audioDownloadRepository;

    @Autowired
    private YouTubeAudioService youtubeAudioService;

    @Autowired
    private UserService userService;

    @Autowired
    private RateLimitService rateLimitService;

    /**
     * Descarga audio y lo sirve al usuario
     * Tambien guarda el registro en BD
     */
    @Transactional
    public ResponseEntity<Resource> downloadAudioForUser(String videoUrl) {
        User user = userService.getCurrentUser();
        Path audioFile = null;

        try {
            logger.info("Usuario {} solicita descarga de audio: {}", user.getUsername(), videoUrl);

            // Verificar limite de descargas diarias (usar mismo limite que resumenes)
            if (!rateLimitService.canMakeRequest(user)) {
                throw new RuntimeException(
                        "Has alcanzado el limite de descargas diarias (" + user.getDailyLimit() + ")"
                );
            }

            // Extraer video ID
            String videoId = extractVideoId(videoUrl);

            // Descargar audio
            long startTime = System.currentTimeMillis();
            audioFile = youtubeAudioService.downloadAudio(videoUrl);
            long downloadTime = System.currentTimeMillis() - startTime;

            // Leer archivo
            byte[] audioData = Files.readAllBytes(audioFile);
            long fileSize = audioData.length;

            // Guardar registro en BD
            AudioDownload download = AudioDownload.createSuccess(
                    user,
                    videoUrl,
                    videoId,
                    "Video de YouTube - " + videoId,
                    fileSize,
                    downloadTime
            );
            audioDownloadRepository.save(download);

            // Incrementar contador de uso
            rateLimitService.incrementUsage(user);

            logger.info("Descarga exitosa: {} bytes en {} ms", fileSize, downloadTime);

            // Preparar respuesta con el archivo
            ByteArrayResource resource = new ByteArrayResource(audioData);

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename=\"youtube_audio_" + videoId + ".mp3\"")
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .contentLength(fileSize)
                    .body(resource);

        } catch (Exception e) {
            logger.error("Error en descarga: {}", e.getMessage(), e);

            // Guardar registro de fallo
            try {
                String videoId = extractVideoId(videoUrl);
                AudioDownload failedDownload = AudioDownload.createFailed(
                        user,
                        videoUrl,
                        videoId,
                        e.getMessage()
                );
                audioDownloadRepository.save(failedDownload);
            } catch (Exception ex) {
                logger.error("No se pudo guardar registro de fallo", ex);
            }

            throw new RuntimeException("Error al descargar audio: " + e.getMessage());

        } finally {
            // Limpiar archivo temporal
            if (audioFile != null) {
                youtubeAudioService.cleanupAudioFile(audioFile);
            }
        }
    }

    /**
     * Obtiene el historial de descargas del usuario
     */
    @Transactional(readOnly = true)
    public List<AudioDownloadResponse> getUserDownloadHistory() {
        User user = userService.getCurrentUser();
        List<AudioDownload> downloads = audioDownloadRepository.findByUserOrderByCreatedAtDesc(user);

        return downloads.stream()
                .map(AudioDownloadResponse::from)
                .collect(Collectors.toList());
    }

    /**
     * Obtiene las ultimas 10 descargas
     */
    @Transactional(readOnly = true)
    public List<AudioDownloadResponse> getRecentDownloads() {
        User user = userService.getCurrentUser();
        List<AudioDownload> downloads = audioDownloadRepository
                .findTop10ByUserIdOrderByCreatedAtDesc(user.getId());

        return downloads.stream()
                .map(AudioDownloadResponse::from)
                .collect(Collectors.toList());
    }

    /**
     * Cuenta descargas del usuario
     */
    @Transactional(readOnly = true)
    public long getUserDownloadCount() {
        User user = userService.getCurrentUser();
        return audioDownloadRepository.countByUserId(user.getId());
    }

    /**
     * Cuenta descargas exitosas de hoy
     */
    @Transactional(readOnly = true)
    public long getTodayDownloadCount() {
        User user = userService.getCurrentUser();
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        return audioDownloadRepository.countTodaySuccessfulDownloads(user.getId(), startOfDay);
    }

    /**
     * Elimina un registro de descarga
     */
    @Transactional
    public void deleteDownloadRecord(Long id) {
        User user = userService.getCurrentUser();
        AudioDownload download = audioDownloadRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Descarga no encontrada"));

        if (!download.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("No tienes permiso para eliminar este registro");
        }

        audioDownloadRepository.delete(download);
        logger.info("Registro de descarga {} eliminado por usuario {}", id, user.getUsername());
    }

    /**
     * Extrae el ID del video de YouTube
     */
    private String extractVideoId(String url) {
        if (url.contains("youtu.be/")) {
            return url.split("youtu.be/")[1].split("[?&]")[0];
        } else if (url.contains("watch?v=")) {
            return url.split("watch\\?v=")[1].split("&")[0];
        }
        return "unknown";
    }
}