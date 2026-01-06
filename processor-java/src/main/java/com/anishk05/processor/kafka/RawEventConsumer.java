package com.anishk05.processor.kafka;

import com.anishk05.processor.service.EventProcessorService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Component;

@Component
@Slf4j
@RequiredArgsConstructor
public class RawEventConsumer {

    private final EventProcessorService eventProcessorService;

    @KafkaListener(topics = "events.raw", groupId = "${spring.kafka.consumer.group-id}")
    public void consume(
            @Payload String message,
            @Header(KafkaHeaders.RECEIVED_PARTITION) int partition,
            @Header(KafkaHeaders.OFFSET) long offset,
            Acknowledgment acknowledgment) {
        
        log.debug("Received message from partition {} at offset {}", partition, offset);
        
        try {
            // Process the event
            eventProcessorService.processEvent(message);
            
            // Manually acknowledge after successful processing
            acknowledgment.acknowledge();
            
            log.debug("Successfully processed and acknowledged message at offset {}", offset);
        } catch (Exception e) {
            log.error("Failed to process message at offset {}: {}", offset, e.getMessage(), e);
            // Acknowledge anyway to avoid blocking the consumer
            // DLQ handling is done inside processEvent
            acknowledgment.acknowledge();
        }
    }
}


