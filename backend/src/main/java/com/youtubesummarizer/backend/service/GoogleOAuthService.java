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
import java.util.Objects;
import java.util.Optional;

@Service
public class GoogleOAuthService {

    private static final Logger logger = LoggerFactory.getLogger(GoogleOAuthService.class);

    private final UserRepository userRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final GoogleIdTokenVerifier verifier;

    public GoogleOAuthService(
            UserRepository userRepository,
            JwtTokenProvider jwtTokenProvider,
            @Value("${google.client.id}") String clientId) {

        this.userRepository = userRepository;
        this.jwtTokenProvider = jwtTokenProvider;

        logger.info("Inicializando GoogleOAuthService con client ID: {}...{}",
                clientId.substring(0, 8), clientId.substring(clientId.length() - 8));

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
            logger.debug("Verificando token de Google (longitud: {})", idTokenString != null ? idTokenString.length() : "null");

            // Verificar token con Google
            GoogleIdToken idToken = verifier.verify(idTokenString);

            if (idToken == null) {
                logger.error("Google rechazó el token - puede ser client ID incorrecto o token expirado");
                throw new RuntimeException("Token de Google inválido o expirado");
            }

            // Extraer información del token
            GoogleIdToken.Payload payload = idToken.getPayload();
            String googleId = payload.getSubject();
            String email = payload.getEmail();
            String name = (String) payload.get("name");
            String pictureUrl = (String) payload.get("picture");
            boolean emailVerified = payload.getEmailVerified();

            logger.info("Token verificado correctamente para: {} ({})", name, email);

            // Buscar o crear usuario
            User user = findOrCreateUser(googleId, email, name, pictureUrl, emailVerified);

            // Generar JWT token
            String jwtToken = jwtTokenProvider.generateTokenFromUsername(user.getUsername());

            boolean isNewUser = user.getCreatedAt() != null
                    && user.getCreatedAt().plusSeconds(10).isAfter(java.time.LocalDateTime.now());

            return new GoogleAuthResponse(
                    jwtToken,
                    user.getUsername(),
                    user.getEmail(),
                    user.getUserType().toString(),
                    user.getPictureUrl(),
                    isNewUser,
                    user.getDailyLimit(),
                    user.getMaxVideoDuration()
            );

        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            logger.error("Error al autenticar con Google: {}", e.getMessage(), e);
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
            User user = existingUser.get();

            // Actualizar pictureUrl si cambió (null-safe)
            if (!Objects.equals(user.getPictureUrl(), pictureUrl)) {
                user.setPictureUrl(pictureUrl);
                userRepository.save(user);
            }

            logger.info("Usuario existente autenticado: {}", user.getUsername());
            return user;
        }

        // Buscar por email (por si ya tiene cuenta con email/password)
        Optional<User> userByEmail = userRepository.findByEmail(email);

        if (userByEmail.isPresent()) {
            User user = userByEmail.get();
            user.setGoogleId(googleId);
            user.setProvider("google");
            user.setPictureUrl(pictureUrl);
            user.setEmailVerified(true);

            logger.info("Cuenta existente vinculada con Google: {}", email);
            return userRepository.save(user);
        }

        // Crear nuevo usuario
        String username = generateUniqueUsername(name);

        User newUser = User.fromGoogleOAuth(googleId, email, username, pictureUrl);

        logger.info("Nuevo usuario creado desde Google: {} ({})", username, email);
        return userRepository.save(newUser);
    }

    /**
     * Generar username único
     */
    private String generateUniqueUsername(String baseName) {
        if (baseName == null || baseName.isBlank()) {
            baseName = "user_" + System.currentTimeMillis();
        }

        String username = baseName.replaceAll("\\s+", "").toLowerCase();

        // Asegurar mínimo 3 caracteres (validación del modelo)
        if (username.length() < 3) {
            username = username + "user";
        }

        // Truncar a 45 chars para dejar espacio al sufijo numérico
        if (username.length() > 45) {
            username = username.substring(0, 45);
        }

        if (userRepository.findByUsername(username).isEmpty()) {
            return username;
        }

        int suffix = 1;
        while (userRepository.findByUsername(username + suffix).isPresent()) {
            suffix++;
        }

        return username + suffix;
    }
}