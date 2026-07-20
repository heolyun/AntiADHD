package com.antiadhd.ai.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.ai.worker")
public class AiWorkerProperties {
    private boolean enabled;
    private long pollDelayMs = 2000;
    private long staleAfterSeconds = 300;
    private int maxAttempts = 3;

    public boolean isEnabled() { return enabled; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }
    public long getPollDelayMs() { return pollDelayMs; }
    public void setPollDelayMs(long pollDelayMs) { this.pollDelayMs = pollDelayMs; }
    public long getStaleAfterSeconds() { return staleAfterSeconds; }
    public void setStaleAfterSeconds(long staleAfterSeconds) { this.staleAfterSeconds = staleAfterSeconds; }
    public int getMaxAttempts() { return maxAttempts; }
    public void setMaxAttempts(int maxAttempts) { this.maxAttempts = maxAttempts; }
}
