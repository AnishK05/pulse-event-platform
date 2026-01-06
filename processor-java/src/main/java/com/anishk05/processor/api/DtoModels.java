package com.anishk05.processor.api;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

// Overview Response
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
class OverviewResponse {
    private long eventsLastMinute;
    private long eventsLast5Minutes;
    private String topEventType;
    private String status;
    private List<EventDto> recentEvents;
}

// Event Type Count
@Data
@AllArgsConstructor
@NoArgsConstructor
class EventTypeCount {
    private String eventType;
    private Long count;
}

// Event DTO
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
class EventDto {
    private String id;
    private String tenantId;
    private String eventId;
    private String idempotencyKey;
    private String eventType;
    private Integer schemaVersion;
    private String occurredAt;
    private String receivedAt;
    private String processedAt;
    private Map<String, Object> payload;
    private String status;
}

// Kafka Lag Response
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
class KafkaLagResponse {
    private String consumerGroup;
    private Long totalLag;
    private String status;
}

// Health Response
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
class HealthResponse {
    private String status;
    private String database;
    private String kafka;
}


