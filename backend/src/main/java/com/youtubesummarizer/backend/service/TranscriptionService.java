package com.youtubesummarizer.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.Map;

/**
 * Servicio para transcribir audio a texto usando Gemini REST API
 */
@Service
public class TranscriptionService {

    private static final Logger logger = LoggerFactory.getLogger(TranscriptionService.class);

    @Value("${gemini.api.key}")
    private String geminiApiKey;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public TranscriptionService() {
        this.restTemplate = new RestTemplate();
        this.objectMapper = new ObjectMapper();
    }

    /**
     * Transcribe un archivo de audio MP3 a texto
     */
    public String transcribeAudio(Path audioFile, String language) {
        String fileUri = null;

        try {
            logger.info("Iniciando transcripcion de audio: {}", audioFile.getFileName());

            if (!Files.exists(audioFile)) {
                throw new TranscriptionException("El archivo de audio no existe");
            }

            long fileSize = Files.size(audioFile);
            long maxSize = 20 * 1024 * 1024;

            if (fileSize > maxSize) {
                throw new TranscriptionException(
                        String.format("Archivo muy grande (%.2f MB). Maximo: 20 MB",
                                fileSize / (1024.0 * 1024.0))
                );
            }

            logger.info("Tamaño: %.2f MB", fileSize / (1024.0 * 1024.0));

            // Paso 1: Iniciar sesion de subida resumible
            logger.info("Paso 1: Iniciando subida...");
            String uploadUrl = initiateResumableUpload(audioFile, fileSize);

            // Paso 2: Subir el archivo
            logger.info("Paso 2: Subiendo archivo...");
            fileUri = uploadFile(uploadUrl, audioFile, fileSize);

            // Paso 3: Generar transcripcion
            logger.info("Paso 3: Generando transcripcion...");
            String transcription = generateTranscription(fileUri, language);

            logger.info("Transcripcion completada: {} caracteres", transcription.length());

            return transcription;

        } catch (IOException e) {
            logger.error("Error al leer archivo: {}", e.getMessage());
            throw new TranscriptionException("Error al leer archivo: " + e.getMessage());
        } catch (Exception e) {
            logger.error("Error en transcripcion: {}", e.getMessage(), e);
            throw new TranscriptionException("Error al transcribir: " + e.getMessage());
        }
    }

    /**
     * Paso 1: Inicia la sesion de subida resumible
     */
    private String initiateResumableUpload(Path audioFile, long fileSize) throws Exception {
        String url = "https://generativelanguage.googleapis.com/upload/v1beta/files";

        HttpHeaders headers = new HttpHeaders();
        headers.set("x-goog-api-key", geminiApiKey);
        headers.set("X-Goog-Upload-Protocol", "resumable");
        headers.set("X-Goog-Upload-Command", "start");
        headers.set("X-Goog-Upload-Header-Content-Length", String.valueOf(fileSize));
        headers.set("X-Goog-Upload-Header-Content-Type", "audio/mp3");
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> body = new HashMap<>();
        Map<String, String> fileInfo = new HashMap<>();
        fileInfo.put("display_name", "AUDIO");
        body.put("file", fileInfo);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

        ResponseEntity<String> response = restTemplate.exchange(
                url,
                HttpMethod.POST,
                request,
                String.class
        );

        // Extraer URL de subida de los headers
        String uploadUrl = response.getHeaders().getFirst("X-Goog-Upload-URL");

        if (uploadUrl == null) {
            throw new TranscriptionException("No se recibio URL de subida");
        }

        logger.debug("URL de subida obtenida");
        return uploadUrl;
    }

    /**
     * Paso 2: Sube el archivo usando la URL resumible
     */
    private String uploadFile(String uploadUrl, Path audioFile, long fileSize) throws Exception {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Content-Length", String.valueOf(fileSize));
        headers.set("X-Goog-Upload-Offset", "0");
        headers.set("X-Goog-Upload-Command", "upload, finalize");
        headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);

