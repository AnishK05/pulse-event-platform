package http

import (
	"fmt"
	"net/http"
	"time"

	"github.com/anishk05/pulse-event-platform/ingest-go/internal/config"
	"github.com/anishk05/pulse-event-platform/ingest-go/internal/redis"
)

// rateLimitMiddleware enforces per-tenant rate limiting
func rateLimitMiddleware(redisClient *redis.Client, cfg *config.Config) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			tenantID := GetTenantID(r.Context())
			if tenantID == "" {
				RespondError(w, NewInternalError("Tenant ID not found in context"))
				return
			}

			// Check rate limit
			allowed, err := redisClient.CheckRateLimit(tenantID, cfg.RateLimitPerMin)
			if err != nil {
				// Log error but allow request (fail open)
				fmt.Printf("Rate limit check failed: %v\n", err)
				next.ServeHTTP(w, r)
				return
			}

			if !allowed {
				RespondError(w, NewRateLimitError(fmt.Sprintf("Rate limit exceeded: %d requests per minute", cfg.RateLimitPerMin)))
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}

// GetMinuteBucket returns the current minute bucket for rate limiting
func GetMinuteBucket() string {
	return time.Now().UTC().Format("2006-01-02T15:04")
}


