/**
 * NEXUS Digital - Moteur de Règles Déterministe & Chiffrage Explicable
 * ADN : « THINK HUMAN, EXECUTE AI, EVOLVE HYBRID. »
 * Principe : « L’entreprise d’abord. La technologie ensuite. »
 */

import type {
  FramingRequirement,
  WebComponent,
  ComponentSelection,
  PricingParameters,
  WebProjectType,
  DeliveryEstimation,
} from '../types/configurator';
import { REFERENCE_DELAYS } from './configuratorDefaults';

export interface EngineResult {
  selections: Record<string, ComponentSelection>;
  totalEffortMin: number;
  totalEffortMax: number;
  totalOneTimeCosts: number;
  totalRecurringMonthlyCosts: number;
  unresolvedDependencies: {
    componentId: string;
    missingDependencyId: string;
    missingDependencyName: string;
  }[];
  detectedIncompatibilities: {
    componentAId: string;
    componentBId: string;
    message: string;
  }[];
  criticalRequirementsMissing: FramingRequirement[];
  isFirmEstimationBlocked: boolean;
  firmEstimationBlockerReason?: string;
  pricingCalculation: {
    isFullyConfigured: boolean;
    missingParameters: string[];
    costLaborMin: number | null;
    costLaborMax: number | null;
    totalOneTimeExpenses: number;
    marginAmountMin: number;
    marginAmountMax: number;
    discountAmount: number | null;
    totalHTMin: number | null;
    totalHTMax: number | null;
    taxRatePercent: number | null;
    taxAmountMin: number | null;
    taxAmountMax: number | null;
    totalTTCMin: number | null;
    totalTTCMax: number | null;
    formulaDisplay: string;
  };
  deliveryEstimate: DeliveryEstimation;
  scopeAlert?: {
    exceedsStandard: boolean;
    message: string;
  };
}

/**
 * Exécute le moteur de règles déterministe
 */
