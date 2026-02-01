package com.youtubesummarizer.backend.service;

import com.youtubesummarizer.backend.dto.SummaryRequest;
import com.youtubesummarizer.backend.dto.SummaryResponse;
import com.youtubesummarizer.backend.model.Summary;
import com.youtubesummarizer.backend.model.User;
import com.youtubesummarizer.backend.repository.SummaryRepository;
import com.youtubesummarizer.backend.service.GeminiService.GeminiException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.file.Path;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Servicio de resumenes con flujo completo: Audio → Transcripcion → Resumen
 */
@Service
public class SummaryService {

    private static final Logger logger = LoggerFactory.getLogger(SummaryService.class);

    @Autowired
    private SummaryRepository summaryRepository;

    @Autowired
    private UserService userService;

    @Autowired
    private RateLimitService rateLimitService;

    @Autowired
    private YouTubeAudioService audioService;

    @Autowired
    private TranscriptionService transcriptionService;

    @Autowired
    private GeminiService geminiService;

    /**
     * Genera un resumen de un video de YouTube
     * Flujo: Descargar Audio → Transcribir → Resumir → Guardar
     */
    @Transactional
    public SummaryResponse generateSummary(SummaryRequest request) {
        User user = userService.getCurrentUser();

        logger.info("Usuario {} solicita resumen para: {}", user.getUsername(), request.getVideoUrl());

        // 1. Verificar limite de peticiones
        if (!rateLimitService.canMakeRequest(user)) {
            int dailyLimit = user.getDailyLimit();
            throw new RuntimeException(
                    "Has alcanzado el limite de resumenes diarios. " +
                            "Limite: " + dailyLimit + " resumenes por dia."
            );
        }

        // 2. Normalizar URL del video
        String normalizedUrl = normalizeYouTubeUrl(request.getVideoUrl());

        // 3. Buscar en cache (resumen existente para esta URL e idioma)
        Optional<Summary> cachedSummary = summaryRepository.findFirstByVideoUrlAndLanguageOrderByCreatedAtDesc(
                normalizedUrl,
                request.getLanguage()
        );

        String summaryText;
        String videoTitle;
        int wordCount;

        if (cachedSummary.isPresent()) {
            // Usar resumen cacheado
            logger.info("Resumen encontrado en cache para {}", normalizedUrl);
            Summary cached = cachedSummary.get();
            summaryText = cached.getSummaryText();
            videoTitle = cached.getVideoTitle();
            wordCount = cached.getWordCount();
        } else {
            // Generar nuevo resumen
            logger.info("Generando nuevo resumen para {}", normalizedUrl);

            Path audioFile = null;
            try {
                // Paso 1: Descargar audio
                logger.info("PASO 1/3: Descargando audio...");
                audioFile = audioService.downloadAudio(normalizedUrl);
                logger.info("Audio descargado exitosamente");

                // Paso 2: Transcribir audio
                logger.info("PASO 2/3: Transcribiendo audio a texto...");
                String transcription = transcriptionService.transcribeAudio(audioFile, request.getLanguage());
                logger.info("Transcripcion completada: {} caracteres", transcription.length());

                // Paso 3: Generar resumen
                logger.info("PASO 3/3: Generando resumen con IA...");
                videoTitle = extractVideoTitle(normalizedUrl);
                summaryText = geminiService.summarizeTranscription(
                        transcription,
                        videoTitle,
                        request.getLanguage(),
                        request.getMinWords(),
                        request.getMaxWords()
                );
                wordCount = countWords(summaryText);

                logger.info("Resumen generado exitosamente: {} palabras", wordCount);

            } catch (YouTubeAudioService.AudioDownloadException e) {
                logger.error("Error al descargar audio: {}", e.getMessage());
                throw new RuntimeException("No se pudo descargar el audio del video. Verifica que la URL sea valida y el video este disponible.");
            } catch (TranscriptionService.TranscriptionException e) {
                logger.error("Error al transcribir: {}", e.getMessage());
                throw new RuntimeException("No se pudo transcribir el audio. El video puede ser muy largo o el audio no es claro.");
            } catch (GeminiException e) {
                logger.error("Error de IA: {}", e.getMessage());
                handleGeminiError(e);
                throw e;
            } catch (Exception e) {
                logger.error("Error inesperado al generar resumen: {}", e.getMessage(), e);
                throw new RuntimeException("Error al generar resumen: " + e.getMessage());
            } finally {
                // Limpiar archivo de audio temporal
                if (audioFile != null) {
                    audioService.cleanupAudioFile(audioFile);
                }
            }
        }

        // 4. Crear y guardar el resumen para este usuario
        Summary summary = Summary.create(
                user,
                normalizedUrl,
                videoTitle,
                summaryText,
                request.getLanguage(),
                wordCount,
                null
        );

        summaryRepository.save(summary);

        // 5. Incrementar contador de uso
        rateLimitService.incrementUsage(user);

        // 6. Obtener peticiones restantes
        int remainingRequests = rateLimitService.getRemainingRequests(user);

        logger.info("Resumen guardado para usuario {}. Peticiones restantes: {}",
                user.getUsername(), remainingRequests);

        // 7. Retornar respuesta
        return SummaryResponse.from(summary, remainingRequests);
    }

