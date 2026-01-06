-- Create events table
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY,
    tenant_id VARCHAR(255) NOT NULL,
    event_id VARCHAR(255) NOT NULL,
    idempotency_key VARCHAR(255) NOT NULL,
    event_type VARCHAR(255) NOT NULL,
    schema_version INTEGER NOT NULL,
    occurred_at TIMESTAMP NOT NULL,
    received_at TIMESTAMP NOT NULL,
    processed_at TIMESTAMP NOT NULL,
    payload JSONB NOT NULL,
    status VARCHAR(50) NOT NULL
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_tenant_event ON events(tenant_id, event_id);
CREATE INDEX IF NOT EXISTS idx_tenant_idem ON events(tenant_id, idempotency_key);
CREATE INDEX IF NOT EXISTS idx_type_occurred ON events(event_type, occurred_at);
CREATE INDEX IF NOT EXISTS idx_processed_at ON events(processed_at DESC);

-- Optional: Create a table for DLQ events if we want to persist them
CREATE TABLE IF NOT EXISTS dlq_events (
    id UUID PRIMARY KEY,
    failed_at TIMESTAMP NOT NULL,
    reason TEXT NOT NULL,
    original_message TEXT NOT NULL,
    tenant_id VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_dlq_failed_at ON dlq_events(failed_at DESC);



