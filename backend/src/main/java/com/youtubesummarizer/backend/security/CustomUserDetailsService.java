package com.youtubesummarizer.backend.security;

import com.youtubesummarizer.backend.model.User;
import com.youtubesummarizer.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    @Autowired
    private UserRepository userRepository;

    @Override
    @Transactional
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() ->
                        new UsernameNotFoundException("Usuario no encontrado: " + username)
                );

        String password = user.getPasswordHash() != null
                ? user.getPasswordHash()
                : "{noop}google-oauth-user";

        return new org.springframework.security.core.userdetails.User(
                user.getUsername(),
                password,
                new ArrayList<>()
        );
    }

    @Transactional
    public UserDetails loadUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() ->
                        new UsernameNotFoundException("Usuario no encontrado con id: " + id)
                );

        String password = user.getPasswordHash() != null
                ? user.getPasswordHash()
                : "{noop}google-oauth-user";

        return new org.springframework.security.core.userdetails.User(
                user.getUsername(),
                password,
                new ArrayList<>()
        );
    }
}