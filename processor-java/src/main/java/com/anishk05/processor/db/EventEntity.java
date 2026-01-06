package com.anishk05.processor.db;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "events")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EventEntity {
    
    @Id
    private UUID id;
    
    @Column(name = "tenant_id", nullable = false)
    private String tenantId;
    
    @Column(name = "event_id", nullable = false)
    private String eventId;
    
    @Column(name = "idempotency_key", nullable = false)
    private String idempotencyKey;
    
    @Column(name = "event_type", nullable = false)
    private String eventType;
    
    @Column(name = "schema_version", nullable = false)
    private Integer schemaVersion;
    
    @Column(name = "occurred_at", nullable = false)
    private LocalDateTime occurredAt;
    
    @Column(name = "received_at", nullable = false)
    private LocalDateTime receivedAt;
    
    @Column(name = "processed_at", nullable = false)
    private LocalDateTime processedAt;
    
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "payload", nullable = false, columnDefinition = "jsonb")
    private Map<String, Object> payload;
    
    @Column(name = "status", nullable = false)
    private String status;
}


