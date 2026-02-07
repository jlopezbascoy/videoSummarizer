package com.youtubesummarizer.backend.service;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.youtubesummarizer.backend.dto.GoogleAuthResponse;
import com.youtubesummarizer.backend.model.User;
import com.youtubesummarizer.backend.repository.UserRepository;
import com.youtubesummarizer.backend.security.JwtTokenProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.Optional;
import java.util.UUID;

@Service
public class GoogleOAuthService {

    private static final Logger logger = LoggerFactory.getLogger(GoogleOAuthService.class);

    private final UserRepository userRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final GoogleIdTokenVerifier verifier;

    @Value("${spring.security.oauth2.client.registration.google.client-id}")
    private String googleClientId;

    public GoogleOAuthService(
            UserRepository userRepository,
            JwtTokenProvider jwtTokenProvider,
            @Value("${spring.security.oauth2.client.registration.google.client-id}") String clientId) {

        this.userRepository = userRepository;
        this.jwtTokenProvider = jwtTokenProvider;

        // Configurar verificador de tokens de Google
        this.verifier = new GoogleIdTokenVerifier.Builder(
                new NetHttpTransport(),
                GsonFactory.getDefaultInstance())
                .setAudience(Collections.singletonList(clientId))
                .build();
    }

    /**
     * Autenticar usuario con Google ID Token
     */
    @Transactional
    public GoogleAuthResponse authenticateWithGoogle(String idTokenString) {
        try {
            // Verificar token con Google
            GoogleIdToken idToken = verifier.verify(idTokenString);

            if (idToken == null) {
                throw new RuntimeException("Token de Google inválido");
            }

            // Extraer información del token
            GoogleIdToken.Payload payload = idToken.getPayload();
            String googleId = payload.getSubject();
            String email = payload.getEmail();
            String name = (String) payload.get("name");
            String pictureUrl = (String) payload.get("picture");
            boolean emailVerified = payload.getEmailVerified();

            logger.info("Usuario autenticado con Google: {} ({})", name, email);

            // Buscar o crear usuario
            User user = findOrCreateUser(googleId, email, name, pictureUrl, emailVerified);

            // Generar JWT token
            String jwtToken = jwtTokenProvider.generateToken(user.getUsername());

            return new GoogleAuthResponse(
                    jwtToken,
                    user.getUsername(),
                    user.getEmail(),
                    user.getUserType().toString(),
                    user.getPictureUrl(),
                    user.getCreatedAt().plusSeconds(10).isAfter(java.time.LocalDateTime.now()) // Si fue creado hace menos de 10 seg
            );

        } catch (Exception e) {
            logger.error("Error al autenticar con Google: {}", e.getMessage());
            throw new RuntimeException("Error al autenticar con Google: " + e.getMessage());
        }
    }

    /**
     * Buscar usuario existente o crear nuevo
     */
    private User findOrCreateUser(String googleId, String email, String name, String pictureUrl, boolean emailVerified) {
        // Buscar por Google ID
        Optional<User> existingUser = userRepository.findByGoogleId(googleId);

        if (existingUser.isPresent()) {
            // Usuario existe, actualizar info si cambió
            User user = existingUser.get();
            boolean updated = false;

            if (!user.getPictureUrl().equals(pictureUrl)) {
                user.setPictureUrl(pictureUrl);
                updated = true;
            }

            if (updated) {
                userRepository.save(user);
            }

            return user;
        }

        // Buscar por email (por si ya tiene cuenta con email/password)
        Optional<User> userByEmail = userRepository.findByEmail(email);

        if (userByEmail.isPresent()) {
            // Vincular cuenta existente con Google
            User user = userByEmail.get();
            user.setGoogleId(googleId);
            user.setProvider("google");
            user.setPictureUrl(pictureUrl);
            user.setEmailVerified(true);

            logger.info("Cuenta existente vinculada con Google: {}", email);
            return userRepository.save(user);
        }

        // Crear nuevo usuario
        User newUser = User.fromGoogleOAuth(googleId, email, name, pictureUrl);

        // Generar username único si el nombre ya existe
        String username = generateUniqueUsername(name);
        newUser.setUsername(username);

        logger.info("Nuevo usuario creado desde Google: {} ({})", username, email);
        return userRepository.save(newUser);
    }

    /**
     * Generar username único
     */
    private String generateUniqueUsername(String baseName) {
        String username = baseName.replaceAll("\\s+", "").toLowerCase();

        if (!userRepository.findByUsername(username).isPresent()) {
            return username;
        }

        // Agregar sufijo numérico si ya existe
        int suffix = 1;
        while (userRepository.findByUsername(username + suffix).isPresent()) {
            suffix++;
        }

        return username + suffix;
    }
}