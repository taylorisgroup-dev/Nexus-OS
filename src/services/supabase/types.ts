/**
-- NEXUS OS — Types TypeScript du schéma de données Supabase PostgreSQL
-- Version : 1.0 (9 novembre 2026)
*/

export type UserRole = 'owner' | 'manager' | 'agent';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface ActivityDomain {
  id: string;
  code: string;
  label: string;
  created_at: string;
}

export interface ActivitySector {
  id: string;
  domain_id: string;
  code: string;
  label: string;
  created_at: string;
}

export interface ActivityProfession {
  id: string;
  sector_id: string;
  naf_code: string;
  label: string;
  description?: string;
  created_at: string;
}

export interface ActivitySubProfession {
  id: string;
  profession_id: string;
  label: string;
  keywords: string[];
  created_at: string;
}

export interface CollectionSource {
  id: string;
  name: string;
  source_type: 'sirene_insee' | 'google_places' | 'osm_overpass' | 'web_audit' | 'manual_import';
  base_url?: string;
  is_active: boolean;
  created_at: string;
}

export interface CollectionJob {
  id: string;
  name: string;
  source_id?: string;
  status: 'pending' | 'running' | 'paused' | 'completed' | 'partial' | 'error' | 'cancelled';
  target_sector: string;
  target_location: string;
  target_count: number;
  found_count: number;
  verified_count: number;
  duplicates_count: number;
  errors_count: number;
  search_criteria: Record<string, unknown>;
  error_message?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface DataLead {
  id: string;
  job_id?: string;
  company_name: string;
  legal_name?: string;
  siren?: string;
  siret?: string;
  naf_code?: string;
  sector?: string;
  profession?: string;
  phone?: string;
  email?: string;
  website?: string;
  address_street?: string;
  postal_code?: string;
  city: string;
  department?: string;
  region?: string;
  latitude?: number;
  longitude?: number;
  maps_url?: string;
  legal_directors?: { name: string; role: string }[];
  verification_status: 'unverified' | 'verified_sirene' | 'verified_maps' | 'verified_web' | 'doubtful';
  confidence_score: number;
  provenance_source: string;
  last_verified_at?: string;
  is_imported_to_crm: boolean;
  crm_company_id?: string;
  raw_payload?: Record<string, unknown>;
  created_at: string;
}

export interface Company {
  id: string;
  commercial_name: string;
  legal_name?: string;
  siren?: string;
  siret?: string;
  naf_code?: string;
  sector?: string;
  website?: string;
  standard_phone?: string;
  general_email?: string;
  address_street?: string;
  postal_code?: string;
  city: string;
  department?: string;
  region?: string;
  latitude?: number;
  longitude?: number;
  google_maps_url?: string;
  source_origin: string;
  lead_source_id?: string;
  digital_maturity?: 'Faible' | 'Moyenne' | 'Avancée' | 'Non évaluée';
  notes?: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface Contact {
  id: string;
  company_id: string;
  first_name: string;
  last_name: string;
  role_title: string;
  direct_phone?: string;
  mobile_phone?: string;
  email?: string;
  is_decision_maker: boolean;
  is_primary: boolean;
  preferred_contact_channel: 'phone' | 'email' | 'field' | 'linkedin';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export type ProspectCommercialStatus =
  | 'nouveau'
  | 'a_qualifier'
  | 'premier_contact'
  | 'interet_identifie'
  | 'rdv_a_programmer'
  | 'rdv_programme'
  | 'proposition_en_cours'
  | 'proposition_envoyee'
  | 'negociation'
  | 'gagne'
  | 'perdu'
  | 'a_recontacter'
  | 'ne_plus_contacter';

export type PriorityLevel = 'basse' | 'moyenne' | 'haute' | 'urgente';

export interface ProspectRecord {
  id: string;
  company_id: string;
  primary_contact_id?: string;
  status: ProspectCommercialStatus;
  priority: PriorityLevel;
  assigned_to?: string;
  active_campaign_id?: string;
  estimated_budget?: number;
  needs_summary?: string;
  nexus_offer_match?: string;
  next_action_date?: string;
  next_action_type?: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;

  // Joined fields for display
  company?: Company;
  primary_contact?: Contact;
  active_campaign?: Campaign;
}

export interface InteractionRecord {
  id: string;
  prospect_id: string;
  company_id: string;
  contact_id?: string;
  channel: 'phone' | 'field' | 'email' | 'meeting' | 'note';
  result: string;
  summary: string;
  notes?: string;
  duration_minutes?: number;
  performed_by?: string;
  performed_at: string;
  created_at: string;
}

export interface Campaign {
  id: string;
  name: string;
  objective: string;
  channel: 'phone' | 'field' | 'email' | 'hybrid';
  status: 'draft' | 'active' | 'paused' | 'completed' | 'archived';
  target_sector?: string;
  target_location?: string;
  target_count: number;
  start_date: string;
  end_date?: string;
  script_id?: string;
  branch_name: string;
  priority: PriorityLevel;
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface ScriptStep {
  id: string;
  title: string;
  objective: string;
  suggestedTalk: string;
  durationSeconds?: number;
}

export interface CommercialScript {
  id: string;
  title: string;
  target_sector?: string;
  branch_name: string;
  steps: ScriptStep[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ObjectionRecord {
  id: string;
  category: string;
  title: string;
  rebuttal: string;
  counter_questions: string[];
  is_active: boolean;
  created_at: string;
}

export interface FieldRoute {
  id: string;
  name: string;
  assigned_to?: string;
  date: string;
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  start_address?: string;
  total_distance_km: number;
  estimated_duration_minutes: number;
  created_at: string;
  visits?: FieldVisit[];
}

export interface FieldVisit {
  id: string;
  route_id: string;
  prospect_id: string;
  company_id: string;
  visit_order: number;
  status: 'a_visiter' | 'visite_effectuee' | 'absent' | 'ferme' | 'refus' | 'rdv_obtenu' | 'a_revisiter';
  report_notes?: string;
  gps_lat?: number;
  gps_lng?: number;
  visited_at?: string;
  created_at: string;

  // Joined
  company?: Company;
  prospect?: ProspectRecord;
}

export interface TaskRecord {
  id: string;
  prospect_id?: string;
  company_id?: string;
  title: string;
  description?: string;
  due_date: string;
  due_time?: string;
  priority: PriorityLevel;
  status: 'todo' | 'in_progress' | 'done' | 'cancelled';
  task_type: 'relance_tel' | 'visite_terrain' | 'email' | 'devis' | 'cadrage' | 'autre';
  assigned_to?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;

  // Joined
  company?: Company;
  prospect?: ProspectRecord;
}

export interface AppointmentRecord {
  id: string;
  prospect_id: string;
  company_id: string;
  contact_id?: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  location_type: 'visio' | 'telephone' | 'sur_place';
  physical_address?: string;
  meeting_link?: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled' | 'no_show';
  outlook_event_id?: string;
  outlook_sync_status: 'pending' | 'synced' | 'error';
  assigned_to?: string;
  created_at: string;
  updated_at: string;
}

export interface EmailMessageRecord {
  id: string;
  prospect_id?: string;
  company_id?: string;
  contact_id?: string;
  outlook_message_id?: string;
  direction: 'outbound' | 'inbound';
  sender_email: string;
  recipient_email: string;
  subject: string;
  body_preview?: string;
  sent_at: string;
  created_at: string;
}

export interface AutomationLogRecord {
  id: string;
  rule_id?: string;
  rule_name: string;
  status: 'succes' | 'avertissement' | 'erreur' | 'simule';
  summary: string;
  details?: string;
  created_at: string;
}

// ==============================================================================
// ADDENDUM 1 : TYPES DU NEXUS WORKFLOW ENGINE
// ==============================================================================

export type WorkflowCategory = 'acquisition' | 'prospection' | 'qualification' | 'suivi_commercial' | 'reporting' | 'systeme';
export type WorkflowStatus = 'draft' | 'active' | 'paused' | 'archived';
export type NodeCategory = 'trigger' | 'acquisition' | 'qualification' | 'call_desk' | 'field' | 'crm' | 'outlook' | 'logic' | 'notification';
export type ExecutionStatus = 'running' | 'completed' | 'failed' | 'paused' | 'cancelled';
export type StepStatus = 'pending' | 'running' | 'success' | 'failed' | 'skipped';

export interface WorkflowDefinition {
  id: string;
  name: string;
  description?: string;
  category: WorkflowCategory;
  trigger_type: string;
  status: WorkflowStatus;
  version: number;
  is_template: boolean;
  settings: {
    max_concurrency: number;
    retry_limit: number;
    timeout_seconds: number;
  };
  created_by?: string;
  created_at: string;
  updated_at: string;

  // Joined
  nodes?: WorkflowNode[];
  edges?: WorkflowEdge[];
}

export interface WorkflowNode {
  id: string;
  workflow_id: string;
  block_type: string;
  label: string;
  category: NodeCategory;
  position_x: number;
  position_y: number;
  config: Record<string, any>;
  inputs: Array<{ id: string; label: string; type: string }>;
  outputs: Array<{ id: string; label: string; type: string }>;
  created_at: string;
}

export interface WorkflowEdge {
  id: string;
  workflow_id: string;
  source_node_id: string;
  target_node_id: string;
  source_handle?: string;
  target_handle?: string;
  condition_expr?: string;
  created_at: string;
}

export interface WorkflowExecution {
  id: string;
  workflow_id: string;
  trigger_event: string;
  status: ExecutionStatus;
  trigger_payload: Record<string, any>;
  execution_context: Record<string, any>;
  started_at: string;
  completed_at?: string;
  duration_ms?: number;
  error_message?: string;
  triggered_by?: string;

  // Joined
  workflow?: WorkflowDefinition;
  steps?: WorkflowExecutionStep[];
}

export interface WorkflowExecutionStep {
  id: string;
  execution_id: string;
  node_id: string;
  block_type: string;
  status: StepStatus;
  input_data?: Record<string, any>;
  output_data?: Record<string, any>;
  error_log?: string;
  retry_attempt: number;
  started_at: string;
  completed_at?: string;
  duration_ms?: number;
}

export interface WorkflowQueueJob {
  id: string;
  workflow_id: string;
  node_id?: string;
  execution_id: string;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'dead_letter';
  payload: Record<string, any>;
  run_at: string;
  retry_count: number;
  max_retries: number;
  idempotency_key?: string;
  error_detail?: string;
  created_at: string;
}

// ==============================================================================
// ADDENDUM 2 : CALL DESK & SESSIONS DE PHONING
// ==============================================================================

export interface CallSession {
  id: string;
  campaign_id?: string;
  user_id: string;
  status: 'active' | 'paused' | 'completed';
  started_at: string;
  ended_at?: string;
  duration_seconds: number;
  total_calls: number;
  connected_calls: number;
  appointments_booked: number;
  followups_scheduled: number;
  notes?: string;
  created_at: string;

  // Joined
  campaign?: Campaign;
}

export interface ProspectAssignment {
  id: string;
  prospect_id: string;
  assigned_to: string;
  assigned_by?: string;
  status: 'assigned' | 'in_progress' | 'transferred' | 'unassigned';
  assigned_at: string;
}

// ==============================================================================
// ADDENDUM 3 : FIELD SESSIONS & SYNCHRONISATION HORS LIGNE
// ==============================================================================

export interface FieldSession {
  id: string;
  route_id?: string;
  user_id: string;
  status: 'planned' | 'ready' | 'in_progress' | 'suspended' | 'completed' | 'cancelled';
  started_at?: string;
  ended_at?: string;
  total_visits: number;
  visited_count: number;
  appointments_booked: number;
  notes?: string;
  created_at: string;

  // Joined
  route?: FieldRoute;
}

export interface OfflineSyncQueueItem {
  id: string;
  user_id?: string;
  entity_type: 'field_visit' | 'call_interaction' | 'prospect_update' | 'task_completion' | 'appointment_creation';
  entity_id: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  payload: Record<string, any>;
  status: 'pending' | 'synced' | 'conflict' | 'failed';
  error_message?: string;
  created_at: string;
  synced_at?: string;
}

