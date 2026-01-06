package com.anishk05.processor.service;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IngestEvent {
    
    @JsonProperty("event_id")
    private String eventId;
    
    @JsonProperty("event_type")
    private String eventType;
    
    @JsonProperty("schema_version")
    private Integer schemaVersion;
    
    @JsonProperty("occurred_at")
    private String occurredAt;
    
    @JsonProperty("payload")
    private Map<String, Object> payload;
}


