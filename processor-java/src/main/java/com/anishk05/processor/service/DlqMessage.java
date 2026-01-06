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
public class DlqMessage {
    
    @JsonProperty("failed_at")
    private String failedAt;
    
    @JsonProperty("reason")
    private String reason;
    
    @JsonProperty("original")
    private String original;
    
    @JsonProperty("tenant_id")
    private String tenantId;
}


