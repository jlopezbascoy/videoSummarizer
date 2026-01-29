package com.youtubesummarizer.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO para peticiones de crear resumen de video
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SummaryRequest {

    @NotBlank(message = "La URL del video es obligatoria")
    @Pattern(
            regexp = "^(https?://)?(www\\.)?(youtube\\.com/watch\\?v=|youtu\\.be/)([a-zA-Z0-9_-]{11}).*$",
            message = "La URL debe ser un enlace válido de YouTube"
    )
    private String videoUrl;

    @NotBlank(message = "El idioma es obligatorio")
    private String language;

    @NotBlank(message = "El rango de palabras es obligatorio")
    @Pattern(
            regexp = "^(100-200|200-400|400-600)$",
            message = "El rango debe ser: 100-200, 200-400 o 400-600"
    )
    private String wordCountRange;

    /**
     * Extrae el ID del video de YouTube de la URL
     */
    public String extractVideoId() {
        if (videoUrl.contains("youtu.be/")) {
            return videoUrl.split("youtu.be/")[1].split("[?&]")[0];
        } else if (videoUrl.contains("watch?v=")) {
            return videoUrl.split("watch\\?v=")[1].split("&")[0];
        }
        return null;
    }

    /**
     * Obtiene el límite máximo de palabras según el rango
     */
    public int getMaxWords() {
        return switch (wordCountRange) {
            case "100-200" -> 200;
            case "200-400" -> 400;
            case "400-600" -> 600;
            default -> 200;
        };
    }

    /**
     * Obtiene el límite mínimo de palabras según el rango
     */
    public int getMinWords() {
        return switch (wordCountRange) {
            case "100-200" -> 100;
            case "200-400" -> 200;
            case "400-600" -> 400;
            default -> 100;
        };
    }
}