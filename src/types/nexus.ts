/**
 * NEXUS OS - Types & Definitions
 * ADN : « THINK HUMAN, EXECUTE AI, EVOLVE HYBRID. »
 * Principe : « L’entreprise d’abord. La technologie ensuite. »
 */

import type { WebConfiguration } from './configurator';
export * from './branches';
export * from './automations';
export * from './phoning';

export type ProspectStatus =
  | 'À qualifier'
  | 'À contacter'
  | 'Contacté'
  | 'Échange'
  | 'Rendez-vous'
  | 'Proposition envoyée'
  | 'Gagné'
  | 'Perdu'
  | 'En attente';

export const PROSPECT_STATUSES: ProspectStatus[] = [
  'À qualifier',
  'À contacter',
  'Contacté',
  'Échange',
  'Rendez-vous',
  'Proposition envoyée',
  'Gagné',
  'Perdu',
  'En attente',
];

export type OfferStatus =
  | 'Idée'
  | 'À valider'
  | 'Cadrage'
  | 'En production'
  | 'À tester'
  | 'Prêt à vendre'
  | 'Actif'
  | 'En pause';

export const OFFER_STATUSES: OfferStatus[] = [
  'Idée',
  'À valider',
  'Cadrage',
  'En production',
  'À tester',
  'Prêt à vendre',
  'Actif',
  'En pause',
];

export type ProjectStatus =
  | 'À cadrer'
  | 'Prêt'
  | 'En cours'
  | 'Bloqué'
  | 'À valider'
  | 'Livré'
  | 'En pause';

export const PROJECT_STATUSES: ProjectStatus[] = [
  'À cadrer',
  'Prêt',
  'En cours',
  'Bloqué',
  'À valider',
  'Livré',
  'En pause',
];

export type TaskStatus = 'À faire' | 'En cours' | 'Terminé';
export const TASK_STATUSES: TaskStatus[] = ['À faire', 'En cours', 'Terminé'];

export type TaskPriority = 'Haute' | 'Moyenne' | 'Basse';
export const TASK_PRIORITIES: TaskPriority[] = ['Haute', 'Moyenne', 'Basse'];

export type InteractionType =
  | 'Appel'
  | 'Email'
  | 'Réunion'
  | 'Découverte'
  | 'Envoi proposition'
  | 'Relance';

export const INTERACTION_TYPES: InteractionType[] = [
  'Appel',
  'Email',
  'Réunion',
  'Découverte',
  'Envoi proposition',
  'Relance',
];

export type IdeaStatus = 'Nouvelle' | 'À explorer' | 'Retenue' | 'Rejetée';
export const IDEA_STATUSES: IdeaStatus[] = ['Nouvelle', 'À explorer', 'Retenue', 'Rejetée'];

export type DecisionStatus = 'Actée' | 'En révision' | 'Archivée';
export const DECISION_STATUSES: DecisionStatus[] = ['Actée', 'En révision', 'Archivée'];

export interface EnrichedData {
  fullAddress?: string;
  verifiedPhone?: string;
  websiteStatus?: string;
  digitalMaturity?: string;
  detectedTechStack?: string;
  googleRating?: number;
  googleReviewCount?: number;
  decisionMakers?: { name: string; role: string }[];
  keyPainPoints?: string[];
  nexusHooks?: string[];
  sirenStatus?: string;
  googleMapsUrl?: string;
  enrichedAt?: string;
}

export interface Prospect {
  id: string;
  company: string;
  contactName: string;
  email: string;
  phone: string;
  sector: string;
  needsSummary: string;
  status: ProspectStatus;
  campaignId?: string;
  campaignName?: string;
  city?: string;
  postalCode?: string;
  address?: string;
  website?: string;
  mapsUrl?: string;
  verified?: boolean;
  branchId?: string;
  nextContactDate?: string;
  notes: string;
  enrichedData?: EnrichedData;
  isArchived: boolean;
  ownerId: string;
  ownerEmail: string;
  createdAt: string;
  updatedAt: string;
}

export interface Interaction {
  id: string;
  prospectId: string;
  date: string;
  type: InteractionType;
  summary: string;
  nextStep?: string;
  callResult?: string;
  campaignId?: string;
  campaignName?: string;
  branchId?: string;
  objectionMet?: string;
  durationMinutes?: number;
  ownerId: string;
  createdAt: string;
}

export interface Offer {
  id: string;
  name: string;
  code: string;
  targetAudience: string;
  businessValue: string;
  deliverables: string;
  status: OfferStatus;
  branchId?: string;
  isArchived: boolean;
  ownerId: string;
  ownerEmail: string;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  title: string;
  offerId?: string;
  offerName?: string;
  prospectId?: string;
  clientName?: string;
  branchId?: string;
  businessObjective: string;
  scope: string;
  status: ProjectStatus;
  startDate?: string;
  targetDate?: string;
  notes: string;
  isArchived: boolean;
  webConfig?: WebConfiguration;
  ownerId: string;
  ownerEmail: string;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  priority: TaskPriority;
  status: TaskStatus;
  branchId?: string;
  projectId?: string;
  projectTitle?: string;
  prospectId?: string;
  prospectName?: string;
  isArchived: boolean;
  ownerId: string;
  ownerEmail: string;
  createdAt: string;
  updatedAt: string;
}

export interface Idea {
  id: string;
  title: string;
  theme: string;
  description: string;
  potentialImpact: string;
  status: IdeaStatus;
  isArchived: boolean;
  ownerId: string;
  ownerEmail: string;
  createdAt: string;
  updatedAt: string;
}

export interface Decision {
  id: string;
  title: string;
  date: string;
  context: string;
  decision: string;
  businessJustification: string;
  status: DecisionStatus;
  isArchived: boolean;
  ownerId: string;
  ownerEmail: string;
  createdAt: string;
  updatedAt: string;
}

export interface SettingsDoc {
  id?: string;
  ownerEmail: string;
  ownerName?: string;
  companyName?: string;
  updatedAt: string;
}

export type ActiveSection =
  | 'cockpit'
  | 'acquisition'
  | 'campaigns'
  | 'phoning'
  | 'field'
  | 'email'
  | 'prospects'
  | 'offers'
  | 'projects'
  | 'tasks'
  | 'branches_reports'
  | 'automations'
  | 'configurator'
  | 'ideas_decisions'
  | 'settings';
