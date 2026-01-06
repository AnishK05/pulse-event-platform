package com.anishk05.processor.api;

import com.anishk05.processor.db.EventEntity;
import com.anishk05.processor.db.EventRepository;
import com.anishk05.processor.observability.LagService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/admin")
@Slf4j
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AdminController {

    private final EventRepository eventRepository;
    private final LagService lagService;

    @GetMapping("/overview")
    public ResponseEntity<OverviewResponse> getOverview() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime oneMinuteAgo = now.minusMinutes(1);
        LocalDateTime fiveMinutesAgo = now.minusMinutes(5);

        long eventsLastMinute = eventRepository.countEventsSince(oneMinuteAgo);
        long eventsLast5Minutes = eventRepository.countEventsSince(fiveMinutesAgo);
        
        List<Object[]> topEventTypes = eventRepository.countEventTypesSince(now.minusHours(24));
        String topEventType = "none";
        if (!topEventTypes.isEmpty()) {
            topEventType = (String) topEventTypes.get(0)[0];
        }

        // Fetch recent events
        List<EventEntity> recentEventEntities = eventRepository.findRecentEventsByReceivedAt(PageRequest.of(0, 20));
        List<EventDto> recentEvents = recentEventEntities.stream()
                .map(this::toEventDto)
                .toList();

        OverviewResponse response = OverviewResponse.builder()
                .eventsLastMinute(eventsLastMinute)
                .eventsLast5Minutes(eventsLast5Minutes)
                .topEventType(topEventType)
                .status("healthy")
                .recentEvents(recentEvents)
                .build();

        return ResponseEntity.ok(response);
    }

    @GetMapping("/top-event-types")
    public ResponseEntity<List<EventTypeCount>> getTopEventTypes(
            @RequestParam(defaultValue = "1440") int sinceMinutes) {
        
        LocalDateTime since = LocalDateTime.now().minusMinutes(sinceMinutes);
        List<Object[]> results = eventRepository.countEventTypesSince(since);
        
        List<EventTypeCount> counts = results.stream()
                .map(row -> new EventTypeCount((String) row[0], (Long) row[1]))
                .toList();

        return ResponseEntity.ok(counts);
    }

    @GetMapping("/event/search")
    public ResponseEntity<?> searchByEventId(
            @RequestParam String tenant,
            @RequestParam String eventId) {
        
        Optional<EventEntity> event = eventRepository.findByTenantIdAndEventId(tenant, eventId);
        
        if (event.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(toEventDto(event.get()));
    }

    @GetMapping("/event/by-idempotency")
    public ResponseEntity<?> searchByIdempotency(
            @RequestParam String tenant,
            @RequestParam String idempotencyKey) {
        
        Optional<EventEntity> event = eventRepository.findByTenantIdAndIdempotencyKey(tenant, idempotencyKey);
        
        if (event.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(toEventDto(event.get()));
    }

    @GetMapping("/dlq/sample")
    public ResponseEntity<List<DlqSample>> getDlqSample(@RequestParam(defaultValue = "20") int limit) {
        // For MVP, we'll return a placeholder or consume from Kafka topic
        // In a real implementation, you'd consume from the DLQ topic
        List<DlqSample> samples = lagService.consumeDlqSamples(limit);
        return ResponseEntity.ok(samples);
    }

    @GetMapping("/kafka/lag")
    public ResponseEntity<KafkaLagResponse> getKafkaLag() {
        try {
            long lag = lagService.getConsumerLag();
            return ResponseEntity.ok(KafkaLagResponse.builder()
                    .consumerGroup("event-processor")
                    .totalLag(lag)
                    .status(lag > 1000 ? "warning" : "ok")
                    .build());
        } catch (Exception e) {
            log.error("Failed to get Kafka lag", e);
            return ResponseEntity.ok(KafkaLagResponse.builder()
                    .consumerGroup("event-processor")
                    .totalLag(0L)
                    .status("unknown")
                    .build());
        }
    }

    @GetMapping("/health")
    public ResponseEntity<HealthResponse> health() {
        return ResponseEntity.ok(HealthResponse.builder()
                .status("UP")
                .database("connected")
                .kafka("connected")
                .build());
    }

    private EventDto toEventDto(EventEntity entity) {
        return EventDto.builder()
                .id(entity.getId().toString())
                .tenantId(entity.getTenantId())
                .eventId(entity.getEventId())
                .idempotencyKey(entity.getIdempotencyKey())
                .eventType(entity.getEventType())
                .schemaVersion(entity.getSchemaVersion())
                .occurredAt(entity.getOccurredAt().toString())
                .receivedAt(entity.getReceivedAt().toString())
                .processedAt(entity.getProcessedAt().toString())
                .payload(entity.getPayload())
                .status(entity.getStatus())
                .build();
    }
}


