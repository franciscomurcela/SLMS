# Multi-stage Dockerfile for building and running the Spring Boot demo application
# Stage 1: build with JDK 21 and install Maven (ensures JDK21 even if no official maven:jdk-21 tag)
FROM eclipse-temurin:21-jdk AS build
WORKDIR /workspace

# Use the project's Maven Wrapper (mvnw) to download and run the correct Maven version
# Copy wrapper scripts and files first to leverage Docker cache
COPY mvnw .
COPY .mvn .mvn
COPY pom.xml ./
COPY src ./src

# Ensure the wrapper is executable and build the project
RUN chmod +x ./mvnw \
	&& ./mvnw -B -DskipTests package

# Stage 2: run with JRE 21
FROM eclipse-temurin:21-jre AS runtime
WORKDIR /app

# Copy the jar produced in the build stage. Adjust the artifact name if different.
ARG JAR_FILE=target/demo-0.0.1-SNAPSHOT.jar
COPY --from=build /workspace/${JAR_FILE} /app/app.jar

# Expose default Spring Boot port (change if your app uses another port)
EXPOSE 8080

# Run the application
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
