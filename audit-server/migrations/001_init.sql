-- Audit Trail System - Full Schema Migration
-- Run: psql -d audit -f migrations/001_init.sql

CREATE SCHEMA IF NOT EXISTS audit;

-- ============================================================
-- Services
-- ============================================================
CREATE TABLE IF NOT EXISTS audit.services (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(120) NOT NULL,
    environment     VARCHAR(40) NOT NULL,
    description     TEXT,
    status          VARCHAR(20) NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active', 'disabled')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (name, environment)
);

-- ============================================================
-- Service Credentials
-- ============================================================
CREATE TABLE IF NOT EXISTS audit.service_credentials (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id      UUID NOT NULL REFERENCES audit.services(id),
    client_key      VARCHAR(160) NOT NULL UNIQUE,
    secret_encrypted TEXT NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active', 'revoked')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    revoked_at      TIMESTAMPTZ
);

-- ============================================================
-- Audit Events (partitioned by event_time)
-- ============================================================
CREATE TABLE IF NOT EXISTS audit.events (
    id              UUID NOT NULL,
    schema_version  VARCHAR(10) NOT NULL DEFAULT '1.0',

    service_id      UUID NOT NULL,
    service_name    VARCHAR(120) NOT NULL,
    environment     VARCHAR(40) NOT NULL,
    instance_id     VARCHAR(120),

    event_type      VARCHAR(40) NOT NULL
                    CHECK (event_type IN (
                        'http.request',
                        'domain.event',
                        'security.event',
                        'admin.action',
                        'system.event'
                    )),

    event_time      TIMESTAMPTZ NOT NULL,
    received_at     TIMESTAMPTZ NOT NULL DEFAULT now(),

    action          VARCHAR(160) NOT NULL,
    outcome         VARCHAR(20) NOT NULL
                    CHECK (outcome IN ('success', 'failure', 'denied')),

    actor_type      VARCHAR(40),
    actor_id        VARCHAR(120),
    actor_role      VARCHAR(80),

    resource_type   VARCHAR(120),
    resource_id     VARCHAR(160),
    resource_label  VARCHAR(255),

    trace_id        VARCHAR(80),
    request_id      VARCHAR(120),
    correlation_id  VARCHAR(120),
    span_id         VARCHAR(80),
    parent_span_id  VARCHAR(80),
    caller_service  VARCHAR(120),

    method          VARCHAR(10),
    path            TEXT,
    route           TEXT,
    query           JSONB,
    ip              INET,
    user_agent      TEXT,
    status_code     SMALLINT,
    duration_ms     INTEGER,

    payload         JSONB,
    metadata        JSONB,
    error           JSONB,

    idempotency_key VARCHAR(160),

    event_hash      VARCHAR(64),
    previous_hash   VARCHAR(64),

    PRIMARY KEY (id, event_time)
) PARTITION BY RANGE (event_time);

-- ============================================================
-- Trace Spans (partitioned by start_time)
-- ============================================================
CREATE TABLE IF NOT EXISTS audit.trace_spans (
    span_id         VARCHAR(80) NOT NULL,
    trace_id        VARCHAR(80) NOT NULL,
    parent_span_id  VARCHAR(80),

    service_id      UUID NOT NULL,
    service_name    VARCHAR(120) NOT NULL,
    environment     VARCHAR(40) NOT NULL,
    instance_id     VARCHAR(120),

    name            VARCHAR(255) NOT NULL,
    kind            VARCHAR(20) NOT NULL
                    CHECK (kind IN ('server', 'client', 'internal', 'producer', 'consumer')),

    start_time      TIMESTAMPTZ NOT NULL,
    end_time        TIMESTAMPTZ,
    duration_ms     INTEGER,

    status_code     SMALLINT,
    status          VARCHAR(20) DEFAULT 'ok'
                    CHECK (status IN ('ok', 'error')),

    caller_service  VARCHAR(120),
    target_service  VARCHAR(120),

    request_id      VARCHAR(120),
    correlation_id  VARCHAR(120),

    attributes      JSONB,
    error           JSONB,

    received_at     TIMESTAMPTZ NOT NULL DEFAULT now(),

    PRIMARY KEY (span_id, start_time)
) PARTITION BY RANGE (start_time);

