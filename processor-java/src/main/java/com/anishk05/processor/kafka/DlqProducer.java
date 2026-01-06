package com.anishk05.processor.kafka;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.anishk05.processor.service.DlqMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
@Slf4j
@RequiredArgsConstructor
public class DlqProducer {

    private static final String DLQ_TOPIC = "events.dlq";
    
    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;

    public void sendToDlq(String originalMessage, String reason, String tenantId) {
        try {
            DlqMessage dlqMessage = DlqMessage.builder()
                    .failedAt(java.time.LocalDateTime.now().toString())
                    .reason(reason)
                    .original(originalMessage)
                    .tenantId(tenantId)
                    .build();
            
            String dlqMessageJson = objectMapper.writeValueAsString(dlqMessage);
            
            kafkaTemplate.send(DLQ_TOPIC, dlqMessageJson);
            log.warn("Sent message to DLQ. Reason: {}", reason);
        } catch (Exception e) {
            log.error("Failed to send message to DLQ: {}", e.getMessage(), e);
        }
    }
}


