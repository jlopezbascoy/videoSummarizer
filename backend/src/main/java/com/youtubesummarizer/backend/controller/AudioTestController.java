package com.youtubesummarizer.backend.controller;

import com.youtubesummarizer.backend.service.YouTubeAudioService;
import com.youtubesummarizer.backend.service.TranscriptionService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.Map;

/**
 * CONTROLADOR DE PRUEBA
 * Eliminar después de verificar que funciona
 */
@RestController
@RequestMapping("/api/test")
@CrossOrigin(origins = "*")
public class AudioTestController {

    private static final Logger logger = LoggerFactory.getLogger(AudioTestController.class);

    @Autowired
    private YouTubeAudioService audioService;

    @Autowired
    private TranscriptionService transcriptionService;

    /**
     * TEST 1: Verificar que Python API está disponible
     * GET /api/test/check-python-api
     */
    @GetMapping("/check-python-api")
    public ResponseEntity<?> checkPythonApi() {
        Map<String, Object> result = new HashMap<>();

        try {
            logger.info("Verificando Python API...");

            boolean isAvailable = audioService.isApiAvailable();

            result.put("pythonApiRunning", isAvailable);
            result.put("message", isAvailable
                    ? "Python API está funcionando correctamente"
                    : "Python API NO está disponible");

            logger.info(isAvailable ? "Python API OK" : "Python API NO disponible");

            return ResponseEntity.ok(result);

        } catch (Exception e) {
            logger.error("Error: {}", e.getMessage());
            result.put("pythonApiRunning", false);
            result.put("error", e.getMessage());
            return ResponseEntity.status(500).body(result);
        }
    }

    /**
     * TEST 2: Descargar audio de YouTube
     * POST /api/test/download
     * Body: { "videoUrl": "https://www.youtube.com/watch?v=VIDEO_ID" }
     */
    @PostMapping("/download")
    public ResponseEntity<?> downloadAudio(@RequestBody Map<String, String> request) {
        Map<String, Object> result = new HashMap<>();
        Path audioFile = null;

        try {
            String videoUrl = request.get("videoUrl");

            if (videoUrl == null || videoUrl.isEmpty()) {
                result.put("success", false);
                result.put("error", "Falta el parámetro 'videoUrl'");
                return ResponseEntity.badRequest().body(result);
            }

            logger.info("Descargando audio de: {}", videoUrl);

            // Descargar el audio
            long startTime = System.currentTimeMillis();
            audioFile = audioService.downloadAudio(videoUrl);
            long downloadTime = System.currentTimeMillis() - startTime;

            // Obtener información del archivo
            long fileSize = Files.size(audioFile);
            String fileName = audioFile.getFileName().toString();
            String filePath = audioFile.toString();

            // Preparar respuesta
            result.put("success", true);
            result.put("message", "Audio descargado correctamente");
            result.put("fileName", fileName);
            result.put("filePath", filePath);
            result.put("fileSizeBytes", fileSize);
            result.put("fileSizeMB", String.format("%.2f MB", fileSize / (1024.0 * 1024.0)));
            result.put("downloadTimeMs", downloadTime);
            result.put("downloadTimeSec", String.format("%.1f segundos", downloadTime / 1000.0));

            logger.info("Descarga completada:");
            logger.info("   Archivo: {}", fileName);
            logger.info("   Tamaño: %.2f MB", fileSize / (1024.0 * 1024.0));
            logger.info("   Tiempo: %.1f segundos", downloadTime / 1000.0);

            return ResponseEntity.ok(result);

        } catch (YouTubeAudioService.AudioDownloadException e) {
            logger.error("Error al descargar: {}", e.getMessage());
            result.put("success", false);
            result.put("error", e.getMessage());
            return ResponseEntity.status(400).body(result);

        } catch (Exception e) {
            logger.error("Error inesperado: {}", e.getMessage(), e);
            result.put("success", false);
            result.put("error", "Error inesperado: " + e.getMessage());
            return ResponseEntity.status(500).body(result);

        } finally {
            if (audioFile != null) {
                audioService.cleanupAudioFile(audioFile);
                logger.info("Archivo temporal eliminado");
            }
        }
    }