        byte[] audioBytes = Files.readAllBytes(audioFile);

        HttpEntity<byte[]> request = new HttpEntity<>(audioBytes, headers);

        ResponseEntity<String> response = restTemplate.exchange(
                uploadUrl,
                HttpMethod.POST,
                request,
                String.class
        );

        // Parsear respuesta para obtener file_uri
        JsonNode jsonResponse = objectMapper.readTree(response.getBody());
        String fileUri = jsonResponse.path("file").path("uri").asText();

        if (fileUri == null || fileUri.isEmpty()) {
            throw new TranscriptionException("No se recibio URI del archivo");
        }

        logger.debug("Archivo subido. URI: {}", fileUri);
        return fileUri;
    }

    /**
     * Paso 3: Genera la transcripcion usando el archivo subido
     */
    private String generateTranscription(String fileUri, String language) throws Exception {
        String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent";

        HttpHeaders headers = new HttpHeaders();
        headers.set("x-goog-api-key", geminiApiKey);
        headers.setContentType(MediaType.APPLICATION_JSON);

        String prompt = buildTranscriptionPrompt(language);

        Map<String, Object> body = new HashMap<>();
        Map<String, Object> content = new HashMap<>();

        Object[] parts = new Object[2];

        Map<String, String> textPart = new HashMap<>();
        textPart.put("text", prompt);

        Map<String, Object> filePart = new HashMap<>();
        Map<String, String> fileData = new HashMap<>();
        fileData.put("mime_type", "audio/mp3");
        fileData.put("file_uri", fileUri);
        filePart.put("file_data", fileData);

        parts[0] = textPart;
        parts[1] = filePart;

        content.put("parts", parts);
        body.put("contents", new Object[]{content});

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

        ResponseEntity<String> response = restTemplate.exchange(
                url,
                HttpMethod.POST,
                request,
                String.class
        );

        // Parsear respuesta
        JsonNode jsonResponse = objectMapper.readTree(response.getBody());
        JsonNode candidates = jsonResponse.path("candidates");

        if (candidates.isEmpty()) {
            throw new TranscriptionException("No se recibio respuesta de Gemini");
        }

        String transcription = candidates.get(0)
                .path("content")
                .path("parts")
                .get(0)
                .path("text")
                .asText();

        if (transcription == null || transcription.isEmpty()) {
            throw new TranscriptionException("Transcripcion vacia");
        }

        return cleanTranscription(transcription);
    }

    private String buildTranscriptionPrompt(String languageCode) {
        String languageName = getLanguageName(languageCode);

        return String.format("""
            Transcribe el audio que te proporciono.
            
            Instrucciones:
            - El audio probablemente esta en %s
            - Transcribe TODO el contenido de forma precisa
            - NO resumas, transcribe palabra por palabra
            - NO agregues comentarios adicionales
            - Ignora musica de fondo
            
            Proporciona SOLO la transcripcion, sin introducciones.
            """, languageName);
    }

    private String cleanTranscription(String transcription) {
        if (transcription == null) {
            return "";
        }

        transcription = transcription.trim();

        String[] linesToRemove = {
                "aqui esta la transcripcion",
                "here is the transcription",
                "transcription:",
                "transcripcion:"
        };

        for (String line : linesToRemove) {
            transcription = transcription.replaceAll("(?i)^" + line + ".*\n?", "");
        }

        return transcription.trim();
    }

    private String getLanguageName(String languageCode) {
        if (languageCode == null) {
            return "español o ingles";
        }

        return switch (languageCode.toLowerCase()) {
            case "es" -> "español";
            case "en" -> "ingles";
            case "fr" -> "frances";
            case "de" -> "aleman";
            case "it" -> "italiano";
            case "pt" -> "portugues";
            case "ca" -> "catalan";
            case "gl" -> "gallego";
            default -> "español o ingles";
        };
    }

    public static class TranscriptionException extends RuntimeException {
        public TranscriptionException(String message) {
            super(message);
        }

        public TranscriptionException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}