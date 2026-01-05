package redis

import (
	"fmt"
	"time"
)

// CheckIdempotency checks if an event with the given idempotency key has been seen before
// Returns true if duplicate, false if new
func (c *Client) CheckIdempotency(tenantID, idempotencyKey string, ttlSeconds int) (bool, error) {
	key := fmt.Sprintf("idem:%s:%s", tenantID, idempotencyKey)

	// Try to set the key if it doesn't exist
	success, err := c.client.SetNX(c.ctx, key, "1", time.Duration(ttlSeconds)*time.Second).Result()
	if err != nil {
		return false, fmt.Errorf("failed to check idempotency: %w", err)
	}

	// If SetNX returns false, key already exists (duplicate)
	return !success, nil
}


