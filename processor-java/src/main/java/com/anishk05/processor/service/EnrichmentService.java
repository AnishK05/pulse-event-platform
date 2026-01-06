package com.anishk05.processor.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@Slf4j
public class EnrichmentService {

    public void enrich(KafkaEventWrapper wrapper) {
        // Add enrichment timestamp
        wrapper.setProcessedAt(LocalDateTime.now().toString());
        
        // Additional enrichment logic can be added here
        // For example:
        // - Add geolocation data
        // - Add user agent parsing
        // - Add custom business logic
        
        log.debug("Enrichment completed for event {}", wrapper.getEvent().getEventId());
    }
}


