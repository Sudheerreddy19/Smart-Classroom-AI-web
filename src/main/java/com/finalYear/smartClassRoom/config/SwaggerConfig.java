package com.finalYear.smartClassRoom.config;

import io.swagger.v3.oas.models.ExternalDocumentation;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SwaggerConfig {

    @Bean
    public OpenAPI smartClassroomAPI() {

        final String securitySchemeName = "Bearer Authentication";

        return new OpenAPI()

                .info(new Info()
                        .title("Smart Classroom Hub API")
                        .description("""
                                REST API documentation for Smart Classroom Hub.

                                Features:
                                • User Authentication (JWT)
                                • Student Management
                                • Teacher Management
                                • Attendance using Face Recognition
                                • AI Assistant
                                • IoT Device Control
                                • MQTT Communication
                                • Dashboard Analytics
                                """)
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("Final Year Project Team")
                                .email("support@smartclassroom.com"))
                        .license(new License()
                                .name("MIT License")))

                .addSecurityItem(new SecurityRequirement()
                        .addList(securitySchemeName))

                .schemaRequirement(
                        securitySchemeName,
                        new SecurityScheme()
                                .name(securitySchemeName)
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT"))

                .externalDocs(new ExternalDocumentation()
                        .description("Project Documentation")
                        .url("https://github.com"));
    }
}