-- ============================================================
-- Indexes: Events
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_audit_events_time ON audit.events (event_time DESC);
CREATE INDEX IF NOT EXISTS idx_audit_events_service ON audit.events (service_name, event_time DESC);
CREATE INDEX IF NOT EXISTS idx_audit_events_actor ON audit.events (actor_id, event_time DESC);
CREATE INDEX IF NOT EXISTS idx_audit_events_resource ON audit.events (resource_type, resource_id, event_time DESC);
CREATE INDEX IF NOT EXISTS idx_audit_events_trace ON audit.events (trace_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_request ON audit.events (request_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_correlation ON audit.events (correlation_id);

-- ============================================================
-- Indexes: Trace Spans
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_trace_spans_trace ON audit.trace_spans (trace_id, start_time);
CREATE INDEX IF NOT EXISTS idx_trace_spans_parent ON audit.trace_spans (parent_span_id);
CREATE INDEX IF NOT EXISTS idx_trace_spans_service ON audit.trace_spans (service_name, start_time DESC);
CREATE INDEX IF NOT EXISTS idx_trace_spans_request ON audit.trace_spans (request_id);

-- ============================================================
-- Monthly Partitions (current + 3 months ahead)
-- ============================================================
DO $$
DECLARE
    start_date DATE;
    end_date DATE;
    partition_name TEXT;
    span_partition_name TEXT;
    i INTEGER;
BEGIN
    FOR i IN 0..3 LOOP
        start_date := DATE_TRUNC('month', CURRENT_DATE + (i || ' months')::INTERVAL);
        end_date := start_date + INTERVAL '1 month';
        partition_name := 'events_' || TO_CHAR(start_date, 'YYYY_MM');
        span_partition_name := 'trace_spans_' || TO_CHAR(start_date, 'YYYY_MM');

        IF NOT EXISTS (
            SELECT 1 FROM pg_tables
            WHERE schemaname = 'audit' AND tablename = partition_name
        ) THEN
            EXECUTE format(
                'CREATE TABLE audit.%I PARTITION OF audit.events FOR VALUES FROM (%L) TO (%L)',
                partition_name, start_date, end_date
            );
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM pg_tables
            WHERE schemaname = 'audit' AND tablename = span_partition_name
        ) THEN
            EXECUTE format(
                'CREATE TABLE audit.%I PARTITION OF audit.trace_spans FOR VALUES FROM (%L) TO (%L)',
                span_partition_name, start_date, end_date
            );
        END IF;
    END LOOP;
END $$;

-- ============================================================
-- Partition creation function
-- ============================================================
CREATE OR REPLACE FUNCTION audit.create_partitions(months_ahead INTEGER DEFAULT 3)
RETURNS void AS $$
DECLARE
    start_date DATE;
    end_date DATE;
    partition_name TEXT;
    span_partition_name TEXT;
BEGIN
    FOR i IN 0..months_ahead LOOP
        start_date := DATE_TRUNC('month', CURRENT_DATE + (i || ' months')::INTERVAL);
        end_date := start_date + INTERVAL '1 month';
        partition_name := 'events_' || TO_CHAR(start_date, 'YYYY_MM');
        span_partition_name := 'trace_spans_' || TO_CHAR(start_date, 'YYYY_MM');

        IF NOT EXISTS (
            SELECT 1 FROM pg_tables
            WHERE schemaname = 'audit' AND tablename = partition_name
        ) THEN
            EXECUTE format(
                'CREATE TABLE audit.%I PARTITION OF audit.events FOR VALUES FROM (%L) TO (%L)',
                partition_name, start_date, end_date
            );
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM pg_tables
            WHERE schemaname = 'audit' AND tablename = span_partition_name
        ) THEN
            EXECUTE format(
                'CREATE TABLE audit.%I PARTITION OF audit.trace_spans FOR VALUES FROM (%L) TO (%L)',
                span_partition_name, start_date, end_date
            );
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- Immutability Triggers
-- ============================================================
CREATE OR REPLACE FUNCTION audit.prevent_modification()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Audit records are immutable';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS audit_events_immutable ON audit.events;
CREATE TRIGGER audit_events_immutable
    BEFORE UPDATE OR DELETE ON audit.events
    FOR EACH ROW EXECUTE FUNCTION audit.prevent_modification();

DROP TRIGGER IF EXISTS audit_spans_immutable ON audit.trace_spans;
CREATE TRIGGER audit_spans_immutable
    BEFORE UPDATE OR DELETE ON audit.trace_spans
    FOR EACH ROW EXECUTE FUNCTION audit.prevent_modification();

-- ============================================================
-- Database Roles
-- ============================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'audit_writer') THEN
        CREATE ROLE audit_writer WITH LOGIN PASSWORD 'audit_writer_password';
    END IF;
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'audit_reader') THEN
        CREATE ROLE audit_reader WITH LOGIN PASSWORD 'audit_reader_password';
    END IF;
END $$;

GRANT USAGE ON SCHEMA audit TO audit_writer;
GRANT INSERT ON ALL TABLES IN SCHEMA audit TO audit_writer;

GRANT USAGE ON SCHEMA audit TO audit_reader;
GRANT SELECT ON ALL TABLES IN SCHEMA audit TO audit_reader;

REVOKE UPDATE, DELETE, TRUNCATE ON ALL TABLES IN SCHEMA audit FROM PUBLIC;
