# ==========================
# Build Stage
# ==========================
FROM eclipse-temurin:21-jdk-alpine AS build

WORKDIR /app

COPY mvnw .
COPY mvnw.cmd .
COPY pom.xml .
COPY .mvn .mvn

RUN chmod +x mvnw

RUN ./mvnw dependency:go-offline

COPY src src

RUN ./mvnw clean package -DskipTests


# ==========================
# Runtime Stage
# ==========================

FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

RUN apk add --no-cache curl

RUN addgroup -S smartclass \
    && adduser -S smartclass -G smartclass

COPY --from=build /app/target/*.jar app.jar

RUN mkdir logs

RUN chown -R smartclass:smartclass /app

USER smartclass

EXPOSE 8080

ENV JAVA_OPTS=""

ENTRYPOINT ["sh","-c","java $JAVA_OPTS -jar app.jar"]

HEALTHCHECK --interval=30s \
--timeout=10s \
--start-period=60s \
--retries=5 \
CMD curl -f http://localhost:8080/actuator/health || exit 1