package com.anishk05.processor.service;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KafkaEventWrapper {
    
    @JsonProperty("tenant_id")
    private String tenantId;
    
    @JsonProperty("received_at")
    private String receivedAt;
    
    @JsonProperty("request_id")
    private String requestId;
    
    @JsonProperty("idempotency_key")
    private String idempotencyKey;
    
    @JsonProperty("event")
    private IngestEvent event;
    
    @JsonProperty("processed_at")
    private String processedAt;
}


