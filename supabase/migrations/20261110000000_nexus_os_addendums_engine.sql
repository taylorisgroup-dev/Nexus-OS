-- ==============================================================================
-- NEXUS OS — MIGRATION EXTENSION : 3 ADDENDUMS (WORKFLOW ENGINE, CALL DESK, FIELD)
-- Version : 1.0 (10 novembre 2026)
-- Projet : NEXUS OS
-- Entreprise : NEXUS Premium Solutions
-- ADN : "THINK HUMAN, EXECUTE AI, EVOLVE HYBRID."
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 2. ADDENDUM 1 : NEXUS WORKFLOW ENGINE (MOTEUR D'AUTOMATISATION INTERNE)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS workflow_definitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL DEFAULT 'prospection' CHECK (category IN ('acquisition', 'prospection', 'qualification', 'suivi_commercial', 'reporting', 'systeme')),
    trigger_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'archived')),
    version INTEGER NOT NULL DEFAULT 1,
    is_template BOOLEAN NOT NULL DEFAULT false,
    settings JSONB NOT NULL DEFAULT '{"max_concurrency": 5, "retry_limit": 3, "timeout_seconds": 60}'::jsonb,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS workflow_nodes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id UUID NOT NULL REFERENCES workflow_definitions(id) ON DELETE CASCADE,
    block_type TEXT NOT NULL, -- trigger_sirene, action_create_task, action_send_email, condition_branch, etc.
    label TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('trigger', 'acquisition', 'qualification', 'call_desk', 'field', 'crm', 'outlook', 'logic', 'notification')),
    position_x DOUBLE PRECISION NOT NULL DEFAULT 0,
    position_y DOUBLE PRECISION NOT NULL DEFAULT 0,
    config JSONB NOT NULL DEFAULT '{}'::jsonb,
    inputs JSONB NOT NULL DEFAULT '[]'::jsonb,
    outputs JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS workflow_edges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id UUID NOT NULL REFERENCES workflow_definitions(id) ON DELETE CASCADE,
    source_node_id UUID NOT NULL REFERENCES workflow_nodes(id) ON DELETE CASCADE,
    target_node_id UUID NOT NULL REFERENCES workflow_nodes(id) ON DELETE CASCADE,
    source_handle TEXT,
    target_handle TEXT,
    condition_expr TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS workflow_executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id UUID NOT NULL REFERENCES workflow_definitions(id) ON DELETE CASCADE,
    trigger_event TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'paused', 'cancelled')),
    trigger_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    execution_context JSONB NOT NULL DEFAULT '{}'::jsonb,
    started_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    completed_at TIMESTAMPTZ,
    duration_ms INTEGER,
    error_message TEXT,
    triggered_by UUID REFERENCES profiles(id)
);

CREATE TABLE IF NOT EXISTS workflow_execution_steps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    execution_id UUID NOT NULL REFERENCES workflow_executions(id) ON DELETE CASCADE,
    node_id UUID NOT NULL REFERENCES workflow_nodes(id) ON DELETE CASCADE,
    block_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'success', 'failed', 'skipped')),
    input_data JSONB,
    output_data JSONB,
    error_log TEXT,
    retry_attempt INTEGER NOT NULL DEFAULT 0,
    started_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    completed_at TIMESTAMPTZ,
    duration_ms INTEGER
);

CREATE TABLE IF NOT EXISTS workflow_queue_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id UUID NOT NULL REFERENCES workflow_definitions(id) ON DELETE CASCADE,
    node_id UUID REFERENCES workflow_nodes(id) ON DELETE SET NULL,
    execution_id UUID REFERENCES workflow_executions(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'completed', 'failed', 'dead_letter')),
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    run_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    retry_count INTEGER NOT NULL DEFAULT 0,
    max_retries INTEGER NOT NULL DEFAULT 3,
    idempotency_key TEXT UNIQUE,
    error_detail TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_workflow_executions_wf ON workflow_executions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_queue_status_run ON workflow_queue_jobs(status, run_at);
CREATE INDEX IF NOT EXISTS idx_workflow_queue_idempotency ON workflow_queue_jobs(idempotency_key);

-- ==============================================================================
-- 3. ADDENDUM 2 : SESSIONS CALL DESK & ATTRIBUTION COMMERCIALE
-- ==============================================================================

CREATE TABLE IF NOT EXISTS call_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
    started_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    ended_at TIMESTAMPTZ,
    duration_seconds INTEGER DEFAULT 0,
    total_calls INTEGER DEFAULT 0,
    connected_calls INTEGER DEFAULT 0,
    appointments_booked INTEGER DEFAULT 0,
    followups_scheduled INTEGER DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS prospect_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prospect_id UUID NOT NULL REFERENCES prospects(id) ON DELETE CASCADE,
    assigned_to UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES profiles(id),
    status TEXT NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned', 'in_progress', 'transferred', 'unassigned')),
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_call_sessions_user ON call_sessions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_prospect_assignments ON prospect_assignments(prospect_id, assigned_to);

-- ==============================================================================
-- 4. ADDENDUM 3 : SESSIONS TERRAIN (NEXUS FIELD) & SYNCHRONISATION HORS LIGNE
-- ==============================================================================

CREATE TABLE IF NOT EXISTS field_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    route_id UUID REFERENCES field_routes(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'ready', 'in_progress', 'suspended', 'completed', 'cancelled')),
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    total_visits INTEGER DEFAULT 0,
    visited_count INTEGER DEFAULT 0,
    appointments_booked INTEGER DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS offline_sync_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id),
    entity_type TEXT NOT NULL CHECK (entity_type IN ('field_visit', 'call_interaction', 'prospect_update', 'task_completion', 'appointment_creation')),
    entity_id TEXT NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('CREATE', 'UPDATE', 'DELETE')),
    payload JSONB NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'synced', 'conflict', 'failed')),
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    synced_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_offline_sync_status ON offline_sync_queue(status, user_id);

-- ==============================================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE workflow_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_execution_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_queue_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE prospect_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE field_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE offline_sync_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workflows readable by authenticated" ON workflow_definitions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Workflows editable by authenticated" ON workflow_definitions FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Workflow nodes editable by authenticated" ON workflow_nodes FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Workflow edges editable by authenticated" ON workflow_edges FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Workflow executions editable by authenticated" ON workflow_executions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Workflow steps editable by authenticated" ON workflow_execution_steps FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Workflow queue jobs editable by authenticated" ON workflow_queue_jobs FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Call sessions editable by authenticated" ON call_sessions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Prospect assignments editable by authenticated" ON prospect_assignments FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Field sessions editable by authenticated" ON field_sessions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Offline sync queue editable by authenticated" ON offline_sync_queue FOR ALL TO authenticated USING (true) WITH CHECK (true);
