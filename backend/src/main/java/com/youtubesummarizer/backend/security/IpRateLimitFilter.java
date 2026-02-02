package com.youtubesummarizer.backend.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Filtro de Rate Limiting basado en IP
 * Complementa el RateLimitService (user-based) con proteccion IP-based
 * para endpoints publicos (login, register)
 */
@Component
public class IpRateLimitFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(IpRateLimitFilter.class);

    // Cache de requests por IP
    private final Map<String, RequestTracker> ipRequests = new ConcurrentHashMap<>();

    // Configuracion
    private static final int MAX_REQUESTS_PER_MINUTE = 60;
    private static final int MAX_REQUESTS_PER_HOUR = 1000;
    private static final Duration CLEANUP_INTERVAL = Duration.ofMinutes(10);

    private Instant lastCleanup = Instant.now();

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        String path = request.getRequestURI();

        // Solo aplicar rate limiting a endpoints publicos
        if (shouldRateLimit(path)) {
            String clientIp = getClientIp(request);

            if (isRateLimited(clientIp)) {
                logger.warn("Rate limit exceeded for IP: {}", clientIp);
                response.setStatus(429); // Too Many Requests
                response.setContentType("application/json");
                response.getWriter().write(
                        "{\"error\":\"Demasiadas peticiones. Por favor, intenta de nuevo en unos minutos.\",\"status\":429}"
                );
                return;
            }
        }

        // Limpieza periodica
        cleanupIfNeeded();

        filterChain.doFilter(request, response);
    }

    /**
     * Verifica si el endpoint debe tener rate limiting
     */
    private boolean shouldRateLimit(String path) {
        return path.startsWith("/api/auth/login") ||
                path.startsWith("/api/auth/register");
    }

    /**
     * Verifica si una IP ha excedido el rate limit
     */
    private boolean isRateLimited(String ip) {
        RequestTracker tracker = ipRequests.computeIfAbsent(ip, k -> new RequestTracker());
        return !tracker.allowRequest();
    }

    /**
     * Obtiene la IP del cliente, considerando proxies
     */
    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }

        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty()) {
            return xRealIp;
        }

        return request.getRemoteAddr();
    }

    /**
     * Limpia trackers viejos para evitar memory leaks
     */
    private void cleanupIfNeeded() {
        Instant now = Instant.now();
        if (Duration.between(lastCleanup, now).compareTo(CLEANUP_INTERVAL) > 0) {
            ipRequests.entrySet().removeIf(entry -> entry.getValue().isOld());
            lastCleanup = now;
            logger.debug("Cleaned up old IP trackers. Current size: {}", ipRequests.size());
        }
    }

    /**
     * Tracker de requests por IP
     */
    private static class RequestTracker {
        private final AtomicInteger minuteCount = new AtomicInteger(0);
        private final AtomicInteger hourCount = new AtomicInteger(0);
        private Instant minuteStart = Instant.now();
        private Instant hourStart = Instant.now();
        private Instant lastRequest = Instant.now();

        /**
         * Verifica si se permite una nueva request
         */
        public synchronized boolean allowRequest() {
            Instant now = Instant.now();
            lastRequest = now;

            // Reset contador de minuto si paso 1 minuto
            if (Duration.between(minuteStart, now).toMinutes() >= 1) {
                minuteCount.set(0);
                minuteStart = now;
            }

            // Reset contador de hora si paso 1 hora
            if (Duration.between(hourStart, now).toHours() >= 1) {
                hourCount.set(0);
                hourStart = now;
            }

            // Verificar limites
            if (minuteCount.get() >= MAX_REQUESTS_PER_MINUTE) {
                return false;
            }

            if (hourCount.get() >= MAX_REQUESTS_PER_HOUR) {
                return false;
            }

            // Incrementar contadores
            minuteCount.incrementAndGet();
            hourCount.incrementAndGet();

            return true;
        }

        /**
         * Verifica si el tracker es viejo (sin uso en 1 hora)
         */
        public boolean isOld() {
            return Duration.between(lastRequest, Instant.now()).toHours() >= 1;
        }
    }
}