package com.youtubesummarizer.backend.repository;

import com.youtubesummarizer.backend.model.Summary;
import com.youtubesummarizer.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Repository para la entidad Summary
 * Proporciona métodos para acceder y manipular datos de resúmenes
 */
@Repository
public interface SummaryRepository extends JpaRepository<Summary, Long> {

    /**
     * Obtiene todos los resúmenes de un usuario, ordenados por fecha de creación descendente
     * @param user usuario del que obtener resúmenes
     * @return lista de resúmenes del usuario
     */
    List<Summary> findByUserOrderByCreatedAtDesc(User user);

    /**
     * Obtiene resúmenes de un usuario por ID, ordenados por fecha
     * @param userId ID del usuario
     * @return lista de resúmenes
     */
    List<Summary> findByUserIdOrderByCreatedAtDesc(Long userId);

    /**
     * Obtiene los últimos N resúmenes de un usuario
     * @param userId ID del usuario
     * @return lista limitada de resúmenes
     */
    List<Summary> findTop10ByUserIdOrderByCreatedAtDesc(Long userId);

    /**
     * Cuenta cuántos resúmenes tiene un usuario
     * @param userId ID del usuario
     * @return número de resúmenes
     */
    long countByUserId(Long userId);

    /**
     * Obtiene resúmenes de un usuario en un rango de fechas
     * @param userId ID del usuario
     * @param startDate fecha inicial
     * @param endDate fecha final
     * @return lista de resúmenes en el rango
     */
    List<Summary> findByUserIdAndCreatedAtBetween(Long userId, LocalDateTime startDate, LocalDateTime endDate);

    /**
     * Busca un resumen por URL de video y idioma (para caché)
     * @param videoUrl URL del video
     * @param language idioma del resumen
     * @return Optional con el resumen si existe
     */
    Optional<Summary> findFirstByVideoUrlAndLanguageOrderByCreatedAtDesc(String videoUrl, String language);

    /**
     * Verifica si existe un resumen para una URL y idioma específicos
     * @param videoUrl URL del video
     * @param language idioma
     * @return true si existe
     */
    boolean existsByVideoUrlAndLanguage(String videoUrl, String language);
}