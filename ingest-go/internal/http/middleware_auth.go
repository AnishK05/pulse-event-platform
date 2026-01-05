package http

import (
	"context"
	"log"
	"net/http"

	"github.com/anishk05/pulse-event-platform/ingest-go/internal/config"
)

type contextKey string

const tenantIDKey contextKey = "tenant_id"

// authMiddleware validates the API key and attaches tenant_id to context
func authMiddleware(cfg *config.Config) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			apiKey := r.Header.Get("X-API-Key")
			if apiKey == "" {
				RespondError(w, NewUnauthorizedError("X-API-Key header is required"))
				return
			}

			tenantID, ok := cfg.APIKeys[apiKey]
			if !ok {
				RespondError(w, NewUnauthorizedError("Invalid API key"))
				return
			}

			// Attach tenant_id to context
			ctx := context.WithValue(r.Context(), tenantIDKey, tenantID)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// GetTenantID extracts tenant_id from context
func GetTenantID(ctx context.Context) string {
	if tenantID, ok := ctx.Value(tenantIDKey).(string); ok {
		return tenantID
	}
	return ""
}

// loggingMiddleware logs incoming requests
func loggingMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		log.Printf("%s %s from %s", r.Method, r.URL.Path, r.RemoteAddr)
		next.ServeHTTP(w, r)
	})
}


