package com.antiadhd.ai.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

@Configuration
@EnableScheduling
@EnableConfigurationProperties({OpenAiProperties.class, AiWorkerProperties.class, AiUsageProperties.class})
public class AiConfiguration {
}
