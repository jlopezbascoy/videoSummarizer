package com.youtubesummarizer.backend.service;

import com.youtubesummarizer.backend.dto.SummaryRequest;
import com.youtubesummarizer.backend.dto.SummaryResponse;
import com.youtubesummarizer.backend.dto.YouTubeVideoResponse;
import com.youtubesummarizer.backend.exception.YouTubeApiException;
import com.youtubesummarizer.backend.model.Summary;
import com.youtubesummarizer.backend.model.User;
import com.youtubesummarizer.backend.repository.SummaryRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Service de resúmenes
 * Gestiona la creación y consulta de resúmenes de videos
 */
@Slf4j
@Service
public class SummaryService {

    @Autowired
    private SummaryRepository summaryRepository;

    @Autowired
    private UserService userService;

    @Autowired
    private RateLimitService rateLimitService;
    
    @Autowired
    private YouTubeService youTubeService;

/**
     * Genera un resumen de un video de YouTube usando YouTube Data API
     */
    @Transactional
    public SummaryResponse generateSummary(SummaryRequest request) {
        log.info("Iniciando generación de resumen para URL: {}", request.getVideoUrl());
        
        // Obtener usuario actual
        User user = userService.getCurrentUser();

        // Verificar límite de peticiones
        if (!rateLimitService.canMakeRequest(user)) {
            throw new RuntimeException("Has alcanzado el límite de resúmenes diarios. " +
                    "Límite: " + user.getDailyLimit() + " resúmenes por día.");
        }

        try {
            // Paso 1: Validar y extraer ID del video
            String videoId = youTubeService.extractVideoId(request.getVideoUrl());
            log.info("ID de video extraído: {}", videoId);

            // Paso 2: Obtener información del video desde YouTube API
            YouTubeVideoResponse videoInfo = youTubeService.getVideoInfo(videoId);
            log.info("Información del video obtenida: {}", videoInfo.getTitle());

            // Paso 3: Obtener transcripción (si está disponible)
            String transcript = youTubeService.getVideoTranscript(videoId, request.getLanguage());
            
            // Paso 4: Verificar duración del video según tipo de usuario
            if (videoInfo.getDuration() != null && !videoInfo.getDuration().isEmpty()) {
                int videoDurationSeconds = parseDuration(videoInfo.getDuration());
                int maxDuration = user.getMaxVideoDuration();
                
                if (videoDurationSeconds > maxDuration) {
                    throw new RuntimeException("El video excede la duración máxima permitida para tu tipo de usuario. " +
                            "Duración del video: " + formatDuration(videoDurationSeconds) + 
                            ", Máximo permitido: " + formatDuration(maxDuration));
                }
            }

            // Paso 5: Generar resumen (temporalmente usamos la descripción/transcripción)
            String summaryText = generateSummaryFromContent(videoInfo, transcript, request);
            
            // Estimar número de palabras
            int wordCount = summaryText.split("\\s+").length;

            // Paso 6: Crear y guardar el resumen
            Summary summary = Summary.create(
                    user,
                    request.getVideoUrl(),
                    videoInfo.getTitle(),
                    summaryText,
                    request.getLanguage(),
                    wordCount,
                    videoInfo.getDuration() != null ? parseDuration(videoInfo.getDuration()) : 0
            );

            summaryRepository.save(summary);
            log.info("Resumen guardado exitosamente para video: {}", videoInfo.getTitle());

            // Paso 7: Incrementar contador de uso
            rateLimitService.incrementUsage(user);

            // Paso 8: Obtener peticiones restantes
            int remainingRequests = rateLimitService.getRemainingRequests(user);

            // Retornar respuesta
            return SummaryResponse.from(summary, remainingRequests);

        } catch (YouTubeApiException e) {
            log.error("Error de YouTube API: {}", e.getMessage());
            throw new RuntimeException("Error al procesar el video de YouTube: " + e.getMessage());
        } catch (Exception e) {
            log.error("Error inesperado generando resumen: {}", e.getMessage(), e);
            throw new RuntimeException("Error al generar el resumen: " + e.getMessage());
        }
    }
    
    /**
     * Genera un resumen basado en el contenido del video
     * TEMPORAL: Esta es una implementación básica. En la próxima fase integraremos Claude API
     */
    private String generateSummaryFromContent(YouTubeVideoResponse videoInfo, String transcript, SummaryRequest request) {
        StringBuilder content = new StringBuilder();
        
        // Agregar título
        content.append("Título: ").append(videoInfo.getTitle()).append("\n\n");
        
        // Agregar descripción si existe
        if (videoInfo.getDescription() != null && !videoInfo.getDescription().trim().isEmpty()) {
            content.append("Descripción: ").append(videoInfo.getDescription()).append("\n\n");
        }
        
        // Agregar transcripción si existe
        if (transcript != null && !transcript.trim().isEmpty()) {
            content.append("Transcripción: ").append(transcript).append("\n\n");
        } else {
            content.append("Nota: No se pudo obtener la transcripción del video.\n");
        }
        
        // TEMPORAL: Generar resumen básico
        String fullContent = content.toString();
        
        // Aquí irá la integración con Claude API
        // Por ahora, creamos un resumen simple basado en el contenido disponible
        String summary;
        
        if (fullContent.length() > 1000) {
            summary = fullContent.substring(0, 1000) + "...";
        } else {
            summary = fullContent;
        }
        
        // Ajustar longitud según el rango solicitado
        return adjustSummaryLength(summary, request.getWordCountRange());
    }
    
