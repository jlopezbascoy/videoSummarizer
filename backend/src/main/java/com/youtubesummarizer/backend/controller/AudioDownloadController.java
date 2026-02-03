package com.youtubesummarizer.backend.controller;

import com.youtubesummarizer.backend.dto.AudioDownloadResponse;
import com.youtubesummarizer.backend.service.AudioDownloadManagementService;
import jakarta.validation.constraints.NotBlank;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Controlador para descargas de audio de YouTube
 * Permite a usuarios descargar audio de videos
 */
@RestController
@RequestMapping("/api/audio")
@CrossOrigin(origins = "*")
public class AudioDownloadController {

    private static final Logger logger = LoggerFactory.getLogger(AudioDownloadController.class);

    @Autowired
    private AudioDownloadManagementService audioDownloadService;

    /**
     * Descarga audio de un video de YouTube
     * POST /api/audio/download
     * Body: { "videoUrl": "https://www.youtube.com/watch?v=..." }
     *
     * Retorna el archivo MP3 directamente
     */
    @PostMapping("/download")
    public ResponseEntity<Resource> downloadAudio(@RequestBody Map<String, String> request) {
        try {
            String videoUrl = request.get("videoUrl");

            if (videoUrl == null || videoUrl.isEmpty()) {
                throw new IllegalArgumentException("La URL del video es obligatoria");
            }

            logger.info("Solicitando descarga de: {}", videoUrl);

            return audioDownloadService.downloadAudioForUser(videoUrl);

        } catch (IllegalArgumentException e) {
            logger.error("Parametros invalidos: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            logger.error("Error al descargar audio: {}", e.getMessage(), e);
            throw new RuntimeException("Error al descargar audio: " + e.getMessage());
        }
    }

    /**
     * Obtiene el historial de descargas del usuario
     * GET /api/audio/history
     */
    @GetMapping("/history")
    public ResponseEntity<List<AudioDownloadResponse>> getDownloadHistory() {
        try {
            List<AudioDownloadResponse> history = audioDownloadService.getUserDownloadHistory();
            return ResponseEntity.ok(history);
        } catch (Exception e) {
            logger.error("Error al obtener historial: {}", e.getMessage());
            throw new RuntimeException("Error al obtener historial de descargas");
        }
    }

    /**
     * Obtiene las ultimas 10 descargas
     * GET /api/audio/recent
     */
    @GetMapping("/recent")
    public ResponseEntity<List<AudioDownloadResponse>> getRecentDownloads() {
        try {
            List<AudioDownloadResponse> recent = audioDownloadService.getRecentDownloads();
            return ResponseEntity.ok(recent);
        } catch (Exception e) {
            logger.error("Error al obtener descargas recientes: {}", e.getMessage());
            throw new RuntimeException("Error al obtener descargas recientes");
        }
    }

    /**
     * Obtiene estadisticas de descargas
     * GET /api/audio/stats
     */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getDownloadStats() {
        try {
            long totalDownloads = audioDownloadService.getUserDownloadCount();
            long todayDownloads = audioDownloadService.getTodayDownloadCount();

            Map<String, Object> stats = new HashMap<>();
            stats.put("totalDownloads", totalDownloads);
            stats.put("todayDownloads", todayDownloads);

            return ResponseEntity.ok(stats);

        } catch (Exception e) {
            logger.error("Error al obtener estadisticas: {}", e.getMessage());
            throw new RuntimeException("Error al obtener estadisticas");
        }
    }

    /**
     * Elimina un registro de descarga
     * DELETE /api/audio/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteDownload(@PathVariable Long id) {
        try {
            audioDownloadService.deleteDownloadRecord(id);

            Map<String, String> response = new HashMap<>();
            response.put("message", "Registro eliminado correctamente");

            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {
            logger.error("Error al eliminar descarga: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            logger.error("Error inesperado: {}", e.getMessage());
            throw new RuntimeException("Error al eliminar registro");
        }
    }
}