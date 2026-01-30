package com.youtubesummarizer.backend.service;

import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.JsonFactory;
import com.google.api.client.json.jackson2.JacksonFactory;
import com.google.api.services.youtube.YouTube;
import com.google.api.services.youtube.model.*;
import com.youtubesummarizer.backend.dto.YouTubeVideoResponse;
import com.youtubesummarizer.backend.exception.YouTubeApiException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Servicio para integración con YouTube Data API
 * Permite obtener información de videos y transcripciones
 */
@Slf4j
@Service
public class YouTubeService {
    
    private static final String APPLICATION_NAME = "YouTube Summarizer Backend";
    private static final JsonFactory JSON_FACTORY = JacksonFactory.getDefaultInstance();
    private static final Pattern YOUTUBE_URL_PATTERN = Pattern.compile(
        "^(?:https?:\\/\\/)?(?:www\\.)?(?:youtu\\.be\\/|youtube\\.com\\/(?:embed\\/|v\\/|watch\\?v=|watch\\?.+&v=))([a-zA-Z0-9_-]{11})$"
    );
    
    @Value("${youtube.api.key}")
    private String youtubeApiKey;
    
    private final RestTemplate restTemplate = new RestTemplate();
    
    /**
     * Extrae el ID del video de una URL de YouTube
     */
    public String extractVideoId(String videoUrl) {
        if (videoUrl == null || videoUrl.trim().isEmpty()) {
            throw new YouTubeApiException("URL de YouTube inválida");
        }
        
        // Limpiar URL
        String cleanUrl = videoUrl.trim();
        
        // Si es solo el ID, retornarlo directamente
        if (cleanUrl.matches("^[a-zA-Z0-9_-]{11}$")) {
            return cleanUrl;
        }
        
        // Extraer ID de URL completa
        Matcher matcher = YOUTUBE_URL_PATTERN.matcher(cleanUrl);
        if (matcher.find()) {
            return matcher.group(1);
        }
        
        throw new YouTubeApiException("No se pudo extraer el ID del video de la URL: " + videoUrl);
    }
    
    /**
     * Obtiene información detallada de un video de YouTube
     */
    public YouTubeVideoResponse getVideoInfo(String videoId) {
        try {
            NetHttpTransport httpTransport = GoogleNetHttpTransport.newTrustedTransport();
            YouTube youtube = new YouTube.Builder(httpTransport, JSON_FACTORY, null)
                    .setApplicationName(APPLICATION_NAME)
                    .build();
            
            // Solicitar información básica del video
            YouTube.Videos.List listVideosRequest = youtube.videos()
                    .list("snippet,contentDetails,statistics")
                    .setKey(youtubeApiKey)
                    .setId(videoId);
            
            VideoListResponse response = listVideosRequest.execute();
            
            if (response.getItems().isEmpty()) {
                throw new YouTubeApiException("Video no encontrado: " + videoId);
            }
            
            Video video = response.getItems().get(0);
            return convertToDto(video);
            
        } catch (Exception e) {
            log.error("Error obteniendo información del video {}: {}", videoId, e.getMessage());
            throw new YouTubeApiException("Error al obtener información del video: " + e.getMessage());
        }
    }
    
    /**
     * Obtiene la transcripción del video usando un método alternativo
     * NOTA: YouTube no tiene una API directa para transcripciones, 
     * por lo que usaremos un servicio de terceros o scraping si es necesario
     */
    public String getVideoTranscript(String videoId, String language) {
        try {
            // Método 1: Intentar usar Caption API de YouTube (limitado)
            String transcript = fetchCaptionsFromYouTube(videoId, language);
            
            if (transcript != null && !transcript.trim().isEmpty()) {
                return transcript;
            }
            
            // Método 2: Usar servicio de terceros si la API de YouTube falla
            // Aquí podrías integrar con servicios como:
            // - AssemblyAI
            // - Deepgram
            // - Google Speech-to-Text
            
            log.warn("No se pudo obtener transcripción directa para video {}", videoId);
            return "Transcripción no disponible para este video. El contenido del video será procesado basándose en metadatos disponibles.";
            
        } catch (Exception e) {
            log.error("Error obteniendo transcripción del video {}: {}", videoId, e.getMessage());
            throw new YouTubeApiException("Error al obtener transcripción: " + e.getMessage());
        }
    }
    
