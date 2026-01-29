package com.youtubesummarizer.backend.repository;

import com.youtubesummarizer.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository para la entidad User
 * Proporciona métodos para acceder y manipular datos de usuarios
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    /**
     * Busca un usuario por su nombre de usuario
     * @param username nombre de usuario
     * @return Optional con el usuario si existe
     */
    Optional<User> findByUsername(String username);

    /**
     * Busca un usuario por su email
     * @param email email del usuario
     * @return Optional con el usuario si existe
     */
    Optional<User> findByEmail(String email);

    /**
     * Verifica si existe un usuario con el nombre de usuario dado
     * @param username nombre de usuario a verificar
     * @return true si existe, false si no
     */
    boolean existsByUsername(String username);

    /**
     * Verifica si existe un usuario con el email dado
     * @param email email a verificar
     * @return true si existe, false si no
     */
    boolean existsByEmail(String email);
}