    /**
     * Ajusta el resumen al rango de palabras solicitado
     */
    private String adjustSummaryLength(String summary, String wordCountRange) {
        String[] words = summary.split("\\s+");
        int currentWordCount = words.length;
        
        int targetWords;
        switch (wordCountRange) {
            case "100-200":
                targetWords = 150;
                break;
            case "200-400":
                targetWords = 300;
                break;
            case "400-600":
                targetWords = 500;
                break;
            default:
                targetWords = 150;
        }
        
        if (currentWordCount <= targetWords) {
            return summary;
        }
        
        // Truncar al número de palabras objetivo
        String[] truncatedWords = new String[targetWords];
        System.arraycopy(words, 0, truncatedWords, 0, targetWords);
        
        return String.join(" ", truncatedWords) + "...";
    }
    
    /**
     * Convierte duración ISO 8601 a segundos
     */
    private int parseDuration(String isoDuration) {
        try {
            // YouTube usa formato PT4M13S (4 minutos 13 segundos)
            String cleaned = isoDuration.replace("PT", "");
            
            int hours = 0, minutes = 0, seconds = 0;
            
            if (cleaned.contains("H")) {
                hours = Integer.parseInt(cleaned.substring(0, cleaned.indexOf("H")));
                cleaned = cleaned.substring(cleaned.indexOf("H") + 1);
            }
            
            if (cleaned.contains("M")) {
                minutes = Integer.parseInt(cleaned.substring(0, cleaned.indexOf("M")));
                cleaned = cleaned.substring(cleaned.indexOf("M") + 1);
            }
            
            if (cleaned.contains("S")) {
                seconds = Integer.parseInt(cleaned.substring(0, cleaned.indexOf("S")));
            }
            
            return hours * 3600 + minutes * 60 + seconds;
        } catch (Exception e) {
            log.warn("Error parseando duración: {}", isoDuration);
            return 0;
        }
    }
    
    /**
     * Formatea segundos a un formato legible
     */
    private String formatDuration(int seconds) {
        int hours = seconds / 3600;
        int minutes = (seconds % 3600) / 60;
        int secs = seconds % 60;
        
        if (hours > 0) {
            return String.format("%d:%02d:%02d", hours, minutes, secs);
        } else {
            return String.format("%d:%02d", minutes, secs);
        }
    }

    /**
     * Obtiene el historial de resúmenes del usuario actual
     */
    @Transactional(readOnly = true)
    public List<SummaryResponse> getUserSummaries() {
        User user = userService.getCurrentUser();

        List<Summary> summaries = summaryRepository.findByUserOrderByCreatedAtDesc(user);

        return summaries.stream()
                .map(SummaryResponse::from)
                .collect(Collectors.toList());
    }

    /**
     * Obtiene los últimos N resúmenes del usuario
     */
    @Transactional(readOnly = true)
    public List<SummaryResponse> getRecentSummaries(int limit) {
        User user = userService.getCurrentUser();

        List<Summary> summaries = summaryRepository.findTop10ByUserIdOrderByCreatedAtDesc(user.getId());

        return summaries.stream()
                .limit(limit)
                .map(SummaryResponse::from)
                .collect(Collectors.toList());
    }

    /**
     * Obtiene un resumen por ID
     */
    @Transactional(readOnly = true)
    public SummaryResponse getSummaryById(Long id) {
        User user = userService.getCurrentUser();

        Summary summary = summaryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Resumen no encontrado"));

        // Verificar que el resumen pertenece al usuario
        if (!summary.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("No tienes permiso para ver este resumen");
        }

        return SummaryResponse.from(summary);
    }

    /**
     * Elimina un resumen
     */
    @Transactional
    public void deleteSummary(Long id) {
        User user = userService.getCurrentUser();

        Summary summary = summaryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Resumen no encontrado"));

        // Verificar que el resumen pertenece al usuario
        if (!summary.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("No tienes permiso para eliminar este resumen");
        }

        summaryRepository.delete(summary);
    }

    /**
     * Obtiene el conteo total de resúmenes del usuario
     */
    @Transactional(readOnly = true)
    public long getUserSummaryCount() {
        User user = userService.getCurrentUser();
        return summaryRepository.countByUserId(user.getId());
    }
}