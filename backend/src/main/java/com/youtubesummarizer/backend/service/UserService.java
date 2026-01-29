package com.youtubesummarizer.backend.service;

import com.youtubesummarizer.backend.model.User;
import com.youtubesummarizer.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service de usuarios
 * Gestiona operaciones relacionadas con usuarios
 */
@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    /**
     * Obtiene el usuario autenticado actualmente
     */
    @Transactional(readOnly = true)
    public User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            throw new RuntimeException("No hay usuario autenticado");
        }

        String username = authentication.getName();

        return userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("Usuario no encontrado: " + username));
    }

    /**
     * Obtiene un usuario por su ID
     */
    @Transactional(readOnly = true)
    public User getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new UsernameNotFoundException("Usuario no encontrado con id: " + id));
    }

    /**
     * Obtiene un usuario por su username
     */
    @Transactional(readOnly = true)
    public User getUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("Usuario no encontrado: " + username));
    }

    /**
     * Actualiza el tipo de usuario (FREE, PREMIUM, VIP)
     */
    @Transactional
    public User updateUserType(Long userId, User.UserType userType) {
        User user = getUserById(userId);
        user.setUserType(userType);
        return userRepository.save(user);
    }

    /**
     * Verifica si un usuario existe por username
     */
    @Transactional(readOnly = true)
    public boolean existsByUsername(String username) {
        return userRepository.existsByUsername(username);
    }

    /**
     * Verifica si un usuario existe por email
     */
    @Transactional(readOnly = true)
    public boolean existsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }
}