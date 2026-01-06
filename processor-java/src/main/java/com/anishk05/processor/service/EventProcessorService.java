package com.anishk05.processor.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.anishk05.processor.db.EventEntity;
import com.anishk05.processor.db.EventRepository;
import com.anishk05.processor.kafka.DlqProducer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
public class EventProcessorService {

    private final ValidationService validationService;
    private final EnrichmentService enrichmentService;
    private final EventRepository eventRepository;
    private final DlqProducer dlqProducer;
    private final ObjectMapper objectMapper;

    @Transactional
    public void processEvent(String rawMessage) {
        KafkaEventWrapper wrapper = null;
        String tenantId = null;
        
        try {
            // 1. Deserialize
            wrapper = objectMapper.readValue(rawMessage, KafkaEventWrapper.class);
            tenantId = wrapper.getTenantId();
            
            // 2. Validate
            validationService.validate(wrapper);
            
            // 3. Enrich
            enrichmentService.enrich(wrapper);
            
            // 4. Save to database
            EventEntity entity = buildEventEntity(wrapper);
            eventRepository.save(entity);
            
            log.info("Successfully processed event {} for tenant {}", 
                    wrapper.getEvent().getEventId(), tenantId);
            
        } catch (JsonProcessingException e) {
            log.error("Failed to deserialize message: {}", e.getMessage());
            dlqProducer.sendToDlq(rawMessage, "DESERIALIZATION_FAILED: " + e.getMessage(), tenantId);
        } catch (ValidationException e) {
            log.error("Validation failed: {}", e.getMessage());
            dlqProducer.sendToDlq(rawMessage, "VALIDATION_FAILED: " + e.getMessage(), tenantId);
        } catch (Exception e) {
            log.error("Unexpected error processing event: {}", e.getMessage(), e);
            dlqProducer.sendToDlq(rawMessage, "PROCESSING_ERROR: " + e.getMessage(), tenantId);
        }
    }

    private EventEntity buildEventEntity(KafkaEventWrapper wrapper) {
        IngestEvent event = wrapper.getEvent();
        
        return EventEntity.builder()
                .id(UUID.randomUUID())
                .tenantId(wrapper.getTenantId())
                .eventId(event.getEventId())
                .idempotencyKey(wrapper.getIdempotencyKey())
                .eventType(event.getEventType())
                .schemaVersion(event.getSchemaVersion())
                .occurredAt(parseTimestamp(event.getOccurredAt()))
                .receivedAt(parseTimestamp(wrapper.getReceivedAt()))
                .processedAt(LocalDateTime.now())
                .payload(event.getPayload())
                .status("processed")
                .build();
    }

    private LocalDateTime parseTimestamp(String timestamp) {
        try {
            return LocalDateTime.parse(timestamp, DateTimeFormatter.ISO_DATE_TIME);
        } catch (Exception e) {
            log.warn("Failed to parse timestamp {}, using current time", timestamp);
            return LocalDateTime.now();
        }
    }
}


