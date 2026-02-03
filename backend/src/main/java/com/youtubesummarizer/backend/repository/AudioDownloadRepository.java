package com.youtubesummarizer.backend.repository;

import com.youtubesummarizer.backend.model.AudioDownload;
import com.youtubesummarizer.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Repositorio para AudioDownload
 */
@Repository
public interface AudioDownloadRepository extends JpaRepository<AudioDownload, Long> {

    /**
     * Encuentra todas las descargas de un usuario ordenadas por fecha
     */
    List<AudioDownload> findByUserOrderByCreatedAtDesc(User user);

    /**
     * Encuentra las ultimas N descargas de un usuario
     */
    List<AudioDownload> findTop10ByUserIdOrderByCreatedAtDesc(Long userId);

    /**
     * Cuenta las descargas de un usuario
     */
    long countByUserId(Long userId);

    /**
     * Cuenta las descargas exitosas de un usuario hoy
     */
    @Query("SELECT COUNT(a) FROM AudioDownload a WHERE a.user.id = :userId " +
            "AND a.status = 'SUCCESS' " +
            "AND a.createdAt >= :startOfDay")
    long countTodaySuccessfulDownloads(Long userId, LocalDateTime startOfDay);

    /**
     * Elimina descargas antiguas (mas de 30 dias)
     */
    void deleteByCreatedAtBefore(LocalDateTime date);
}