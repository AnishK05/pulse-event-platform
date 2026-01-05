package kafka

import (
	"encoding/json"
	"fmt"

	"github.com/IBM/sarama"
)

const (
	TopicRawEvents = "events.raw"
)

// Producer wraps Kafka producer functionality
type Producer struct {
	producer sarama.SyncProducer
}

// NewProducer creates a new Kafka producer
func NewProducer(brokers []string) (*Producer, error) {
	config := sarama.NewConfig()
	config.Producer.RequiredAcks = sarama.WaitForAll
	config.Producer.Retry.Max = 3
	config.Producer.Return.Successes = true

	producer, err := sarama.NewSyncProducer(brokers, config)
	if err != nil {
		return nil, fmt.Errorf("failed to create producer: %w", err)
	}

	return &Producer{producer: producer}, nil
}

// PublishRawEvent publishes an event to the events.raw topic
func (p *Producer) PublishRawEvent(event interface{}) error {
	// Serialize event to JSON
	eventBytes, err := json.Marshal(event)
	if err != nil {
		return fmt.Errorf("failed to marshal event: %w", err)
	}

	// Create Kafka message
	msg := &sarama.ProducerMessage{
		Topic: TopicRawEvents,
		Value: sarama.ByteEncoder(eventBytes),
	}

	// Send message
	partition, offset, err := p.producer.SendMessage(msg)
	if err != nil {
		return fmt.Errorf("failed to send message: %w", err)
	}

	fmt.Printf("Message published to partition %d at offset %d\n", partition, offset)
	return nil
}

// Close closes the producer
func (p *Producer) Close() error {
	if p.producer != nil {
		return p.producer.Close()
	}
	return nil
}


