# syntax=docker/dockerfile:1.7

FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app

COPY pom.xml .
RUN --mount=type=cache,target=/root/.m2 mvn -q -DskipTests dependency:go-offline

COPY src ./src
RUN --mount=type=cache,target=/root/.m2 mvn -q -DskipTests package \
    && java -Djarmode=tools -jar target/*.jar extract --layers --launcher --destination target/extracted

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

RUN addgroup -S app && adduser -S app -G app

COPY --from=build --chown=app:app /app/target/extracted/dependencies/ ./
COPY --from=build --chown=app:app /app/target/extracted/spring-boot-loader/ ./
COPY --from=build --chown=app:app /app/target/extracted/snapshot-dependencies/ ./
COPY --from=build --chown=app:app /app/target/extracted/application/ ./

USER app
EXPOSE 8080
ENTRYPOINT ["sh", "-c", "exec java ${JAVA_OPTS:-} org.springframework.boot.loader.launch.JarLauncher"]
