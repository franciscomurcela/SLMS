FROM eclipse-temurin:17-jdk AS build
WORKDIR /workspace

# Copy Maven wrapper first for cache
COPY mvnw .
COPY .mvn .mvn
COPY pom.xml ./
COPY src ./src

RUN chmod +x ./mvnw \
    && ./mvnw -B -DskipTests package

FROM eclipse-temurin:17-jre AS runtime
WORKDIR /app

ARG JAR_FILE=target/*-SNAPSHOT.jar
COPY --from=build /workspace/${JAR_FILE} /app/app.jar

EXPOSE 8080
ENTRYPOINT ["java","-jar","/app/app.jar"]
