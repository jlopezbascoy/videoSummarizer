package com.youtubesummarizer.backend.service;

import com.youtubesummarizer.backend.model.User;
import com.youtubesummarizer.backend.model.UsageTracking;
import com.youtubesummarizer.backend.repository.UsageTrackingRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

/**
 * Service de rate limiting
 * Controla los límites de uso diario según el tipo de usuario
 */
@Service
public class RateLimitService {

    @Autowired
    private UsageTrackingRepository usageTrackingRepository;

    /**
     * Verifica si el usuario puede hacer una petición más hoy
     * @param user usuario a verificar
     * @return true si puede hacer la petición, false si alcanzó el límite
     */
    @Transactional(readOnly = true)
    public boolean canMakeRequest(User user) {
        UsageTracking tracking = getTodayTracking(user);
        int dailyLimit = user.getDailyLimit();

        return tracking.getDailyCount() < dailyLimit;
    }

    /**
     * Incrementa el contador de peticiones del día
     * @param user usuario que hace la petición
     * @return tracking actualizado
     */
    @Transactional
    public UsageTracking incrementUsage(User user) {
        UsageTracking tracking = getTodayTracking(user);
        tracking.incrementCount();
        return usageTrackingRepository.save(tracking);
    }

    /**
     * Obtiene las peticiones restantes del día para un usuario
     * @param user usuario
     * @return número de peticiones restantes
     */
    @Transactional(readOnly = true)
    public int getRemainingRequests(User user) {
        UsageTracking tracking = getTodayTracking(user);
        return tracking.getRemainingRequests(user.getDailyLimit());
    }

    /**
     * Obtiene el conteo de uso actual del día
     * @param user usuario
     * @return número de peticiones realizadas hoy
     */
    @Transactional(readOnly = true)
    public int getTodayUsageCount(User user) {
        UsageTracking tracking = getTodayTracking(user);
        return tracking.getDailyCount();
    }

    /**
     * Obtiene o crea el tracking de hoy para un usuario
     */
    @Transactional
    public UsageTracking getTodayTracking(User user) {
        LocalDate today = LocalDate.now();

        return usageTrackingRepository.findByUserAndRequestDate(user, today)
                .orElseGet(() -> {
                    UsageTracking newTracking = UsageTracking.createForToday(user);
                    return usageTrackingRepository.save(newTracking);
                });
    }

    /**
     * Verifica si el usuario ha alcanzado el límite diario
     * @param user usuario
     * @return true si alcanzó el límite, false si aún puede hacer peticiones
     */
    @Transactional(readOnly = true)
    public boolean hasReachedLimit(User user) {
        return !canMakeRequest(user);
    }

    /**
     * Resetea el contador de un usuario (útil para testing o administración)
     */
    @Transactional
    public void resetUserUsage(User user) {
        LocalDate today = LocalDate.now();
        usageTrackingRepository.findByUserAndRequestDate(user, today)
                .ifPresent(tracking -> {
                    tracking.setDailyCount(0);
                    usageTrackingRepository.save(tracking);
                });
    }

    /**
     * Limpia registros antiguos (ejecutar periódicamente)
     * Elimina registros de más de 30 días
     */
    @Transactional
    public void cleanOldRecords() {
        LocalDate thirtyDaysAgo = LocalDate.now().minusDays(30);
        usageTrackingRepository.deleteOldRecords(thirtyDaysAgo);
    }
}