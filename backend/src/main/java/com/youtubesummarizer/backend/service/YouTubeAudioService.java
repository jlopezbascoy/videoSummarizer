package com.youtubesummarizer.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpMethod;

import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * Servicio para interactuar con la API de Python que descarga audio de YouTube
 * Con manejo mejorado de errores y mensajes claros para el usuario
 */
@Service
public class YouTubeAudioService {

    private static final Logger logger = LoggerFactory.getLogger(YouTubeAudioService.class);

    @Value("${youtube.audio.api.base-url:http://localhost:5000}")
    private String audioApiBaseUrl;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public YouTubeAudioService() {
        this.restTemplate = new RestTemplate();
        this.objectMapper = new ObjectMapper();
    }

    public Path downloadAudio(String videoUrl) {
        try {
            logger.info("Iniciando descarga de audio para: {}", videoUrl);
            String token = requestToken(videoUrl);
            logger.info("Token obtenido: {}", token);
            Path audioFile = downloadAudioFile(token);
            logger.info("Audio descargado exitosamente: {}", audioFile.getFileName());
            return audioFile;
        } catch (AudioDownloadException e) {
            throw e;
        } catch (Exception e) {
            logger.error("Error inesperado: {}", e.getMessage(), e);
            throw new AudioDownloadException("Error inesperado al procesar el video");
        }
    }

    private String requestToken(String videoUrl) {
        try {
            String url = audioApiBaseUrl + "/?url=" + videoUrl;
            logger.debug("Solicitando token a: {}", url);

            ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);

            if (!response.getStatusCode().is2xxSuccessful()) {
                throw new AudioDownloadException("Error al procesar el video");
            }

            String responseBody = response.getBody();
            if (responseBody == null || responseBody.isEmpty()) {
                throw new AudioDownloadException("Respuesta vacia de la API");
            }

            JsonNode jsonNode = objectMapper.readTree(responseBody);
            String token = jsonNode.path("token").asText();

            if (token == null || token.isEmpty()) {
                throw new AudioDownloadException("Token no encontrado");
            }

            return token;

        } catch (HttpServerErrorException e) {
            logger.error("Error 500: {}", e.getResponseBodyAsString());
            String errorMessage = parseErrorMessage(e.getResponseBodyAsString());
            throw new AudioDownloadException(errorMessage);
        } catch (HttpClientErrorException e) {
            logger.error("Error cliente: {}", e.getMessage());
            throw new AudioDownloadException("URL invalida o video no disponible");
        } catch (AudioDownloadException e) {
            throw e;
        } catch (Exception e) {
            logger.error("Error al solicitar token: {}", e.getMessage());
            throw new AudioDownloadException("Error al comunicarse con el servicio");
        }
    }

    private String parseErrorMessage(String errorBody) {
        try {
            JsonNode errorNode = objectMapper.readTree(errorBody);
            String detail = errorNode.path("detail").asText("");
            String error = errorNode.path("error").asText("");

            if (detail.contains("Sign in to confirm your age") ||
                    detail.contains("inappropriate for some users")) {
                return "Este video requiere verificacion de edad y no se puede descargar. Por favor, elige un video publico sin restricciones.";
            }

            if (detail.contains("Private video") || detail.contains("private")) {
                return "Este video es privado y no se puede descargar.";
            }

            if (detail.contains("Video unavailable") || detail.contains("not available")) {
                return "Este video no esta disponible o ha sido eliminado.";
            }

            if (detail.contains("not available in your country") || detail.contains("region")) {
                return "Este video no esta disponible en tu region.";
            }

            if (detail.contains("timeout") || detail.contains("too long")) {
                return "El video es demasiado largo. Intenta con un video mas corto.";
            }

            return "El video no se puede descargar. Intenta con otro video publico.";

        } catch (Exception e) {
            logger.warn("No se pudo parsear error: {}", errorBody);
            return "Error al procesar el video. Intenta con otro.";
        }
    }

    private Path downloadAudioFile(String token) {
        try {
            String url = audioApiBaseUrl + "/download?token=" + token;
            logger.debug("Descargando audio desde: {}", url);

            Path tempDir = Paths.get(System.getProperty("java.io.tmpdir"), "youtube-audio");
            if (!Files.exists(tempDir)) {
                Files.createDirectories(tempDir);
            }

            String fileName = "audio_" + System.currentTimeMillis() + ".mp3";
            Path audioFile = tempDir.resolve(fileName);

            ResponseEntity<byte[]> response = restTemplate.exchange(url, HttpMethod.GET, null, byte[].class);

            if (!response.getStatusCode().is2xxSuccessful()) {
                throw new AudioDownloadException("Error al descargar el archivo");
            }

            byte[] audioData = response.getBody();
            if (audioData == null || audioData.length == 0) {
                throw new AudioDownloadException("El archivo esta vacio");
            }

            try (FileOutputStream fos = new FileOutputStream(audioFile.toFile())) {
                fos.write(audioData);
            }

            logger.info("Audio guardado: {} ({} bytes)", audioFile, audioData.length);
            return audioFile;

        } catch (IOException e) {
            logger.error("Error al guardar archivo: {}", e.getMessage());
            throw new AudioDownloadException("Error al guardar el audio");
        } catch (AudioDownloadException e) {
            throw e;
        } catch (Exception e) {
            logger.error("Error al descargar: {}", e.getMessage());
            throw new AudioDownloadException("Error en la descarga");
        }
    }

    public void cleanupAudioFile(Path audioFile) {
        try {
            if (audioFile != null && Files.exists(audioFile)) {
                Files.delete(audioFile);
                logger.info("Archivo temporal eliminado: {}", audioFile.getFileName());
            }
        } catch (IOException e) {
            logger.warn("No se pudo eliminar archivo: {}", e.getMessage());
        }
    }

    public boolean isApiAvailable() {
        try {
            String healthUrl = audioApiBaseUrl + "/";
            ResponseEntity<String> response = restTemplate.getForEntity(healthUrl, String.class);
            return response.getStatusCode().is2xxSuccessful();
        } catch (HttpClientErrorException e) {
            return e.getStatusCode().value() == 400;
        } catch (Exception e) {
            logger.error("Python API no disponible: {}", e.getMessage());
            return false;
        }
    }

    public static class AudioDownloadException extends RuntimeException {
        public AudioDownloadException(String message) {
            super(message);
        }
    }
}