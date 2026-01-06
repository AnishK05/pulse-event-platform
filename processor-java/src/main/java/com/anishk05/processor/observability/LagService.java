package com.anishk05.processor.observability;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.anishk05.processor.api.DlqSample;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.admin.AdminClient;
import org.apache.kafka.clients.admin.ListConsumerGroupOffsetsResult;
import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.apache.kafka.clients.consumer.ConsumerRecords;
import org.apache.kafka.clients.consumer.KafkaConsumer;
import org.apache.kafka.common.TopicPartition;
import org.apache.kafka.common.serialization.StringDeserializer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaAdmin;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.*;
import java.util.concurrent.ExecutionException;

@Service
@Slf4j
@RequiredArgsConstructor
public class LagService {

    private final KafkaAdmin kafkaAdmin;
    private final ObjectMapper objectMapper;

    @Value("${spring.kafka.bootstrap-servers}")
    private String bootstrapServers;

    @Value("${spring.kafka.consumer.group-id}")
    private String consumerGroupId;

    public long getConsumerLag() {
        try (AdminClient adminClient = AdminClient.create(kafkaAdmin.getConfigurationProperties())) {
            // Get consumer group offsets
            ListConsumerGroupOffsetsResult offsetsResult = 
                adminClient.listConsumerGroupOffsets(consumerGroupId);
            
            Map<TopicPartition, org.apache.kafka.clients.consumer.OffsetAndMetadata> offsets = 
                offsetsResult.partitionsToOffsetAndMetadata().get();

            // Get end offsets for all partitions
            Set<TopicPartition> partitions = offsets.keySet();
            Map<TopicPartition, Long> endOffsets = 
                adminClient.listOffsets(
                    partitions.stream().collect(
                        java.util.stream.Collectors.toMap(
                            tp -> tp,
                            tp -> org.apache.kafka.clients.admin.OffsetSpec.latest()
                        )
                    )
                ).all().get().entrySet().stream().collect(
                    java.util.stream.Collectors.toMap(
                        Map.Entry::getKey,
                        e -> e.getValue().offset()
                    )
                );

            // Calculate lag
            long totalLag = 0;
            for (TopicPartition partition : partitions) {
                long currentOffset = offsets.get(partition).offset();
                long endOffset = endOffsets.getOrDefault(partition, 0L);
                long lag = endOffset - currentOffset;
                totalLag += Math.max(0, lag);
            }

            return totalLag;
        } catch (ExecutionException | InterruptedException e) {
            log.error("Failed to calculate lag", e);
            return 0;
        }
    }

    public List<DlqSample> consumeDlqSamples(int limit) {
        List<DlqSample> samples = new ArrayList<>();
        
        Properties props = new Properties();
        props.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
        props.put(ConsumerConfig.GROUP_ID_CONFIG, "dlq-reader-" + UUID.randomUUID());
        props.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class.getName());
        props.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class.getName());
        props.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "earliest");
        props.put(ConsumerConfig.MAX_POLL_RECORDS_CONFIG, limit);
        props.put(ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG, "false");

        try (KafkaConsumer<String, String> consumer = new KafkaConsumer<>(props)) {
            consumer.subscribe(Collections.singletonList("events.dlq"));
            
            // Poll once with timeout
            ConsumerRecords<String, String> records = consumer.poll(Duration.ofSeconds(2));
            
            for (ConsumerRecord<String, String> record : records) {
                if (samples.size() >= limit) break;
                
                try {
                    DlqSample sample = objectMapper.readValue(record.value(), DlqSample.class);
                    samples.add(sample);
                } catch (Exception e) {
                    log.warn("Failed to parse DLQ message: {}", e.getMessage());
                    // Create a basic sample from the raw message
                    samples.add(DlqSample.builder()
                            .failedAt(new Date().toString())
                            .reason("Parse error")
                            .original(record.value())
                            .tenantId("unknown")
                            .build());
                }
            }
        } catch (Exception e) {
            log.error("Failed to consume DLQ samples", e);
        }

        return samples;
    }
}


