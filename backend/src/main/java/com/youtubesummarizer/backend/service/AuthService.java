package com.youtubesummarizer.backend.service;

import com.youtubesummarizer.backend.dto.AuthResponse;
import com.youtubesummarizer.backend.dto.LoginRequest;
import com.youtubesummarizer.backend.dto.RegisterRequest;
import com.youtubesummarizer.backend.model.User;
import com.youtubesummarizer.backend.repository.UserRepository;
import com.youtubesummarizer.backend.security.JwtTokenProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service de autenticación
 * Maneja registro y login de usuarios
 */
@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtTokenProvider tokenProvider;

    /**
     * Registra un nuevo usuario
     */
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        // Verificar si el username ya existe
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("El nombre de usuario ya está en uso");
        }

        // Verificar si el email ya existe
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("El email ya está registrado");
        }

        // Crear nuevo usuario
        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .userType(User.UserType.FREE) // Por defecto es FREE
                .build();

        userRepository.save(user);

        // Generar token JWT
        String token = tokenProvider.generateTokenFromUsername(user.getUsername());

        // Retornar respuesta con token
        return AuthResponse.from(user, token);
    }

    /**
     * Autentica un usuario (login)
     */
    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        // Autenticar con Spring Security
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getUsername(),
                        request.getPassword()
                )
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);

        // Generar token JWT
        String token = tokenProvider.generateToken(authentication);

        // Buscar usuario
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        // Retornar respuesta con token
        return AuthResponse.from(user, token);
    }
}