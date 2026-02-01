package com.youtubesummarizer.backend.service;

import com.google.genai.Client;
import com.google.genai.types.GenerateContentResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

/**
 * Servicio para interactuar con la API de Gemini
 * Genera resúmenes de videos de YouTube usando IA
 */
@Service
public class GeminiService {

    private static final Logger logger = LoggerFactory.getLogger(GeminiService.class);

    private final Client client;

    public GeminiService() {
        this.client = new Client();
    }

    /**
     * Genera un resumen de un video de YouTube usando Gemini
     *
     * @param videoUrl URL del video de YouTube
     * @param language Idioma del resumen (es, en, fr, etc.)
     * @param minWords Mínimo de palabras para el resumen
     * @param maxWords Máximo de palabras para el resumen
     * @return Texto del resumen generado
     * @throws GeminiException Si hay algún error con la API de Gemini
     */
    public String summarizeYouTubeVideo(String videoUrl, String language, int minWords, int maxWords) {
        try {
            logger.info("Solicitando resumen a Gemini para video: {}", videoUrl);
            logger.info("Parámetros: idioma={}, palabras={}-{}", language, minWords, maxWords);

            String prompt = buildPrompt(videoUrl, language, minWords, maxWords);

            GenerateContentResponse response = client.models.generateContent(
                    "gemini-3-pro-preview",
                    prompt,
                    null
            );

            String summaryText = response.text();

            if (summaryText == null || summaryText.trim().isEmpty()) {
                logger.error("Gemini devolvió una respuesta vacía");
                throw new GeminiException("La IA no pudo generar un resumen para este video");
            }

            logger.info("Resumen generado exitosamente. Longitud: {} caracteres", summaryText.length());
            return summaryText.trim();

        } catch (Exception e) {
            logger.error("Error al llamar a Gemini API: {}", e.getMessage(), e);
            throw new GeminiException("Error al generar resumen con IA: " + e.getMessage());
        }
    }

    /**
     * Construye el prompt para Gemini según los parámetros especificados
     */
    private String buildPrompt(String videoUrl, String language, int minWords, int maxWords) {
        String languageName = getLanguageName(language);

        return String.format("""
            Analiza y resume el siguiente video de YouTube: %s en el siguiente idioma: ( %s ) con un minimo de %d palabras y un maximo de %d palabras:
            
            FORMATO REQUERIDO:
            1. Comienza con una breve introducción de 1-2 frases explicando el tema principal del video
            2. Continúa con "Aquí tienes un resumen de los puntos clave:"
            3. Organiza el contenido usando viñetas (*) para los puntos principales
            4. Incluye las marcas de tiempo [MM:SS] cuando sea relevante, especialmente para pasos importantes
            5. Usa sub-viñetas (con espacios de indentación) para detalles específicos bajo cada punto principal
            
            EJEMPLO DE FORMATO:
            Este video tutorial explica [tema principal del video].
            Aquí tienes un resumen de los puntos clave:
            * Punto Principal 1: Descripción breve [00:34].
            * Punto Principal 2: Descripción breve [01:20].
               * Sub-punto o detalle adicional [03:23].
            * Punto Principal 3:
               * Detalle 1 [05:32].
               * Detalle 2 [06:40].
            
            REQUISITOS:
            - Idioma: %s
            - Longitud: entre %d y %d palabras
            - Usa un tono claro y profesional
            - Extrae y menciona marcas de tiempo importantes del video
            - Organiza la información de forma jerárquica y estructurada
            - Sé específico y concreto en cada punto
            
            Genera SOLO el resumen siguiendo este formato exacto.
            """,
                videoUrl,        // %s
                languageName,   // %s
                minWords,       // %d
                maxWords,       // %d
                languageName,   // %s
                minWords,       // %d
                maxWords        // %d
        );
    }

    /**
     * Convierte el código de idioma a su nombre completo
     */
    private String getLanguageName(String languageCode) {
        return switch (languageCode.toLowerCase()) {
            case "es" -> "Español";
            case "en" -> "English";
            case "fr" -> "Français";
            case "de" -> "Deutsch";
            case "it" -> "Italiano";
            case "pt" -> "Português";
            case "ca" -> "Català";
            case "gl" -> "Galego";
            default -> "Español"; // Por defecto español
        };
    }

    /**
     * Excepción personalizada para errores de Gemini
     */
    public static class GeminiException extends RuntimeException {
        public GeminiException(String message) {
            super(message);
        }

        public GeminiException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}