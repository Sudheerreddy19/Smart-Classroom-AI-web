package com.finalYear.smartClassRoom.config;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class SpaForwardController {

    /**
     * Forwards client-side React routes (e.g. /login, /dashboard, /bus-tracking)
     * to /index.html so React Router can handle routing on page refresh.
     *
     * Uses strictly valid Spring Boot 3 / Spring Framework 6 PathPattern patterns.
     * Prevents forwarding for backend APIs, WebSockets, Actuator, Swagger, and static files.
     */
    @GetMapping(value = {
            "/{path:[^\\.]*}",
            "/*/{path:[^\\.]*}",
            "/*/*/{path:[^\\.]*}",
            "/*/*/*/{path:[^\\.]*}"
    })
    public String forward(HttpServletRequest request) {
        String uri = request.getRequestURI();
        if (uri.startsWith("/api") ||
            uri.startsWith("/ws") ||
            uri.startsWith("/swagger-ui") ||
            uri.startsWith("/v3") ||
            uri.startsWith("/actuator")) {
            return "forward:/error";
        }
        return "forward:/index.html";
    }
}