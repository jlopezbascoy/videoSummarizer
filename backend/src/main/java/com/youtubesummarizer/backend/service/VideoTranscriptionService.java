package com.youtubesummarizer.backend.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.concurrent.TimeUnit;

/**
 * Servicio para extraer transcripciones usando yt-dlp y servicios de terceros
 * Alternativa real cuando YouTube Data API es limitante
 */
@Slf4j
@Service
public class VideoTranscriptionService {
    
    @Value("${transcription.service.url:}")
    private String transcriptionServiceUrl;
    
    @Value("${transcription.api.key:}")
    private String transcriptionApiKey;
    
    private final RestTemplate restTemplate = new RestTemplate();
    
    /**
     * Obtiene transcripción usando método híbrido
     * 1. Intenta subtítulos via yt-dlp
     * 2. Si falla, usa servicio ASR
     */
    public String getTranscription(String videoUrl, String language) {
        try {
            // Método 1: Extraer subtítulos con yt-dlp
            String subtitles = extractSubtitlesWithYtdlp(videoUrl, language);
            if (subtitles != null && !subtitles.trim().isEmpty()) {
                log.info("Transcripción obtenida via subtítulos: {} caracteres", subtitles.length());
                return subtitles;
            }
            
            // Método 2: Transcripción con servicio ASR
            if (transcriptionServiceUrl != null && !transcriptionServiceUrl.isEmpty()) {
                String asrTranscript = transcribeWithASR(videoUrl, language);
                if (asrTranscript != null) {
                    log.info("Transcripción obtenida via ASR: {} caracteres", asrTranscript.length());
                    return asrTranscript;
                }
            }
            
            log.warn("No se pudo obtener transcripción para video: {}", videoUrl);
            return null;
            
        } catch (Exception e) {
            log.error("Error en transcripción: {}", e.getMessage());
            return null;
        }
    }
    
    /**
     * Extrae subtítulos usando yt-dlp (requiere yt-dlp instalado en el servidor)
     */
    private String extractSubtitlesWithYtdlp(String videoUrl, String language) {
        try {
            log.info("Intentando extraer subtítulos con yt-dlp para: {}", videoUrl);
            
            ProcessBuilder pb = new ProcessBuilder(
                "yt-dlp",
                "--write-subs", 
                "--write-auto-subs",
                "--sub-langs", language + ",en,es",
                "--skip-download",
                "--output", "/tmp/%(title)s.%(ext)s",
                videoUrl
            );
            
            Process process = pb.start();
            boolean finished = process.waitFor(2, TimeUnit.MINUTES);
            
            if (!finished) {
                process.destroyForcibly();
                log.warn("Timeout extrayendo subtítulos con yt-dlp");
                return null;
            }
            
            // Leer archivo de subtítulos generado
            // Aquí deberías leer el archivo .vtt o .srt generado
            // Por simplicidad, retornamos null en este ejemplo
            log.info("yt-dlp completado, leyendo archivo de subtítulos...");
            
            return null; // TODO: Implementar lectura del archivo de subtítulos
            
        } catch (Exception e) {
            log.debug("Error con yt-dlp: {}", e.getMessage());
            return null;
        }
    }
    
    /**
     * Transcribe audio usando servicio ASR externo
     */
    private String transcribeWithASR(String videoUrl, String language) {
        try {
            // Ejemplo con AssemblyAI
            if (transcriptionServiceUrl.contains("assemblyai")) {
                return transcribeWithAssemblyAI(videoUrl, language);
            }
            
            // Ejemplo con Deepgram
            if (transcriptionServiceUrl.contains("deepgram")) {
                return transcribeWithDeepgram(videoUrl, language);
            }
            
            log.warn("Servicio de transcripción no soportado: {}", transcriptionServiceUrl);
            return null;
            
        } catch (Exception e) {
            log.error("Error con servicio ASR: {}", e.getMessage());
            return null;
        }
    }
    
    /**
     * Transcripción con AssemblyAI
     */
    private String transcribeWithAssemblyAI(String videoUrl, String language) {
        try {
            // Crear transcripción
            String requestBody = String.format("""
                {
                  "audio_url": "%s",
                  "language_code": "%s",
                  "auto_highlights": true,
                  "punctuate": true,
                  "format_text": true
                }
                """, videoUrl, getAssemblyAILanguageCode(language));
            
            var headers = new org.springframework.http.HttpHeaders();
            headers.set("Authorization", transcriptionApiKey);
            headers.set("Content-Type", "application/json");
            
            var entity = new org.springframework.http.HttpEntity<>(requestBody, headers);
            var response = restTemplate.postForObject(
                transcriptionServiceUrl + "/v2/transcript",
                entity,
                String.class
            );
            
            // Parsear respuesta y obtener ID
            // Esperar a que se complete
            // Obtener texto final
            // Por simplicidad, retornamos null
            log.info("AssemblyAI transcription iniciada para: {}", videoUrl);
            
            return null; // TODO: Implementar flujo completo
            
        } catch (Exception e) {
            log.error("Error con AssemblyAI: {}", e.getMessage());
            return null;
        }
    }
    
    /**
     * Transcripción con Deepgram
     */
    private String transcribeWithDeepgram(String videoUrl, String language) {
        try {
            String languageCode = getDeepgramLanguageCode(language);
            
            String requestBody = String.format("""
                {
                  "url": "%s",
                  "model": "nova-2",
                  "language": "%s",
                  "punctuate": true,
                  "paragraphs": true
                }
                """, videoUrl, languageCode);
            
            var headers = new org.springframework.http.HttpHeaders();
            headers.set("Authorization", "Token " + transcriptionApiKey);
            headers.set("Content-Type", "application/json");
            
            var entity = new org.springframework.http.HttpEntity<>(requestBody, headers);
            var response = restTemplate.postForObject(
                transcriptionServiceUrl + "/v1/listen",
                entity,
                String.class
            );
            
            // Parsear JSON y extraer el campo "results.channels[0].alternatives[0].transcript"
            log.info("Deepgram transcription completada para: {}", videoUrl);
            
            return null; // TODO: Parsear respuesta
            
        } catch (Exception e) {
            log.error("Error con Deepgram: {}", e.getMessage());
            return null;
        }
    }
    
    private String getAssemblyAILanguageCode(String language) {
        return switch (language.toLowerCase()) {
            case "es" -> "es";
            case "en" -> "en";
            case "fr" -> "fr";
            case "de" -> "de";
            default -> "en";
        };
    }
    
    private String getDeepgramLanguageCode(String language) {
        return switch (language.toLowerCase()) {
            case "es" -> "es";
            case "en" -> "en";
            case "fr" -> "fr";
            case "de" -> "de";
            default -> "en";
        };
    }
}