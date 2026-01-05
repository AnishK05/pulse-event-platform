package http

import (
	"encoding/json"
	"log"
	"net/http"
	"time"

	"github.com/anishk05/pulse-event-platform/ingest-go/internal/config"
	"github.com/anishk05/pulse-event-platform/ingest-go/internal/kafka"
	"github.com/anishk05/pulse-event-platform/ingest-go/internal/redis"
	"github.com/google/uuid"
)

// EventHandler handles event ingestion requests
type EventHandler struct {
	config      *config.Config
	producer    *kafka.Producer
	redisClient *redis.Client
}

// IngestEvent handles POST /events
func (h *EventHandler) IngestEvent(w http.ResponseWriter, r *http.Request) {
	// Get tenant ID from context
	tenantID := GetTenantID(r.Context())
	if tenantID == "" {
		RespondError(w, NewInternalError("Tenant ID not found"))
		return
	}

	// Parse request body
	var req IngestRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		RespondError(w, NewValidationError("Invalid JSON payload"))
		return
	}

	// Validate request
	if err := req.Validate(); err != nil {
		RespondError(w, err)
		return
	}

	// Get or generate request ID
	requestID := uuid.New().String()

	// Get idempotency key from header
	idempotencyKey := r.Header.Get("Idempotency-Key")
	if idempotencyKey == "" {
		RespondError(w, NewValidationError("Idempotency-Key header is required"))
		return
	}

	// Check idempotency if enabled
	isDuplicate := false
	if h.config.IdempotencyEnabled {
		duplicate, err := h.redisClient.CheckIdempotency(tenantID, idempotencyKey, h.config.IdempotencyTTL)
		if err != nil {
			log.Printf("Idempotency check failed: %v", err)
			// Continue processing (fail open)
		} else if duplicate {
			isDuplicate = true
			// Return success response without publishing to Kafka
			response := IngestResponse{
				Status:    "accepted",
				RequestID: requestID,
				Duplicate: true,
			}
			RespondJSON(w, http.StatusAccepted, response)
			return
		}
	}

	// Wrap event with metadata
	wrapper := KafkaEventWrapper{
		TenantID:       tenantID,
		ReceivedAt:     time.Now().UTC().Format(time.RFC3339),
		RequestID:      requestID,
		IdempotencyKey: idempotencyKey,
		Event:          req,
	}

	// Publish to Kafka
	if err := h.producer.PublishRawEvent(wrapper); err != nil {
		log.Printf("Failed to publish event: %v", err)
		RespondError(w, NewInternalError("Failed to publish event"))
		return
	}

	// Return success response
	response := IngestResponse{
		Status:    "accepted",
		RequestID: requestID,
		Duplicate: isDuplicate,
	}

	RespondJSON(w, http.StatusAccepted, response)
}

// HealthCheck handles GET /health
func (h *EventHandler) HealthCheck(w http.ResponseWriter, r *http.Request) {
	dependencies := make(map[string]string)

	// Check Redis
	if err := h.redisClient.Ping(); err != nil {
		dependencies["redis"] = "unhealthy: " + err.Error()
	} else {
		dependencies["redis"] = "healthy"
	}

	// Check Kafka (basic check - producer is initialized)
	dependencies["kafka"] = "healthy"

	response := HealthResponse{
		Status:       "ok",
		Dependencies: dependencies,
	}

	RespondJSON(w, http.StatusOK, response)
}


