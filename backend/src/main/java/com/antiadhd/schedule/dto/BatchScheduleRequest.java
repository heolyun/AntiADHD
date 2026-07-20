package com.antiadhd.schedule.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import java.util.List;

public record BatchScheduleRequest(
        @NotEmpty @Size(max = 20) List<@Valid ScheduleRequest> schedules
) {
}
