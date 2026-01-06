package com.anishk05.processor.api;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

// DLQ Sample
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DlqSample {
    private String failedAt;
    private String reason;
    private String original;
    private String tenantId;
}
