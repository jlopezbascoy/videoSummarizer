package com.youtubesummarizer.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpMethod;

import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * Servicio para interactuar con la API de Python que descarga audio de YouTube
 * Usa el proyecto: https://github.com/alperensumeroglu/yt-audio-api
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

    /**
     * Descarga el audio de un video de YouTube como MP3
     *
     * @param videoUrl URL del video de YouTube
     * @return Path al archivo MP3 descargado
     * @throws AudioDownloadException Si hay algún error en el proceso
     */
    public Path downloadAudio(String videoUrl) {
        try {
            logger.info("Iniciando descarga de audio para: {}", videoUrl);

            // Paso 1: Obtener token del video
            String token = requestToken(videoUrl);
            logger.info("Token obtenido: {}", token);

            // Paso 2: Descargar el archivo MP3 usando el token
            Path audioFile = downloadAudioFile(token);
            logger.info("Audio descargado exitosamente: {}", audioFile.getFileName());

            return audioFile;

        } catch (Exception e) {
            logger.error("Error al descargar audio: {}", e.getMessage(), e);
            throw new AudioDownloadException("No se pudo descargar el audio del video: " + e.getMessage());
        }
    }

    /**
     * Solicita un token para el video a la Python API
     */
    private String requestToken(String videoUrl) {
        try {
            String url = audioApiBaseUrl + "/?url=" + videoUrl;
            logger.debug("Solicitando token a: {}", url);

            ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);

            if (!response.getStatusCode().is2xxSuccessful()) {
                throw new AudioDownloadException(
                        "Error al solicitar token. Codigo: " + response.getStatusCode()
                );
            }

            String responseBody = response.getBody();
            if (responseBody == null || responseBody.isEmpty()) {
                throw new AudioDownloadException("Respuesta vacia de la API de audio");
            }

            // Parsear JSON para extraer el token
            JsonNode jsonNode = objectMapper.readTree(responseBody);
            String token = jsonNode.path("token").asText();

            if (token == null || token.isEmpty()) {
                throw new AudioDownloadException("Token no encontrado en la respuesta");
            }

            return token;

        } catch (Exception e) {
            logger.error("Error al solicitar token: {}", e.getMessage());
            throw new AudioDownloadException("Error al comunicarse con la API de audio: " + e.getMessage());
        }
    }

    /**
     * Descarga el archivo MP3 usando el token
     */
    private Path downloadAudioFile(String token) {
        try {
            String url = audioApiBaseUrl + "/download?token=" + token;
            logger.debug("Descargando audio desde: {}", url);

            // Crear directorio temporal si no existe
            Path tempDir = Paths.get(System.getProperty("java.io.tmpdir"), "youtube-audio");
            if (!Files.exists(tempDir)) {
                Files.createDirectories(tempDir);
                logger.debug("Directorio temporal creado: {}", tempDir);
            }

            // Crear archivo temporal con nombre basado en timestamp
            String fileName = "audio_" + System.currentTimeMillis() + ".mp3";
            Path audioFile = tempDir.resolve(fileName);

            // Descargar el archivo
            ResponseEntity<byte[]> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    null,
                    byte[].class
            );

            if (!response.getStatusCode().is2xxSuccessful()) {
                throw new AudioDownloadException(
                        "Error al descargar audio. Codigo: " + response.getStatusCode()
                );
            }

            byte[] audioData = response.getBody();
            if (audioData == null || audioData.length == 0) {
                throw new AudioDownloadException("Archivo de audio vacio");
            }

            // Guardar el archivo
            try (FileOutputStream fos = new FileOutputStream(audioFile.toFile())) {
                fos.write(audioData);
            }

            logger.info("Audio guardado: {} ({} bytes)", audioFile, audioData.length);

            return audioFile;

        } catch (IOException e) {
            logger.error("Error al guardar archivo de audio: {}", e.getMessage());
            throw new AudioDownloadException("Error al guardar el audio: " + e.getMessage());
        } catch (Exception e) {
            logger.error("Error al descargar archivo: {}", e.getMessage());
            throw new AudioDownloadException("Error en la descarga: " + e.getMessage());
        }
    }

    /**
     * Elimina un archivo de audio temporal
     * Debe llamarse después de procesar el audio
     */
    public void cleanupAudioFile(Path audioFile) {
        try {
            if (audioFile != null && Files.exists(audioFile)) {
                Files.delete(audioFile);
                logger.info("Archivo temporal eliminado: {}", audioFile.getFileName());
            }
        } catch (IOException e) {
            logger.warn("No se pudo eliminar archivo temporal: {}", e.getMessage());
        }
    }

    /**
     * Verifica si la Python API está disponible
     */
    public boolean isApiAvailable() {
        try {
            String healthUrl = audioApiBaseUrl + "/";
            ResponseEntity<String> response = restTemplate.getForEntity(healthUrl, String.class);
            return response.getStatusCode().is2xxSuccessful();
        } catch (HttpClientErrorException e) {
            // 400 Bad Request es esperado cuando no se pasa el parametro url
            // Esto significa que la API esta corriendo
            return e.getStatusCode().value() == 400;
        } catch (Exception e) {
            logger.error("Python API no disponible: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Excepción personalizada para errores de descarga de audio
     */
    public static class AudioDownloadException extends RuntimeException {
        public AudioDownloadException(String message) {
            super(message);
        }

        public AudioDownloadException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}