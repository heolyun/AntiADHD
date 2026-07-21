package com.antiadhd.ai.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.ai.openai")
public class OpenAiProperties {
    private boolean enabled;
    private String apiKey = "";
    private String baseUrl = "https://api.openai.com";
    private String model = "gpt-5.6-luna";
    private String transcriptionModel = "gpt-4o-mini-transcribe";
    private int timeoutSeconds = 90;

    public boolean isEnabled() { return enabled; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }
    public String getApiKey() { return apiKey; }
    public void setApiKey(String apiKey) { this.apiKey = apiKey; }
    public String getBaseUrl() { return baseUrl; }
    public void setBaseUrl(String baseUrl) { this.baseUrl = baseUrl; }
    public String getModel() { return model; }
    public void setModel(String model) { this.model = model; }
    public String getTranscriptionModel() { return transcriptionModel; }
    public void setTranscriptionModel(String transcriptionModel) { this.transcriptionModel = transcriptionModel; }
    public int getTimeoutSeconds() { return timeoutSeconds; }
    public void setTimeoutSeconds(int timeoutSeconds) { this.timeoutSeconds = timeoutSeconds; }
}
