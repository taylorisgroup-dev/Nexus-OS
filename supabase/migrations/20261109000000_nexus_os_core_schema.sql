-- ==============================================================================
-- NEXUS OS — RECONSTRUCTION MAJEURE DU SCHÉMA RELATIONNEL POSTGRESQL (SUPABASE)
-- Version : 1.0 (9 novembre 2026)
-- Projet : NEXUS OS
-- Entreprise : NEXUS Premium Solutions
-- ADN : "THINK HUMAN, EXECUTE AI, EVOLVE HYBRID."
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. UTILISATEURS & GOUVERNANCE
-- ==============================================================================

CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'agent' CHECK (role IN ('owner', 'manager', 'agent')),
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_by UUID REFERENCES profiles(id),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 3. RÉFÉRENTIELS DES ACTIVITÉS & NOMENCLATURES (NAF/APE & ROME)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS activity_domains (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT NOT NULL UNIQUE,
    label TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS activity_sectors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    domain_id UUID NOT NULL REFERENCES activity_domains(id) ON DELETE CASCADE,
    code TEXT NOT NULL UNIQUE,
    label TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS activity_professions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sector_id UUID NOT NULL REFERENCES activity_sectors(id) ON DELETE CASCADE,
    naf_code TEXT NOT NULL,
    label TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS activity_sub_professions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profession_id UUID NOT NULL REFERENCES activity_professions(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    keywords TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Index pour recherche rapide d'activités
CREATE INDEX IF NOT EXISTS idx_professions_naf ON activity_professions(naf_code);
CREATE INDEX IF NOT EXISTS idx_professions_label ON activity_professions USING gin(to_tsvector('french', label));

-- ==============================================================================
-- 4. ACQUISITION & GESTION DES DONNÉES BRUTES (NEXUS DATA)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS collection_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    source_type TEXT NOT NULL CHECK (source_type IN ('sirene_insee', 'google_places', 'osm_overpass', 'web_audit', 'manual_import')),
    base_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS collection_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    source_id UUID REFERENCES collection_sources(id),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'paused', 'completed', 'partial', 'error', 'cancelled')),
    target_sector TEXT NOT NULL,
    target_location TEXT NOT NULL,
    target_count INTEGER NOT NULL DEFAULT 10,
    found_count INTEGER NOT NULL DEFAULT 0,
    verified_count INTEGER NOT NULL DEFAULT 0,
    duplicates_count INTEGER NOT NULL DEFAULT 0,
    errors_count INTEGER NOT NULL DEFAULT 0,
    search_criteria JSONB NOT NULL DEFAULT '{}'::jsonb,
    error_message TEXT,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS data_leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID REFERENCES collection_jobs(id) ON DELETE SET NULL,
    company_name TEXT NOT NULL,
    legal_name TEXT,
    siren TEXT,
    siret TEXT,
    naf_code TEXT,
    sector TEXT,
    profession TEXT,
    phone TEXT,
    email TEXT,
    website TEXT,
    address_street TEXT,
    postal_code TEXT,
    city TEXT NOT NULL,
    department TEXT,
    region TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    maps_url TEXT,
    legal_directors JSONB DEFAULT '[]'::jsonb, -- Décideurs vérifiés au RCS
    verification_status TEXT NOT NULL DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'verified_sirene', 'verified_maps', 'verified_web', 'doubtful')),
    confidence_score DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    provenance_source TEXT NOT NULL,
    last_verified_at TIMESTAMPTZ,
    is_imported_to_crm BOOLEAN NOT NULL DEFAULT false,
    crm_company_id UUID,
    raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_data_leads_siren ON data_leads(siren);
CREATE INDEX IF NOT EXISTS idx_data_leads_city ON data_leads(city);
CREATE INDEX IF NOT EXISTS idx_data_leads_phone ON data_leads(phone);
CREATE INDEX IF NOT EXISTS idx_data_leads_imported ON data_leads(is_imported_to_crm);