export function runConfiguratorEngine(
  projectType: WebProjectType,
  requirements: FramingRequirement[],
  componentsCatalog: WebComponent[],
  currentSelections: Record<string, ComponentSelection>,
  pricing: PricingParameters,
  targetStartDate: string = ''
): EngineResult {
  // 1. Indexation des exigences par ID et statut
  const reqMap = new Map<string, FramingRequirement>();
  const validatedReqIds = new Set<string>();
  const toQualifyCriticalReqs: FramingRequirement[] = [];

  for (const r of requirements) {
    reqMap.set(r.id, r);
    if (r.status === 'Validée') {
      validatedReqIds.add(r.id);
    }
    if (r.status === 'À qualifier' && r.isCritical) {
      toQualifyCriticalReqs.push(r);
    }
  }

  // 2. Indexation des composants
  const compMap = new Map<string, WebComponent>();
  for (const c of componentsCatalog) {
    compMap.set(c.id, c);
  }

  // 3. Détermination des composants recommandés et justifications
  const recommendedComponents = new Map<
    string,
    { justification: string; coveredReqs: string[]; missingConfirmations: string[] }
  >();

  // Règle 3.1 : Socle universel de tout site web
  recommendedComponents.set('fe_responsive_layout', {
    justification: 'Fondation obligatoire : grille responsive et mise en page multi-écrans.',
    coveredReqs: ['req_objectives', 'req_audience'],
    missingConfirmations: [],
  });

  recommendedComponents.set('fe_navigation_header', {
    justification: 'Composant obligatoire pour structurer le parcours utilisateur et l’accès aux pages.',
    coveredReqs: ['req_pages', 'req_user_journeys'],
    missingConfirmations: [],
  });

  recommendedComponents.set('be_deployment_pipeline', {
    justification: 'Bonne pratique d’ingénierie : pipeline de déploiement et environnement de recette.',
    coveredReqs: ['req_hosting', 'req_acceptance_criteria'],
    missingConfirmations: [],
  });

  // Règle 3.2 : Pages éditoriales & CMS
  if (
    projectType === 'Site institutionnel / portail' ||
    projectType === 'E-commerce' ||
    projectType === 'Sur mesure' ||
    validatedReqIds.has('req_pages') ||
    validatedReqIds.has('req_content_supply')
  ) {
    recommendedComponents.set('fe_editorial_templates', {
      justification: 'Recommandé pour structurer les gabarits de contenus et pages institutionnelles.',
      coveredReqs: ['req_pages', 'req_content_supply'],
      missingConfirmations: reqMap.get('req_content_supply')?.status === 'À qualifier'
        ? ['Fourniture définitive des textes et photos par le client à confirmer']
        : [],
    });

    recommendedComponents.set('be_cms_database', {
      justification: 'Base de données requise pour administrer les contenus évolutifs.',
      coveredReqs: ['req_pages', 'req_content_supply'],
      missingConfirmations: [],
    });
  }

  // Règle 3.3 : Formulaires & Contacts
  if (validatedReqIds.has('req_forms') || validatedReqIds.has('req_objectives')) {
    recommendedComponents.set('fe_contact_form', {
      justification: 'Interface de qualification de leads et prise de contact sécurisée.',
      coveredReqs: ['req_forms', 'req_objectives'],
      missingConfirmations: [],
    });

    recommendedComponents.set('be_forms_api', {
      justification: 'Endpoint serveur pour valider les formulaires, filtrer le spam et router les notifications.',
      coveredReqs: ['req_forms'],
      missingConfirmations: [],
    });
  }

  // Règle 3.4 : Recherche et filtres
  if (validatedReqIds.has('req_search')) {
    recommendedComponents.set('fe_search_filters', {
      justification: 'Exigence validée : moteur de recherche interne et filtrage multi-critères.',
      coveredReqs: ['req_search'],
      missingConfirmations: [],
    });
  }

  // Règle 3.5 : Catalogue & E-commerce
  if (
    projectType === 'E-commerce' ||
    validatedReqIds.has('req_catalog') ||
    validatedReqIds.has('req_payments')
  ) {
    recommendedComponents.set('fe_product_catalog', {
      justification: 'Exposition structurée des fiches produits/services et variantes.',
      coveredReqs: ['req_catalog'],
      missingConfirmations: [],
    });

    recommendedComponents.set('be_catalog_data', {
      justification: 'Référentiel des articles, prix, références et stocks côté serveur.',
      coveredReqs: ['req_catalog'],
      missingConfirmations: [],
    });

    recommendedComponents.set('be_media_storage', {
      justification: 'Stockage cloud optimisé pour les visuels de catalogue et documents.',
      coveredReqs: ['req_catalog', 'req_content_supply'],
      missingConfirmations: [],
    });
  }

  // Règle 3.6 : Tunnel d’achat et Paiement en ligne (Uniquement si explicitement demandé)
  if (projectType === 'E-commerce' || validatedReqIds.has('req_payments')) {
    recommendedComponents.set('fe_cart_checkout', {
      justification: 'Tunnel d’achat panier et saisie d’adresses pour conversion en ligne.',
      coveredReqs: ['req_payments'],
      missingConfirmations: [],
    });

    recommendedComponents.set('be_orders_engine', {
      justification: 'Moteur de commandes, calcul des totaux et suivi des transactions.',
      coveredReqs: ['req_payments'],
      missingConfirmations: [],
    });

    recommendedComponents.set('be_payment_gateway', {
      justification: 'Passerelle bancaire sécurisée certifiée PCI-DSS (ex: Stripe ou passerelle bancaire).',
      coveredReqs: ['req_payments'],
      missingConfirmations: reqMap.get('req_payments')?.status === 'À qualifier'
        ? ['Choix du prestataire bancaire et ouverture du compte marchand à valider']
        : [],
    });

    recommendedComponents.set('be_transactional_notifications', {
      justification: 'Emails transactionnels de confirmation de commande et facturation.',
      coveredReqs: ['req_payments'],
      missingConfirmations: [],
    });
  }

  // Règle 3.7 : Comptes utilisateurs & Espace client
  if (validatedReqIds.has('req_user_accounts')) {
    recommendedComponents.set('fe_client_portal', {
      justification: 'Espace privatif client pour consulter les données personnelles et l’historique.',
      coveredReqs: ['req_user_accounts'],
      missingConfirmations: [],
    });

    recommendedComponents.set('be_auth_system', {
      justification: 'Gestion sécurisée de l’authentification et des sessions utilisateurs.',
      coveredReqs: ['req_user_accounts'],
      missingConfirmations: [],
    });

    recommendedComponents.set('be_rbac_permissions', {
      justification: 'Contrôle des rôles et autorisations pour protéger les données privées.',
      coveredReqs: ['req_user_accounts', 'req_roles'],
      missingConfirmations: [],
    });

    recommendedComponents.set('be_logging_audit', {
      justification: 'Traçabilité des accès et audit de sécurité des comptes.',
      coveredReqs: ['req_user_accounts', 'req_security_gdpr'],
      missingConfirmations: [],
    });
  }

  // Règle 3.8 : SEO et Référencement
  if (validatedReqIds.has('req_seo') || projectType !== 'Sur mesure') {
    recommendedComponents.set('fe_seo_metadata', {
      justification: 'Optimisation SEO technique, balises OpenGraph et sitemap XML pour indexation.',
      coveredReqs: ['req_seo'],
      missingConfirmations: [],
    });
  }

  // Règle 3.9 : Accessibilité renforcée
  if (validatedReqIds.has('req_accessibility')) {
    recommendedComponents.set('fe_accessibility_rgaa', {
      justification: 'Exigence d’accessibilité WCAG AA / RGAA formalisée.',
      coveredReqs: ['req_accessibility'],
      missingConfirmations: [],
    });
  }

  // Règle 3.10 : Consentement & Analytique
  if (validatedReqIds.has('req_analytics')) {
    recommendedComponents.set('fe_consent_analytics', {
      justification: 'Gestionnaire de cookies et consentement RGPD conforme CNIL.',
      coveredReqs: ['req_analytics', 'req_security_gdpr'],
      missingConfirmations: [],
    });
  }

  // Règle 3.11 : Disponibilité et Sauvegardes
  if (
    validatedReqIds.has('req_availability') ||
    projectType === 'E-commerce' ||
    validatedReqIds.has('req_user_accounts')
  ) {
    recommendedComponents.set('be_backup_retention', {
      justification: 'Sauvegardes automatiques quotidiennes et plan de reprise d’activité.',
      coveredReqs: ['req_availability'],
      missingConfirmations: [],
    });
  }

  // 4. Construction des sélections consolidées (respect des surcharges manuelles)
  const selections: Record<string, ComponentSelection> = {};

  for (const comp of componentsCatalog) {
    const recommended = recommendedComponents.get(comp.id);
    const existing = currentSelections[comp.id];

    let isSelected: boolean;
    let isOverridden = false;
    let overrideReason = existing?.overrideReason;

    if (existing && existing.isOverriddenManually) {
      // Respect du choix forcé par le dirigeant
      isSelected = existing.isSelected;
      isOverridden = true;
    } else {
      // Déduction déterministe
      isSelected = Boolean(recommended);
    }

    selections[comp.id] = {
      componentId: comp.id,
      isSelected,
      isRecommendedByEngine: Boolean(recommended),
      isOverriddenManually: isOverridden,
      overrideReason,
      engineJustification: recommended
        ? recommended.justification
        : 'Non retenu : aucune exigence validée ne nécessite ce composant.',
      coveredRequirementIds: recommended ? recommended.coveredReqs : [],
      missingConfirmations: recommended ? recommended.missingConfirmations : [],
      customEffortMin: existing?.customEffortMin,
      customEffortMax: existing?.customEffortMax,
      customOneTimeCost: existing?.customOneTimeCost,
      customRecurringMonthlyCost: existing?.customRecurringMonthlyCost,
    };
  }

  // 5. Cascade des dépendances et incompatibilités
  const selectedComponentIds = new Set<string>(
    Object.values(selections)
      .filter((s) => s.isSelected)
      .map((s) => s.componentId)
  );

  const unresolvedDependencies: EngineResult['unresolvedDependencies'] = [];
  const detectedIncompatibilities: EngineResult['detectedIncompatibilities'] = [];

  for (const compId of selectedComponentIds) {
    const comp = compMap.get(compId);
    if (!comp) continue;

    // Dépendances requises
    for (const depId of comp.dependencies) {
      if (!selectedComponentIds.has(depId)) {
        const depComp = compMap.get(depId);
        unresolvedDependencies.push({
          componentId: comp.id,
          missingDependencyId: depId,
          missingDependencyName: depComp?.name || depId,
        });
      }
    }

    // Incompatibilités
    for (const incId of comp.incompatibilities) {
      if (selectedComponentIds.has(incId)) {
        const incComp = compMap.get(incId);
        detectedIncompatibilities.push({
          componentAId: comp.id,
          componentBId: incId,
          message: `Incompatibilité technique entre « ${comp.name} » et « ${incComp?.name || incId} ».`,
        });
      }
    }
  }

  // 6. Calculs d'effort et de coûts
  let totalEffortMin = 0;
  let totalEffortMax = 0;
  let totalOneTimeCosts = 0;
  let totalRecurringMonthlyCosts = 0;

  for (const compId of selectedComponentIds) {
    const comp = compMap.get(compId);
    if (!comp) continue;
    const sel = selections[compId];

    const effortMin = sel.customEffortMin ?? comp.effortMinHours;
    const effortMax = sel.customEffortMax ?? comp.effortMaxHours;
    const oneTime = sel.customOneTimeCost ?? comp.oneTimeCostDefault;
    const recurring = sel.customRecurringMonthlyCost ?? comp.recurringMonthlyCostDefault;

    totalEffortMin += effortMin;
    totalEffortMax += effortMax;
    totalOneTimeCosts += oneTime;
    totalRecurringMonthlyCosts += recurring;
  }

  // 7. Chiffrage Paramétrable & Formule Visible
  const missingPricingParams: string[] = [];
  if (pricing.hourlyRate === null || pricing.hourlyRate <= 0) {
    missingPricingParams.push('Taux horaire (€/h)');
  }
  if (pricing.taxRatePercent === null) {
    missingPricingParams.push('Taux de taxe applicable (à vérifier selon situation fiscale)');
  }

  // Règle d'or NEXUS : Si des exigences critiques ne sont pas validées, l'estimation ferme est STRICTEMENT BLOQUÉE
  const hasCriticalUnvalidated = toQualifyCriticalReqs.length > 0;
  const isFirmEstimationBlocked = hasCriticalUnvalidated;
  const firmEstimationBlockerReason = hasCriticalUnvalidated
    ? `${toQualifyCriticalReqs.length} exigence(s) critique(s) restent « À qualifier ». Même si des composants de base sont suggérés, aucun chiffrage ferme ne peut être arrêté sans validation formelle du besoin.`
    : undefined;

  const isPricingFullyConfigured = missingPricingParams.length === 0 && !isFirmEstimationBlocked;

  let costLaborMin: number | null = null;
  let costLaborMax: number | null = null;
  let marginAmountMin = 0;
  let marginAmountMax = 0;
  let totalHTMin: number | null = null;
  let totalHTMax: number | null = null;
  let taxAmountMin: number | null = null;
  let taxAmountMax: number | null = null;
  let totalTTCMin: number | null = null;
  let totalTTCMax: number | null = null;

  if (pricing.hourlyRate !== null && pricing.hourlyRate > 0) {
    costLaborMin = totalEffortMin * pricing.hourlyRate;
    costLaborMax = totalEffortMax * pricing.hourlyRate;

    const baseMin = costLaborMin + totalOneTimeCosts + (pricing.oneTimeExpenses || 0) + (pricing.thirdPartyExpenses || 0);
    const baseMax = costLaborMax + totalOneTimeCosts + (pricing.oneTimeExpenses || 0) + (pricing.thirdPartyExpenses || 0);

    if (pricing.marginPercent !== null && pricing.marginPercent > 0) {
      marginAmountMin = (baseMin * pricing.marginPercent) / 100;
      marginAmountMax = (baseMax * pricing.marginPercent) / 100;
    }

    const discount = pricing.discountAmount || 0;
    totalHTMin = Math.max(0, baseMin + marginAmountMin - discount);
    totalHTMax = Math.max(0, baseMax + marginAmountMax - discount);

    if (pricing.taxRatePercent !== null) {
      taxAmountMin = (totalHTMin * pricing.taxRatePercent) / 100;
      taxAmountMax = (totalHTMax * pricing.taxRatePercent) / 100;
      totalTTCMin = totalHTMin + taxAmountMin;
      totalTTCMax = totalHTMax + taxAmountMax;
    }
  }

  const formulaDisplay = `Formule = (Σ Heures [${totalEffortMin}h - ${totalEffortMax}h] × Taux horaire [${
    pricing.hourlyRate !== null ? pricing.hourlyRate + ' €/h' : 'À configurer'
  }]) + Coûts ponctuels [${pricing.oneTimeExpenses !== null ? (totalOneTimeCosts + pricing.oneTimeExpenses) + ' €' : (totalOneTimeCosts > 0 ? totalOneTimeCosts + ' €' : 'À configurer')}] + Marge [${
    pricing.marginPercent !== null ? pricing.marginPercent + ' %' : 'Non renseignée'
  }] - Remise [${pricing.discountAmount !== null ? pricing.discountAmount + ' €' : 'Non renseignée'}] + Frais tiers [${
    pricing.thirdPartyExpenses !== null ? pricing.thirdPartyExpenses + ' €' : 'Non renseignés'
  }] — Taux de taxe à vérifier selon la situation fiscale exacte de NEXUS Premium Solutions.`;

  // 8. Estimation de délais selon les temps de référence stricts de la direction
  const refDelay = REFERENCE_DELAYS[projectType] || REFERENCE_DELAYS['Sur mesure'];
  const deliveryEstimate: DeliveryEstimation = {
    projectType,
    referenceWeeksMin: refDelay.minWeeks,
    referenceWeeksMax: refDelay.maxWeeks,
    label: refDelay.label,
    clientDependencies: [
      'Validation écrite et signature du bon de commande',
      'Versement de l’acompte convenu',
      'Réception de 100 % des contenus éditoriaux, photographies HD et logos vectoriels',
      'Validation des accès techniques (nom de domaine, hébergeur ou DNS)',
      'Désignation d’un référent unique pour les retours de recette sous 48h ouvrées',
    ],
    targetStartDate: targetStartDate || new Date().toISOString().split('T')[0],
    notes: refDelay.description,
  };

  // 9. Détection de dépassement d'offre standard
  let scopeAlert: EngineResult['scopeAlert'];
  if (projectType === 'Site vitrine' && (totalEffortMax > 40 || selectedComponentIds.has('be_orders_engine') || selectedComponentIds.has('be_payment_gateway'))) {
    scopeAlert = {
      exceedsStandard: true,
      message: 'Le périmètre technique configuré (vente en ligne / espace complexe / effort > 40h) dépasse le cadre d’une offre standard de Site Vitrine. Recommandation : requalifier en E-commerce ou Sur-mesure.',
    };
  } else if (projectType === 'Site institutionnel / portail' && (totalEffortMax > 90 || selectedComponentIds.has('be_payment_gateway'))) {
    scopeAlert = {
      exceedsStandard: true,
      message: 'Le volume d’effort (> 90h) ou l’inclusion de paiement transactionnel dépasse une offre portail institutionnel classique.',
    };
  }

  return {
    selections,
    totalEffortMin,
    totalEffortMax,
    totalOneTimeCosts,
    totalRecurringMonthlyCosts,
    unresolvedDependencies,
    detectedIncompatibilities,
    criticalRequirementsMissing: toQualifyCriticalReqs,
    isFirmEstimationBlocked,
    firmEstimationBlockerReason,
    pricingCalculation: {
      isFullyConfigured: isPricingFullyConfigured,
      missingParameters: missingPricingParams,
      costLaborMin,
      costLaborMax,
      totalOneTimeExpenses: totalOneTimeCosts + (pricing.oneTimeExpenses || 0) + (pricing.thirdPartyExpenses || 0),
      marginAmountMin,
      marginAmountMax,
      discountAmount: pricing.discountAmount,
      totalHTMin,
      totalHTMax,
      taxRatePercent: pricing.taxRatePercent,
      taxAmountMin,
      taxAmountMax,
      totalTTCMin,
      totalTTCMax,
      formulaDisplay,
    },
    deliveryEstimate,
    scopeAlert,
  };
}
