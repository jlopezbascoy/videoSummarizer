package com.youtubesummarizer.backend.service;

import com.google.genai.Client;
import com.google.genai.types.GenerateContentResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

/**
 * Servicio para generar resumenes de texto usando Gemini
 */
@Service
public class GeminiService {

    private static final Logger logger = LoggerFactory.getLogger(GeminiService.class);

    private final Client client;

    public GeminiService() {
        this.client = new Client();
    }

    /**
     * Genera un resumen de una transcripcion de video
     *
     * @param transcriptionText Texto transcrito del video
     * @param videoTitle Titulo del video (opcional)
     * @param language Idioma del resumen
     * @param minWords Minimo de palabras
     * @param maxWords Maximo de palabras
     * @return Resumen generado
     */
    public String summarizeTranscription(String transcriptionText, String videoTitle, String language,
                                         int minWords, int maxWords) {
        try {
            logger.info("Generando resumen de transcripcion");
            logger.info("Parametros: idioma={}, palabras={}-{}", language, minWords, maxWords);
            logger.info("Longitud transcripcion: {} caracteres", transcriptionText.length());

            // Limitar longitud de transcripcion si es muy larga
            String textToSummarize = transcriptionText;
            int maxChars = 80000;

            if (textToSummarize.length() > maxChars) {
                logger.warn("Transcripcion muy larga ({}), truncando a {} caracteres",
                        textToSummarize.length(), maxChars);
                textToSummarize = textToSummarize.substring(0, maxChars);
            }

            String prompt = buildSummaryPrompt(textToSummarize, videoTitle, language, minWords, maxWords);

            GenerateContentResponse response = client.models.generateContent(
                    "gemini-3-flash-preview",
                    prompt,
                    null
            );

            String summaryText = response.text();

            if (summaryText == null || summaryText.trim().isEmpty()) {
                logger.error("Gemini devolvio respuesta vacia");
                throw new GeminiException("La IA no pudo generar un resumen");
            }

            logger.info("Resumen generado exitosamente. Longitud: {} caracteres", summaryText.length());
            return summaryText.trim();

        } catch (Exception e) {
            logger.error("Error al llamar a Gemini API: {}", e.getMessage(), e);
            throw new GeminiException("Error al generar resumen con IA: " + e.getMessage());
        }
    }

    /**
     * Construye el prompt para generar el resumen
     */
    private String buildSummaryPrompt(String transcription, String videoTitle, String language,
                                      int minWords, int maxWords) {
        String languageName = getLanguageName(language);

        String titleInfo = (videoTitle != null && !videoTitle.isEmpty())
                ? "Titulo del video: " + videoTitle + "\n\n"
                : "";

        return String.format("""
            %sTe proporciono la transcripcion completa de un video de YouTube.
            
            TRANSCRIPCION:
            %s
            
            TAREA:
            Genera un resumen estructurado en %s con las siguientes caracteristicas:
            
            FORMATO REQUERIDO:
            1. Comienza con una breve introduccion de 1-2 frases explicando el tema principal
            2. Continua con "Aqui tienes un resumen de los puntos clave:"
            3. Organiza el contenido usando viñetas (*) para los puntos principales
            4. Usa sub-viñetas (con espacios de indentacion) para detalles especificos
            
            EJEMPLO DE FORMATO:
            Este video explica [tema principal].
            Aqui tienes un resumen de los puntos clave:
            * Punto Principal 1: Descripcion breve.
            * Punto Principal 2: Descripcion breve.
               * Sub-punto o detalle adicional.
            * Punto Principal 3:
               * Detalle 1.
               * Detalle 2.
            
            REQUISITOS:
            - Idioma: %s
            - Longitud: entre %d y %d palabras
            - Usa un tono claro y profesional
            - Organiza la informacion de forma jerarquica
            - Se especifico y concreto en cada punto
            - NO inventes informacion que no este en la transcripcion
            - Si la transcripcion esta incompleta, indica que el resumen esta basado en contenido parcial
            
            Genera SOLO el resumen siguiendo este formato exacto.
            """,
                titleInfo,
                transcription,
                languageName,
                languageName,
                minWords,
                maxWords
        );
    }

    /**
     * Convierte codigo de idioma a nombre completo
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
            default -> "Español";
        };
    }

    /**
     * Excepcion personalizada para errores de Gemini
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