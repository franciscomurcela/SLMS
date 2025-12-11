FROM maven:3.9.11-eclipse-temurin-17-alpine AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests -U

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8082
ENTRYPOINT ["java", "-jar", "app.jar"]

# Healthcheck para o container
HEALTHCHECK --interval=30s --timeout=10s --retries=3 CMD curl -f http://localhost:8082/user/health || exit 1
