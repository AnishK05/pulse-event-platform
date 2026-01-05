package config

import (
	"fmt"
	"strings"
)

type Config struct {
	Port               string
	RedisAddr          string
	KafkaBrokers       []string
	RateLimitPerMin    int
	IdempotencyTTL     int
	APIKeys            map[string]string // api_key -> tenant_id
	RateLimitEnabled   bool
	IdempotencyEnabled bool
}

func Load() (*Config, error) {
	cfg := &Config{
		Port:               "8080",
		RedisAddr:          "localhost:6379",
		KafkaBrokers:       []string{"localhost:9092"},
		RateLimitPerMin:    300,
		IdempotencyTTL:     1800,
		RateLimitEnabled:   true,
		IdempotencyEnabled: true,
		APIKeys:            make(map[string]string),
	}

	// Hardcoded API keys
	apiKeysStr := "tenant_a:key_a,tenant_b:key_b"

	pairs := strings.Split(apiKeysStr, ",")
	for _, pair := range pairs {
		parts := strings.SplitN(strings.TrimSpace(pair), ":", 2)
		if len(parts) != 2 {
			continue
		}
		tenantID := strings.TrimSpace(parts[0])
		apiKey := strings.TrimSpace(parts[1])
		cfg.APIKeys[apiKey] = tenantID
	}

	if len(cfg.APIKeys) == 0 {
		return nil, fmt.Errorf("no API keys configured")
	}

	return cfg, nil
}

