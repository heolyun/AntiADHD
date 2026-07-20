package com.antiadhd.ai.config;

import java.time.ZoneId;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.ai.usage")
public class AiUsageProperties {
    private int dailyLimitPerUser = 10;
    private ZoneId resetZone = ZoneId.of("Asia/Seoul");

    public int getDailyLimitPerUser() { return dailyLimitPerUser; }
    public void setDailyLimitPerUser(int dailyLimitPerUser) { this.dailyLimitPerUser = dailyLimitPerUser; }
    public ZoneId getResetZone() { return resetZone; }
    public void setResetZone(ZoneId resetZone) { this.resetZone = resetZone; }
}
