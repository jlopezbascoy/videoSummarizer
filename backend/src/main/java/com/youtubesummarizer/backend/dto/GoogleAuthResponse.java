package com.youtubesummarizer.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class GoogleAuthResponse {
    private String token;
    private String username;
    private String email;
    private String userType;
    private String pictureUrl;
    private boolean isNewUser;
    private int dailyLimit;
    private int maxVideoDuration;
}