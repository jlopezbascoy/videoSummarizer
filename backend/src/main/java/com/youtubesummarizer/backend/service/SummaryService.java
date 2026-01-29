package com.youtubesummarizer.backend.service;

import com.youtubesummarizer.backend.dto.SummaryRequest;
import com.youtubesummarizer.backend.dto.SummaryResponse;
import com.youtubesummarizer.backend.model.Summary;
import com.youtubesummarizer.backend.model.User;
import com.youtubesummarizer.backend.repository.SummaryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Service de resúmenes
 * Gestiona la creación y consulta de resúmenes de videos
 */
@Service
public class SummaryService {

    @Autowired
    private SummaryRepository summaryRepository;

    @Autowired
    private UserService userService;

    @Autowired
    private RateLimitService rateLimitService;

    /**
     * Genera un resumen de un video de YouTube
     * TODO: Implementar integración con YouTube API y Claude API
     */
    @Transactional
    public SummaryResponse generateSummary(SummaryRequest request) {
        // Obtener usuario actual
        User user = userService.getCurrentUser();

        // Verificar límite de peticiones
        if (!rateLimitService.canMakeRequest(user)) {
            throw new RuntimeException("Has alcanzado el límite de resúmenes diarios. " +
                    "Límite: " + user.getDailyLimit() + " resúmenes por día.");
        }

        // TODO: Aquí irá la integración con YouTube API para obtener transcripción
        // TODO: Aquí irá la integración con Claude API para generar el resumen

        // Por ahora, creamos un resumen de prueba
        String videoId = request.extractVideoId();
        String videoTitle = "Video de prueba - " + videoId;
        String summaryText = "Este es un resumen de prueba. En la siguiente fase integraremos " +
                "la API de YouTube para obtener la transcripción y Claude API para generar " +
                "el resumen real del video.";

        // Crear y guardar el resumen
        Summary summary = Summary.create(
                user,
                request.getVideoUrl(),
                videoTitle,
                summaryText,
                request.getLanguage(),
                150, // palabras aproximadas
                300  // duración en segundos (ejemplo)
        );

        summaryRepository.save(summary);

        // Incrementar contador de uso
        rateLimitService.incrementUsage(user);

        // Obtener peticiones restantes
        int remainingRequests = rateLimitService.getRemainingRequests(user);

        // Retornar respuesta
        return SummaryResponse.from(summary, remainingRequests);
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