package redis

import (
	"context"
	"fmt"

	"github.com/go-redis/redis/v8"
)

// Client wraps Redis client functionality
type Client struct {
	client *redis.Client
	ctx    context.Context
}

// NewClient creates a new Redis client
func NewClient(addr string) (*Client, error) {
	rdb := redis.NewClient(&redis.Options{
		Addr:     addr,
		Password: "", // no password for local dev
		DB:       0,  // default DB
	})

	ctx := context.Background()

	// Test connection
	if err := rdb.Ping(ctx).Err(); err != nil {
		return nil, fmt.Errorf("failed to connect to Redis: %w", err)
	}

	return &Client{
		client: rdb,
		ctx:    ctx,
	}, nil
}

// Ping checks if Redis is alive
func (c *Client) Ping() error {
	return c.client.Ping(c.ctx).Err()
}

// Close closes the Redis connection
func (c *Client) Close() error {
	if c.client != nil {
		return c.client.Close()
	}
	return nil
}

// GetClient returns the underlying Redis client for advanced operations
func (c *Client) GetClient() *redis.Client {
	return c.client
}

// GetContext returns the context
func (c *Client) GetContext() context.Context {
	return c.ctx
}