    /**
     * Intenta obtener captions/subtítulos usando la API de YouTube
     */
    private String fetchCaptionsFromYouTube(String videoId, String language) {
        try {
            NetHttpTransport httpTransport = GoogleNetHttpTransport.newTrustedTransport();
            YouTube youtube = new YouTube.Builder(httpTransport, JSON_FACTORY, null)
                    .setApplicationName(APPLICATION_NAME)
                    .build();
            
            YouTube.Captions.List listCaptionsRequest = youtube.captions()
                    .list("snippet")
                    .setKey(youtubeApiKey)
                    .setVideoId(videoId);
            
            CaptionListResponse captionResponse = listCaptionsRequest.execute();
            
            if (captionResponse.getItems().isEmpty()) {
                log.info("No captions found for video {}", videoId);
                return null;
            }
            
            // Buscar caption en el idioma deseado
            Caption targetCaption = null;
            for (Caption caption : captionResponse.getItems()) {
                String captionLanguage = caption.getSnippet().getLanguage();
                if (captionLanguage.startsWith(language)) {
                    targetCaption = caption;
                    break;
                }
            }
            
            if (targetCaption == null) {
                targetCaption = captionResponse.getItems().get(0); // Usar el primero disponible
            }
            
            // Download caption content
            YouTube.Captions.Download downloadRequest = youtube.captions()
                    .download(targetCaption.getId())
                    .setKey(youtubeApiKey)
                    .setTfmt("srt"); // Formato SRT
            
            // NOTA: La descarga de captions requiere OAuth y autenticación adicional
            // Por ahora, devolvemos null y usaremos métodos alternativos
            return null;
            
        } catch (Exception e) {
            log.debug("Error fetching captions from YouTube API: {}", e.getMessage());
            return null;
        }
    }
    
    /**
     * Convierte un Video de YouTube API a nuestro DTO
     */
    private YouTubeVideoResponse convertToDto(Video video) {
        VideoSnippet snippet = video.getSnippet();
        VideoContentDetails contentDetails = video.getContentDetails();
        VideoStatistics statistics = video.getStatistics();
        
        return YouTubeVideoResponse.builder()
                .videoId(video.getId())
                .title(snippet.getTitle())
                .description(snippet.getDescription())
                .channelTitle(snippet.getChannelTitle())
                .publishedAt(snippet.getPublishedAt().toString())
                .duration(contentDetails.getDuration())
                .viewCount(statistics.getViewCount() != null ? statistics.getViewCount().toString() : "0")
                .likeCount(statistics.getLikeCount() != null ? statistics.getLikeCount().toString() : "0")
                .thumbnailUrl(snippet.getThumbnails().getHigh() != null ? 
                    snippet.getThumbnails().getHigh().getUrl() : 
                    snippet.getThumbnails().getDefault().getUrl())
                .hasTranscript(false) // Se actualizará después de intentar obtener transcripción
                .transcriptLanguage("")
                .transcriptText("")
                .transcriptLength(0L)
                .build();
    }
    
    /**
     * Convierte duración ISO 8601 a segundos
     */
    private Integer parseDuration(String isoDuration) {
        try {
            Duration duration = Duration.parse("PT" + isoDuration.substring(2));
            return (int) duration.getSeconds();
        } catch (Exception e) {
            log.warn("Error parsing duration: {}", isoDuration);
            return 0;
        }
    }
    
    /**
     * Valida si una URL de YouTube es válida
     */
    public boolean isValidYouTubeUrl(String url) {
        try {
            extractVideoId(url);
            return true;
        } catch (YouTubeApiException e) {
            return false;
        }
    }
}