-- ==============================================================================
-- 5. CRM CENTRAL — ENTREPRISES, CONTACTS & PROSPECTS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    commercial_name TEXT NOT NULL,
    legal_name TEXT,
    siren TEXT UNIQUE,
    siret TEXT,
    naf_code TEXT,
    sector TEXT,
    website TEXT,
    standard_phone TEXT,
    general_email TEXT,
    address_street TEXT,
    postal_code TEXT,
    city TEXT NOT NULL,
    department TEXT,
    region TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    google_maps_url TEXT,
    source_origin TEXT NOT NULL DEFAULT 'NEXUS DATA',
    lead_source_id UUID REFERENCES data_leads(id),
    digital_maturity TEXT CHECK (digital_maturity IN ('Faible', 'Moyenne', 'Avancée', 'Non évaluée')),
    notes TEXT,
    is_archived BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    role_title TEXT NOT NULL DEFAULT 'Direction',
    direct_phone TEXT,
    mobile_phone TEXT,
    email TEXT,
    is_decision_maker BOOLEAN NOT NULL DEFAULT true,
    is_primary BOOLEAN NOT NULL DEFAULT false,
    preferred_contact_channel TEXT DEFAULT 'phone' CHECK (preferred_contact_channel IN ('phone', 'email', 'field', 'linkedin')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS prospects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    primary_contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'nouveau' CHECK (status IN (
        'nouveau',
        'a_qualifier',
        'premier_contact',
        'interet_identifie',
        'rdv_a_programmer',
        'rdv_programme',
        'proposition_en_cours',
        'proposition_envoyee',
        'negociation',
        'gagne',
        'perdu',
        'a_recontacter',
        'ne_plus_contacter'
    )),
    priority TEXT NOT NULL DEFAULT 'moyenne' CHECK (priority IN ('basse', 'moyenne', 'haute', 'urgente')),
    assigned_to UUID REFERENCES profiles(id),
    active_campaign_id UUID, -- Défini ci-dessous
    estimated_budget NUMERIC(12, 2),
    needs_summary TEXT,
    nexus_offer_match TEXT,
    next_action_date DATE,
    next_action_type TEXT,
    is_archived BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prospect_id UUID NOT NULL REFERENCES prospects(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
    channel TEXT NOT NULL CHECK (channel IN ('phone', 'field', 'email', 'meeting', 'note')),
    result TEXT NOT NULL,
    summary TEXT NOT NULL,
    notes TEXT,
    duration_minutes INTEGER,
    performed_by UUID REFERENCES profiles(id),
    performed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_prospects_status ON prospects(status);
CREATE INDEX IF NOT EXISTS idx_prospects_company ON prospects(company_id);
CREATE INDEX IF NOT EXISTS idx_interactions_prospect ON interactions(prospect_id);
CREATE INDEX IF NOT EXISTS idx_interactions_date ON interactions(performed_at DESC);

-- ==============================================================================
-- 6. CAMPAGNES COMMERCIALES & RESSOURCES DE PROSPECTION
-- ==============================================================================

CREATE TABLE IF NOT EXISTS scripts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    target_sector TEXT,
    branch_name TEXT NOT NULL DEFAULT 'NEXUS Premium Solutions',
    steps JSONB NOT NULL DEFAULT '[]'::jsonb, -- Étapes d'entretien
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS objections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category TEXT NOT NULL, -- Prix, Pas de temps, Concurrence, Barrage secrétaire, etc.
    title TEXT NOT NULL,
    rebuttal TEXT NOT NULL,
    counter_questions TEXT[] DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    objective TEXT NOT NULL,
    channel TEXT NOT NULL DEFAULT 'phone' CHECK (channel IN ('phone', 'field', 'email', 'hybrid')),
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'archived')),
    target_sector TEXT,
    target_location TEXT,
    target_count INTEGER NOT NULL DEFAULT 50,
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE,
    script_id UUID REFERENCES scripts(id) ON DELETE SET NULL,
    branch_name TEXT NOT NULL DEFAULT 'NEXUS Digital & Phoning',
    priority TEXT NOT NULL DEFAULT 'moyenne',
    notes TEXT,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE prospects ADD CONSTRAINT fk_prospects_campaign FOREIGN KEY (active_campaign_id) REFERENCES campaigns(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS campaign_prospects (
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    prospect_id UUID NOT NULL REFERENCES prospects(id) ON DELETE CASCADE,
    queue_order INTEGER NOT NULL DEFAULT 0,
    call_attempts INTEGER NOT NULL DEFAULT 0,
    last_call_at TIMESTAMPTZ,
    last_call_result TEXT,
    is_completed BOOLEAN NOT NULL DEFAULT false,
    added_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    PRIMARY KEY (campaign_id, prospect_id)
);

-- ==============================================================================
-- 7. PROSPECTION TERRAIN (TOURNÉES, VISITES & CARTOGRAPHIE)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS field_routes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    assigned_to UUID REFERENCES profiles(id),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'cancelled')),
    start_address TEXT,
    total_distance_km DOUBLE PRECISION DEFAULT 0.0,
    estimated_duration_minutes INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS field_visits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    route_id UUID REFERENCES field_routes(id) ON DELETE CASCADE,
    prospect_id UUID NOT NULL REFERENCES prospects(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    visit_order INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'a_visiter' CHECK (status IN ('a_visiter', 'visite_effectuee', 'absent', 'ferme', 'refus', 'rdv_obtenu', 'a_revisiter')),
    report_notes TEXT,
    gps_lat DOUBLE PRECISION,
    gps_lng DOUBLE PRECISION,
    visited_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 8. PLANIFICATION COMMERCIALE, TÂCHES & RENDEZ-VOUS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prospect_id UUID REFERENCES prospects(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    due_date DATE NOT NULL,
    due_time TIME,
    priority TEXT NOT NULL DEFAULT 'moyenne' CHECK (priority IN ('basse', 'moyenne', 'haute', 'urgente')),
    status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done', 'cancelled')),
    task_type TEXT NOT NULL DEFAULT 'relance_tel' CHECK (task_type IN ('relance_tel', 'visite_terrain', 'email', 'devis', 'cadrage', 'autre')),
    assigned_to UUID REFERENCES profiles(id),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prospect_id UUID NOT NULL REFERENCES prospects(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    location_type TEXT NOT NULL DEFAULT 'visio' CHECK (location_type IN ('visio', 'telephone', 'sur_place')),
    physical_address TEXT,
    meeting_link TEXT,
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'rescheduled', 'no_show')),
    outlook_event_id TEXT,
    outlook_sync_status TEXT DEFAULT 'pending' CHECK (outlook_sync_status IN ('pending', 'synced', 'error')),
    assigned_to UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_tasks_due ON tasks(due_date, status);
CREATE INDEX IF NOT EXISTS idx_appointments_start ON appointments(start_time);

-- ==============================================================================
-- 9. INTÉGRATION MICROSOFT OUTLOOK & EMAIL COMMERCIAL
-- ==============================================================================

CREATE TABLE IF NOT EXISTS microsoft_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    access_token_encrypted TEXT NOT NULL,
    refresh_token_encrypted TEXT NOT NULL,
    token_expires_at TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_synced_at TIMESTAMPTZ,
    sync_errors TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS email_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    subject TEXT NOT NULL,
    body_html TEXT NOT NULL,
    body_text TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'prospection',
    branch_name TEXT NOT NULL DEFAULT 'NEXUS Digital',
    variables_used TEXT[] DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS email_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prospect_id UUID REFERENCES prospects(id) ON DELETE SET NULL,
    company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
    outlook_message_id TEXT UNIQUE,
    direction TEXT NOT NULL CHECK (direction IN ('outbound', 'inbound')),
    sender_email TEXT NOT NULL,
    recipient_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    body_preview TEXT,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 10. AUTOMATISATIONS, LOGS & AUDIT TRAIL IMMUABLE
-- ==============================================================================

CREATE TABLE IF NOT EXISTS automation_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    trigger_type TEXT NOT NULL CHECK (trigger_type IN ('task_overdue', 'prospect_won', 'call_completed', 'cron_daily', 'cron_weekly')),
    action_type TEXT NOT NULL CHECK (action_type IN ('create_task', 'send_alert', 'schedule_followup', 'generate_report')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    execution_count INTEGER NOT NULL DEFAULT 0,
    last_run_at TIMESTAMPTZ,
    last_result TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS automation_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rule_id UUID REFERENCES automation_rules(id) ON DELETE SET NULL,
    rule_name TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('succes', 'avertissement', 'erreur', 'simule')),
    summary TEXT NOT NULL,
    details TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id),
    entity_name TEXT NOT NULL,
    entity_id UUID NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('CREATE', 'UPDATE', 'DELETE', 'EXPORT', 'IMPORT')),
    old_data JSONB,
    new_data JSONB,
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 11. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_sectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_professions ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_sub_professions ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE prospects ENABLE ROW LEVEL SECURITY;
ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE scripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE objections ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_prospects ENABLE ROW LEVEL SECURITY;
ALTER TABLE field_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE field_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE microsoft_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Politiques de lecture / écriture : Tout membre authentifié de NEXUS OS a accès aux données opérationnelles
CREATE POLICY "Profiles are readable by authenticated users" ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Profiles updateable by user themselves" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "Operational data access for authenticated users" ON companies FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Contacts access for authenticated users" ON contacts FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Prospects access for authenticated users" ON prospects FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Interactions access for authenticated users" ON interactions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Campaigns access for authenticated users" ON campaigns FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Campaign prospects access for authenticated users" ON campaign_prospects FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Tasks access for authenticated users" ON tasks FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Appointments access for authenticated users" ON appointments FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Data leads access for authenticated users" ON data_leads FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Collection jobs access for authenticated users" ON collection_jobs FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Scripts access for authenticated users" ON scripts FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Objections access for authenticated users" ON objections FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Field routes access for authenticated users" ON field_routes FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Field visits access for authenticated users" ON field_visits FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Email templates access for authenticated users" ON email_templates FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Email messages access for authenticated users" ON email_messages FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Automation rules access for authenticated users" ON automation_rules FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Automation logs access for authenticated users" ON automation_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Audit logs access for authenticated users" ON audit_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Audit logs insert by authenticated users" ON audit_logs FOR INSERT TO authenticated WITH CHECK (true);

-- Microsoft accounts : L'utilisateur ne voit que son propre compte connecté
CREATE POLICY "Microsoft accounts access restricted to owner" ON microsoft_accounts FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Référentiels publics en lecture
CREATE POLICY "Referential readable by all authenticated" ON activity_domains FOR SELECT TO authenticated USING (true);
CREATE POLICY "Activity sectors readable by all authenticated" ON activity_sectors FOR SELECT TO authenticated USING (true);
CREATE POLICY "Professions readable by all authenticated" ON activity_professions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Sub-professions readable by all authenticated" ON activity_sub_professions FOR SELECT TO authenticated USING (true);