    /**
     * TEST 3: Descargar audio SIN eliminar (para inspeccionar el archivo)
     * POST /api/test/download-keep
     * Body: { "videoUrl": "https://www.youtube.com/watch?v=VIDEO_ID" }
     */
    @PostMapping("/download-keep")
    public ResponseEntity<?> downloadAudioKeep(@RequestBody Map<String, String> request) {
        Map<String, Object> result = new HashMap<>();

        try {
            String videoUrl = request.get("videoUrl");

            if (videoUrl == null || videoUrl.isEmpty()) {
                result.put("success", false);
                result.put("error", "Falta el parámetro 'videoUrl'");
                return ResponseEntity.badRequest().body(result);
            }

            logger.info("Descargando audio (sin eliminar): {}", videoUrl);

            Path audioFile = audioService.downloadAudio(videoUrl);
            long fileSize = Files.size(audioFile);

            result.put("success", true);
            result.put("message", "Audio descargado. El archivo NO fue eliminado para que puedas inspeccionarlo.");
            result.put("filePath", audioFile.toString());
            result.put("fileSizeMB", String.format("%.2f MB", fileSize / (1024.0 * 1024.0)));
            result.put("warning", "Recuerda eliminar el archivo manualmente después de inspeccionarlo");

            logger.info("Audio guardado en: {}", audioFile);
            logger.info("ARCHIVO NO ELIMINADO - elimínalo manualmente después");

            return ResponseEntity.ok(result);

        } catch (Exception e) {
            logger.error("Error: {}", e.getMessage(), e);
            result.put("success", false);
            result.put("error", e.getMessage());
            return ResponseEntity.status(500).body(result);
        }
    }

    /**
     * TEST 4: Transcribir audio
     * POST /api/test/transcribe
     * Body: { "videoUrl": "https://www.youtube.com/watch?v=...", "language": "es" }
     */
    @PostMapping("/transcribe")
    public ResponseEntity<?> testTranscribe(@RequestBody Map<String, String> request) {
        Map<String, Object> result = new HashMap<>();
        Path audioFile = null;

        try {
            String videoUrl = request.get("videoUrl");
            String language = request.getOrDefault("language", "es");

            if (videoUrl == null || videoUrl.isEmpty()) {
                result.put("success", false);
                result.put("error", "Falta el parámetro 'videoUrl'");
                return ResponseEntity.badRequest().body(result);
            }

            logger.info("TEST: Transcribiendo video: {}", videoUrl);

            // Paso 1: Descargar audio
            logger.info("Paso 1: Descargando audio...");
            long startTime = System.currentTimeMillis();
            audioFile = audioService.downloadAudio(videoUrl);
            long downloadTime = System.currentTimeMillis() - startTime;
            long audioSize = Files.size(audioFile);

            // Paso 2: Transcribir
            logger.info("Paso 2: Transcribiendo audio...");
            long transcribeStart = System.currentTimeMillis();
            String transcription = transcriptionService.transcribeAudio(audioFile, language);
            long transcribeTime = System.currentTimeMillis() - transcribeStart;

            // Limitar preview
            String preview = transcription.length() > 500
                    ? transcription.substring(0, 500) + "..."
                    : transcription;

            result.put("success", true);
            result.put("transcriptionLength", transcription.length());
            result.put("transcriptionPreview", preview);
            result.put("audioSizeMB", String.format("%.2f MB", audioSize / (1024.0 * 1024.0)));
            result.put("language", language);
            result.put("downloadTimeMs", downloadTime);
            result.put("transcribeTimeMs", transcribeTime);
            result.put("totalTimeSec", String.format("%.1f segundos", (downloadTime + transcribeTime) / 1000.0));
            result.put("message", "Transcripcion completada");

            logger.info("Transcripcion completada: {} caracteres", transcription.length());
            logger.info("Tiempo total: %.1f segundos", (downloadTime + transcribeTime) / 1000.0);

            return ResponseEntity.ok(result);

        } catch (Exception e) {
            logger.error("Error en transcripcion: {}", e.getMessage(), e);
            result.put("success", false);
            result.put("error", e.getMessage());
            return ResponseEntity.status(500).body(result);
        } finally {
            if (audioFile != null) {
                audioService.cleanupAudioFile(audioFile);
                logger.info("Archivo temporal eliminado");
            }
        }
    }
}