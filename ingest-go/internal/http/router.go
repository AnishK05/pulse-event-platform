package http

import (
	"github.com/anishk05/pulse-event-platform/ingest-go/internal/config"
	"github.com/anishk05/pulse-event-platform/ingest-go/internal/kafka"
	"github.com/anishk05/pulse-event-platform/ingest-go/internal/redis"
	"github.com/gorilla/mux"
)

// NewRouter creates and configures the HTTP router
func NewRouter(cfg *config.Config, producer *kafka.Producer, redisClient *redis.Client) *mux.Router {
	router := mux.NewRouter()

	// Create handler with dependencies
	handler := &EventHandler{
		config:      cfg,
		producer:    producer,
		redisClient: redisClient,
	}

	// Apply middleware chain
	router.Use(loggingMiddleware)

	// Health endpoint (no auth required)
	router.HandleFunc("/health", handler.HealthCheck).Methods("GET")

	// Events endpoint with auth middleware
	eventsRouter := router.PathPrefix("/events").Subrouter()
	eventsRouter.Use(authMiddleware(cfg))

	// Conditionally add rate limiting middleware
	if cfg.RateLimitEnabled {
		eventsRouter.Use(rateLimitMiddleware(redisClient, cfg))
	}

	eventsRouter.HandleFunc("", handler.IngestEvent).Methods("POST")

	return router
}


