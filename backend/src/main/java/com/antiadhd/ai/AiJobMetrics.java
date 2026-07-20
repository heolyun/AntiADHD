package com.antiadhd.ai;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.Gauge;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import java.util.concurrent.TimeUnit;
import org.springframework.stereotype.Component;

@Component
public class AiJobMetrics {
    private final Counter completed;
    private final Counter failed;
    private final Counter retried;
    private final Timer processingDuration;

    public AiJobMetrics(MeterRegistry registry, AiJobRepository repository) {
        this.completed = Counter.builder("antiadhd.ai.jobs.completed").register(registry);
        this.failed = Counter.builder("antiadhd.ai.jobs.failed").register(registry);
        this.retried = Counter.builder("antiadhd.ai.jobs.retried").register(registry);
        this.processingDuration = Timer.builder("antiadhd.ai.job.processing.duration").register(registry);
        Gauge.builder("antiadhd.ai.jobs.pending", repository, value -> value.countByStatus(AiJobStatus.PENDING))
                .register(registry);
    }

    public long start() { return System.nanoTime(); }
    public void completed(long startedAt) {
        completed.increment();
        processingDuration.record(System.nanoTime() - startedAt, TimeUnit.NANOSECONDS);
    }
    public void failed(long startedAt) {
        failed.increment();
        processingDuration.record(System.nanoTime() - startedAt, TimeUnit.NANOSECONDS);
    }
    public void retried(long startedAt) {
        retried.increment();
        processingDuration.record(System.nanoTime() - startedAt, TimeUnit.NANOSECONDS);
    }
}
