# ── Stage 1: Build React Frontend ──────────────────────────────
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

COPY smart-classroom-frontend/package*.json ./
RUN npm install

COPY smart-classroom-frontend/ ./
RUN npm run build

# ── Stage 2: Build Spring Boot Backend ─────────────────────────
FROM eclipse-temurin:21-jdk AS backend-builder
WORKDIR /app

COPY mvnw* ./
COPY .mvn .mvn
COPY pom.xml ./
RUN sed -i 's/\r$//' mvnw && chmod +x mvnw

COPY src ./src

# Copy built frontend into Spring Boot static directory
COPY --from=frontend-builder /app/frontend/dist ./src/main/resources/static/

RUN ./mvnw clean package -DskipTests

# ── Stage 3: Runtime ───────────────────────────────────────────
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

COPY --from=backend-builder /app/target/*.jar app.jar

ENV PORT=8080
EXPOSE 8080

ENTRYPOINT ["java", "-Djava.security.egd=file:/dev/./urandom", "-jar", "app.jar"]