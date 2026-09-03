package com.finalYear.smartClassRoom.util;

public class JwtUtil {

    private JwtUtil() {
    }

    public static String extractToken(String bearerToken) {

        if (bearerToken == null) {
            return null;
        }

        if (bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }

        return bearerToken;
    }

    public static boolean isBearerToken(String token) {

        return token != null &&
                token.startsWith("Bearer ");
    }
}