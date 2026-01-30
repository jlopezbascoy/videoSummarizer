package com.youtubesummarizer.backend.exception;

/**
 * Excepción personalizada para errores relacionados con YouTube API
 */
public class YouTubeApiException extends RuntimeException {
    
    public YouTubeApiException(String message) {
        super(message);
    }
    
    public YouTubeApiException(String message, Throwable cause) {
        super(message, cause);
    }
}