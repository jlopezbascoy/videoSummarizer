package com.youtubesummarizer.backend.repository;

import com.youtubesummarizer.backend.model.UsageTracking;
import com.youtubesummarizer.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;

/**
 * Repository para la entidad UsageTracking
 * Gestiona el tracking de uso para rate limiting
 */
@Repository
public interface UsageTrackingRepository extends JpaRepository<UsageTracking, Long> {

    /**
     * Busca el tracking de uso de un usuario para una fecha específica
     * @param user usuario
     * @param date fecha a consultar
     * @return Optional con el tracking si existe
     */
    Optional<UsageTracking> findByUserAndRequestDate(User user, LocalDate date);

    /**
     * Busca el tracking de uso por ID de usuario y fecha
     * @param userId ID del usuario
     * @param date fecha a consultar
     * @return Optional con el tracking si existe
     */
    Optional<UsageTracking> findByUserIdAndRequestDate(Long userId, LocalDate date);

    /**
     * Elimina registros de tracking antiguos (para limpieza)
     * @param beforeDate fecha límite (elimina registros anteriores a esta fecha)
     */
    @Modifying
    @Query("DELETE FROM UsageTracking ut WHERE ut.requestDate < :beforeDate")
    void deleteOldRecords(@Param("beforeDate") LocalDate beforeDate);

    /**
     * Obtiene el conteo de uso actual de un usuario para hoy
     * @param userId ID del usuario
     * @param today fecha de hoy
     * @return número de peticiones realizadas hoy (0 si no existe registro)
     */
    @Query("SELECT COALESCE(ut.dailyCount, 0) FROM UsageTracking ut WHERE ut.user.id = :userId AND ut.requestDate = :today")
    Integer getTodayUsageCount(@Param("userId") Long userId, @Param("today") LocalDate today);
}