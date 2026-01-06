package com.anishk05.processor.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.List;

@Service
@Slf4j
public class ValidationService {

    private static final List<Integer> ALLOWED_SCHEMA_VERSIONS = Arrays.asList(1, 2);

    public void validate(KafkaEventWrapper wrapper) throws ValidationException {
        if (wrapper == null) {
            throw new ValidationException("Event wrapper is null");
        }

        IngestEvent event = wrapper.getEvent();
        if (event == null) {
            throw new ValidationException("Event is null");
        }

        // Validate required fields
        if (isEmpty(event.getEventId())) {
            throw new ValidationException("event_id is required");
        }

        if (isEmpty(event.getEventType())) {
            throw new ValidationException("event_type is required");
        }

        if (event.getSchemaVersion() == null || event.getSchemaVersion() <= 0) {
            throw new ValidationException("schema_version must be positive");
        }

        // Validate schema version is in allowed list
        if (!ALLOWED_SCHEMA_VERSIONS.contains(event.getSchemaVersion())) {
            throw new ValidationException("schema_version " + event.getSchemaVersion() + 
                    " is not supported. Allowed versions: " + ALLOWED_SCHEMA_VERSIONS);
        }

        if (isEmpty(event.getOccurredAt())) {
            throw new ValidationException("occurred_at is required");
        }

        // Validate timestamp format
        try {
            LocalDateTime.parse(event.getOccurredAt(), DateTimeFormatter.ISO_DATE_TIME);
        } catch (Exception e) {
            throw new ValidationException("occurred_at must be in ISO-8601 format: " + e.getMessage());
        }

        if (event.getPayload() == null || event.getPayload().isEmpty()) {
            throw new ValidationException("payload is required and cannot be empty");
        }

        // Validate wrapper fields
        if (isEmpty(wrapper.getTenantId())) {
            throw new ValidationException("tenant_id is required");
        }

        if (isEmpty(wrapper.getIdempotencyKey())) {
            throw new ValidationException("idempotency_key is required");
        }

        log.debug("Validation passed for event {}", event.getEventId());
    }

    private boolean isEmpty(String value) {
        return value == null || value.trim().isEmpty();
    }
}


