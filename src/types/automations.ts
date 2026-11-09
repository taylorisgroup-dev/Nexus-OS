/**
 * NEXUS OS - Automations Center
 * ADN : « THINK HUMAN, EXECUTE AI, EVOLVE HYBRID. »
 * Principe : « L’entreprise d’abord. La technologie ensuite. »
 *
 * RÈGLE FONDAMENTALE DE SÉCURITÉ :
 * Automatisations purement internes. AUCUN appel téléphonique, courriel, message, publication,
 * contrat, facture, paiement, suppression, export externe ou partage automatique.
 * Tout reste sous supervision et validation humaine stricte.
 */

export type AutomationTrigger =
  | 'task_overdue'
  | 'prospect_won'
  | 'period_end'
  | 'project_blocked'
  | 'manual_check';

export type AutomationAction =
  | 'in_app_alert'
  | 'propose_task_checklist'
  | 'prepare_draft_report';

export type AutomationStatus =
  | 'brouillon'
  | 'en test'
  | 'active'
  | 'en pause';

export interface AutomationLog {
  id: string;
  ruleId: string;
  ruleName: string;
  timestamp: string;
  status: 'succès' | 'avertissement' | 'erreur' | 'simulé';
  summary: string;
  details?: string;
  targetEntity?: string;
}

export interface InAppAlert {
  id: string;
  ruleId?: string;
  title: string;
  message: string;
  severity: 'info' | 'avertissement' | 'critique';
  entityType?: 'prospect' | 'projet' | 'tache' | 'rapport';
  entityId?: string;
  entityName?: string;
  timestamp: string;
  dismissed: boolean;
}

export interface AutomationRule {
  id: string;
  name: string;
  trigger: AutomationTrigger;
  triggerLabel: string;
  conditions: string;
  actionType: AutomationAction;
  actionLabel: string;
  scope: string; // 'Transversale' or branchId
  status: AutomationStatus;
  owner: string;
  createdAt: string;
  updatedAt: string;
  lastRunAt?: string;
  lastResult?: string;
  lastError?: string;
  deduplicationLimit: string;
  executionCount: number;
}

/**
 * Règles initiales d'automatisations sécurisées.
 * Par défaut : TOUTES les règles sont en statut "en test" ou "brouillon".
 * Aucune règle active sans validation explicite de l'utilisateur.
 */
export const DEFAULT_AUTOMATION_RULES: AutomationRule[] = [
  {
    id: 'rule_task_overdue_alert',
    name: 'Alerte interne sur échéances d’actions dépassées',
    trigger: 'task_overdue',
    triggerLabel: 'Échéance de tâche dépassée (date < aujourd’hui & non terminée)',
    conditions: 'Toutes tâches actives où status != "Terminé" et dueDate < date actuelle',
    actionType: 'in_app_alert',
    actionLabel: 'Notification d’alerte visuelle dans le cockpit interne',
    scope: 'Transversale',
    status: 'en test', // Pas active d'office
    owner: 'Direction Opérationnelle',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    deduplicationLimit: '1 alerte par tâche par tranche de 24h',
    executionCount: 0,
  },
  {
    id: 'rule_prospect_won_checklist',
    name: 'Proposition de checklist de cadrage sur opportunité gagnée',
    trigger: 'prospect_won',
    triggerLabel: 'Prospect passant au statut « Gagné »',
    conditions: 'Prospect avec statut == "Gagné" sans projet lié initialisé',
    actionType: 'propose_task_checklist',
    actionLabel: 'Proposer la création des tâches de cadrage initial et passation',
    scope: 'Transversale',
    status: 'brouillon', // Nouveau départ en brouillon
    owner: 'Direction Commerciale',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    deduplicationLimit: '1 proposition unique par prospect gagné',
    executionCount: 0,
  },
  {
    id: 'rule_period_draft_report',
    name: 'Préparation d’un brouillon de synthèse de fin de période',
    trigger: 'period_end',
    triggerLabel: 'Clôture de quinzaine ou de mois calendaire',
    conditions: 'Données disponibles suffisantes (prospects, projets, tâches)',
    actionType: 'prepare_draft_report',
    actionLabel: 'Générer un brouillon de synthèse consolidée prêt pour revue',
    scope: 'Transversale',
    status: 'en test',
    owner: 'Gouvernance NEXUS',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    deduplicationLimit: '1 brouillon par période calendaire',
    executionCount: 0,
  },
];
