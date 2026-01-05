package redis

import (
	"fmt"
	"time"
)

// CheckRateLimit checks if a tenant has exceeded their rate limit
// Returns true if request is allowed, false if rate limited
func (c *Client) CheckRateLimit(tenantID string, limitPerMin int) (bool, error) {
	// Create rate limit key with current minute bucket
	minuteBucket := time.Now().UTC().Format("2006-01-02T15:04")
	key := fmt.Sprintf("rl:%s:%s", tenantID, minuteBucket)

	// Increment counter
	count, err := c.client.Incr(c.ctx, key).Result()
	if err != nil {
		return false, fmt.Errorf("failed to increment rate limit counter: %w", err)
	}

	// Set expiration on first increment (when count == 1)
	if count == 1 {
		if err := c.client.Expire(c.ctx, key, 60*time.Second).Err(); err != nil {
			return false, fmt.Errorf("failed to set expiration: %w", err)
		}
	}

	// Check if limit exceeded
	if count > int64(limitPerMin) {
		return false, nil
	}

	return true, nil
}