    /**
     * Normaliza la URL de YouTube para el cache
     */
    private String normalizeYouTubeUrl(String url) {
        String videoId = extractVideoId(url);
        return "https://www.youtube.com/watch?v=" + videoId;
    }

    /**
     * Extrae el ID del video de una URL de YouTube
     */
    private String extractVideoId(String url) {
        String[] patterns = {
                "(?:youtube\\.com\\/watch\\?v=|youtu\\.be\\/)([a-zA-Z0-9_-]{11})",
                "youtube\\.com\\/embed\\/([a-zA-Z0-9_-]{11})",
                "youtube\\.com\\/v\\/([a-zA-Z0-9_-]{11})"
        };

        for (String pattern : patterns) {
            java.util.regex.Pattern p = java.util.regex.Pattern.compile(pattern);
            java.util.regex.Matcher m = p.matcher(url);
            if (m.find()) {
                return m.group(1);
            }
        }

        if (url.matches("^[a-zA-Z0-9_-]{11}$")) {
            return url;
        }

        throw new RuntimeException("URL de YouTube invalida: " + url);
    }

    /**
     * Extrae el titulo del video
     */
    private String extractVideoTitle(String url) {
        String videoId = extractVideoId(url);
        return "Video de YouTube - " + videoId;
    }

    /**
     * Cuenta palabras en un texto
     */
    private int countWords(String text) {
        if (text == null || text.trim().isEmpty()) {
            return 0;
        }
        return text.trim().split("\\s+").length;
    }

    /**
     * Maneja errores de IA y los convierte en mensajes amigables
     */
    private void handleGeminiError(GeminiException e) {
        String message = e.getMessage().toLowerCase();

        if (message.contains("limite") || message.contains("limit") || message.contains("429") || message.contains("quota")) {
            throw new RuntimeException(
                    "Hemos alcanzado el limite de peticiones a la IA. " +
                            "Por favor, intenta de nuevo en unos minutos."
            );
        } else if (message.contains("api key") || message.contains("403") || message.contains("unauthorized")) {
            throw new RuntimeException(
                    "Error de configuracion del servicio. Por favor, contacta al administrador."
            );
        } else if (message.contains("no disponible") || message.contains("503") || message.contains("500") || message.contains("unavailable")) {
            throw new RuntimeException(
                    "El servicio de IA no esta disponible temporalmente. Intenta de nuevo en unos minutos."
            );
        } else {
            throw new RuntimeException(
                    "Error al generar el resumen. Por favor, intenta de nuevo mas tarde."
            );
        }
    }

    // ========== Metodos existentes de consulta ==========

    @Transactional(readOnly = true)
    public List<SummaryResponse> getUserSummaries() {
        User user = userService.getCurrentUser();
        List<Summary> summaries = summaryRepository.findByUserOrderByCreatedAtDesc(user);

        return summaries.stream()
                .map(SummaryResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<SummaryResponse> getRecentSummaries(int limit) {
        User user = userService.getCurrentUser();
        List<Summary> summaries = summaryRepository.findTop10ByUserIdOrderByCreatedAtDesc(user.getId());

        return summaries.stream()
                .limit(limit)
                .map(SummaryResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public SummaryResponse getSummaryById(Long id) {
        User user = userService.getCurrentUser();
        Summary summary = summaryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Resumen no encontrado"));

        if (!summary.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("No tienes permiso para ver este resumen");
        }

        return SummaryResponse.from(summary);
    }

    @Transactional
    public void deleteSummary(Long id) {
        User user = userService.getCurrentUser();
        Summary summary = summaryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Resumen no encontrado"));

        if (!summary.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("No tienes permiso para eliminar este resumen");
        }

        summaryRepository.delete(summary);
        logger.info("Resumen {} eliminado por usuario {}", id, user.getUsername());
    }

    @Transactional(readOnly = true)
    public long getUserSummaryCount() {
        User user = userService.getCurrentUser();
        return summaryRepository.countByUserId(user.getId());
    }
}