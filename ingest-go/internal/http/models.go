package http

import "time"

// IngestRequest represents the incoming event payload
type IngestRequest struct {
	EventID       string                 `json:"event_id"`
	EventType     string                 `json:"event_type"`
	SchemaVersion int                    `json:"schema_version"`
	OccurredAt    string                 `json:"occurred_at"`
	Payload       map[string]interface{} `json:"payload"`
}

// Validate performs basic validation on the request
func (r *IngestRequest) Validate() error {
	if r.EventID == "" {
		return NewValidationError("event_id is required")
	}
	if r.EventType == "" {
		return NewValidationError("event_type is required")
	}
	if r.SchemaVersion <= 0 {
		return NewValidationError("schema_version must be positive")
	}
	if r.OccurredAt == "" {
		return NewValidationError("occurred_at is required")
	}
	// Validate timestamp format
	if _, err := time.Parse(time.RFC3339, r.OccurredAt); err != nil {
		return NewValidationError("occurred_at must be in RFC3339 format")
	}
	if r.Payload == nil {
		return NewValidationError("payload is required")
	}
	return nil
}

// KafkaEventWrapper wraps the original event with ingestion metadata
type KafkaEventWrapper struct {
	TenantID       string        `json:"tenant_id"`
	ReceivedAt     string        `json:"received_at"`
	RequestID      string        `json:"request_id"`
	IdempotencyKey string        `json:"idempotency_key"`
	Event          IngestRequest `json:"event"`
}

// IngestResponse represents the API response
type IngestResponse struct {
	Status    string `json:"status"`
	RequestID string `json:"request_id"`
	Duplicate bool   `json:"duplicate"`
}

// HealthResponse represents the health check response
type HealthResponse struct {
	Status       string            `json:"status"`
	Dependencies map[string]string `json:"dependencies"`
}


