/**
 * NEXUS Digital - Générateur de Documents Contractuels & Techniques
 * ADN : « THINK HUMAN, EXECUTE AI, EVOLVE HYBRID. »
 * Principe : « L’entreprise d’abord. La technologie ensuite. »
 */

import type {
  WebConfiguration,
  GeneratedDocument,
  DocumentType,
  CompanyLegalProfile,
  ClientLegalProfile,
  WebComponent,
} from '../types/configurator';
import type { EngineResult } from './configuratorEngine';

export interface ValidationBlocker {
  type: 'legal' | 'pricing' | 'scope';
  field: string;
  message: string;
}

/**
 * Valide si les informations légales et financières requises sont complètes pour une facture
 */
export function checkInvoiceLegalBlockers(
  company: CompanyLegalProfile,
  client: ClientLegalProfile,
  engineResult: EngineResult
): ValidationBlocker[] {
  const blockers: ValidationBlocker[] = [];

  // 1. Mentions légales vendeur obligatoires
  if (!company.companyName.trim()) {
    blockers.push({ type: 'legal', field: 'companyName', message: 'Raison sociale du vendeur manquante' });
  }
  if (!company.sirenSiret.trim()) {
    blockers.push({ type: 'legal', field: 'sirenSiret', message: 'Numéro SIREN / SIRET du vendeur manquant (obligatoire pour toute facturation légale)' });
  }
  if (!company.address.trim() || !company.city.trim()) {
    blockers.push({ type: 'legal', field: 'address', message: 'Adresse du siège social du vendeur incomplète' });
  }
  if (!company.vatNumber.trim()) {
    blockers.push({ type: 'legal', field: 'vatNumber', message: 'Mention TVA ou régime fiscal du vendeur non configuré (à vérifier selon la situation fiscale exacte de NEXUS Premium Solutions)' });
  }

  // 2. Mentions légales client obligatoires
  if (!client.companyName.trim()) {
    blockers.push({ type: 'legal', field: 'client.companyName', message: 'Nom ou raison sociale du client manquant' });
  }
  if (!client.address.trim() || !client.city.trim()) {
    blockers.push({ type: 'legal', field: 'client.address', message: 'Adresse de facturation du client incomplète' });
  }

  // 3. Paramètres tarifaires
  if (!engineResult.pricingCalculation.isFullyConfigured) {
    blockers.push({
      type: 'pricing',
      field: 'hourlyRate',
      message: `Paramètres tarifaires incomplets ou en attente : ${engineResult.pricingCalculation.missingParameters.join(', ')}`,
    });
  }

  // 4. Exigences critiques non qualifiées
  if (engineResult.criticalRequirementsMissing.length > 0) {
    blockers.push({
      type: 'scope',
      field: 'criticalRequirements',
      message: `${engineResult.criticalRequirementsMissing.length} exigence(s) critique(s) restent « À qualifier » : estimation ferme et facturation définitive strictement bloquées tant que le besoin n’est pas validé.`,
    });
  }

  return blockers;
}

/**
 * Génère un document structuré et versionné
 */
export function generateDocument(
  type: DocumentType,
  config: WebConfiguration,
  engineResult: EngineResult,
  componentsCatalog: WebComponent[],
  companyProfile: CompanyLegalProfile,
  currentVersion: number = 1
): GeneratedDocument {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const compMap = new Map(componentsCatalog.map((c) => [c.id, c]));

  // Récupération des composants retenus
  const selectedComps = Object.values(config.selections)
    .filter((s) => s.isSelected)
    .map((s) => ({
      selection: s,
      component: compMap.get(s.componentId)!,
    }))
    .filter((item) => Boolean(item.component));

  const frontComps = selectedComps.filter((c) => c.component.category === 'Front-end');
  const backComps = selectedComps.filter((c) => c.component.category === 'Back-end');

  const docId = `doc_${type}_${Date.now()}_v${currentVersion}`;
  const referenceNumber = `${type.toUpperCase()}-${config.projectId.slice(-6).toUpperCase()}-V${currentVersion}`;

  let title = '';
  const blockingErrors: string[] = [];

  if (type === 'cahier_technique') {
    title = `Document de travail en brouillon à vérifier — Spécifications techniques internes (${config.projectTitle})`;
  } else if (type === 'cahier_client') {
    title = `Document de travail en brouillon à vérifier — Cadrage explicatif client (${config.projectTitle})`;
  } else if (type === 'bon_commande') {
    title = `Document de travail en brouillon à vérifier — Projet de bon de commande (${config.projectTitle} · Réf : ${referenceNumber})`;
  } else if (type === 'facture') {
    title = `Document de travail en brouillon à vérifier — Simulation de facturation (${config.projectTitle} · Réf : ${referenceNumber})`;
    const blockers = checkInvoiceLegalBlockers(companyProfile, config.clientLegal, engineResult);
    if (blockers.length > 0) {
      blockingErrors.push(...blockers.map((b) => b.message));
    }
  }

  return {
    id: docId,
    type,
    title,
    version: currentVersion,
    status: 'brouillon', // Toujours créé en brouillon
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    referenceNumber,
    content: {
      meta: {
        projectId: config.projectId,
        projectTitle: config.projectTitle,
        clientName: config.clientName,
        author: 'NEXUS Digital / NEXUS Premium Solutions',
        date: dateStr,
      },
      blockingErrors: blockingErrors.length > 0 ? blockingErrors : undefined,
      structuredData: {
        projectType: config.projectType,
        selectedComponents: selectedComps,
        frontComponents: frontComps,
        backComponents: backComps,
        pricing: engineResult.pricingCalculation,
        delivery: engineResult.deliveryEstimate,
        companyProfile,
        clientLegal: config.clientLegal,
        requirements: config.requirements,
      },
    },
  };
}
