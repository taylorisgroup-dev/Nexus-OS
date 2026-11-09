/**
 * NEXUS Digital - Configurateur Web & Documents
 * Types & Définitions du Moteur Déterministe
 * ADN : « THINK HUMAN, EXECUTE AI, EVOLVE HYBRID. »
 * Principe : « L’entreprise d’abord. La technologie ensuite. »
 */

export type WebProjectType =
  | 'Site vitrine'
  | 'Site institutionnel / portail'
  | 'E-commerce'
  | 'Sur mesure';

export const WEB_PROJECT_TYPES: WebProjectType[] = [
  'Site vitrine',
  'Site institutionnel / portail',
  'E-commerce',
  'Sur mesure',
];

export type RequirementStatus = 'À qualifier' | 'Validée' | 'Exclue';

export interface FramingRequirement {
  id: string;
  category: string;
  title: string;
  description: string;
  question: string;
  status: RequirementStatus;
  responseDetails?: string;
  isCritical: boolean; // Si critique et "À qualifier", bloque l'estimation ferme
}

export type ComponentCategory = 'Front-end' | 'Back-end';

export type FrontSubFamily =
  | 'Pages & Design responsive'
  | 'Composants UI'
  | 'Navigation'
  | 'Formulaires'
  | 'Recherche'
  | 'Catalogue, Panier & Checkout'
  | 'Espace client'
  | 'Administration Front'
  | 'SEO'
  | 'Accessibilité'
  | 'Analytique & Consentement';

export type BackSubFamily =
  | 'CMS & Données'
  | 'API'
  | 'Authentification'
  | 'Rôles & Permissions'
  | 'Stockage Média'
  | 'Recherche Back'
  | 'Gestion des Commandes'
  | 'Paiement Prestataire'
  | 'Notifications'
  | 'Intégrations'
  | 'Journalisation & Audit'
  | 'Sauvegardes'
  | 'Environnements & Déploiement';

export interface WebComponent {
  id: string;
  name: string;
  category: ComponentCategory;
  subFamily: FrontSubFamily | BackSubFamily;
  internalExplanation: string; // Explication technique interne
  clientExplanation: string; // Explication vulgarisée orientée bénéfice client
  inclusionCriteria: string; // Critère logique qui déclenche l'inclusion
  dependencies: string[]; // IDs des composants requis
  incompatibilities: string[]; // IDs des composants incompatibles
  effortMinHours: number;
  effortMaxHours: number;
  oneTimeCostDefault: number; // Coût ponctuel par défaut (ou 0 si à configurer)
  recurringMonthlyCostDefault: number; // Coût récurrent par défaut
  risks: string;
  securityRequirements: string;
  acceptanceTests: string;
  technicalOptions: string[];
  status: 'Actif' | 'En révision' | 'Obsolète';
}

export interface ComponentSelection {
  componentId: string;
  isSelected: boolean;
  isRecommendedByEngine: boolean;
  isOverriddenManually: boolean;
  overrideReason?: string;
  engineJustification: string;
  coveredRequirementIds: string[];
  missingConfirmations: string[];
  customEffortMin?: number;
  customEffortMax?: number;
  customOneTimeCost?: number;
  customRecurringMonthlyCost?: number;
}

export interface PricingParameters {
  hourlyRate: number | null; // Taux horaire en € HT (null = À configurer)
  marginPercent: number | null; // Marge en % (optionnelle, null = Non renseignée)
  discountAmount: number | null; // Remise commerciale en € HT (null = Non renseignée)
  taxRatePercent: number | null; // Taux TVA en % (null = À configurer, selon situation fiscale à vérifier)
  oneTimeExpenses: number | null; // Frais annexes ponctuels (null = Non renseignés)
  thirdPartyExpenses: number | null; // Frais tiers explicités (null = Non renseignés)
  isConfigured: boolean;
}

export interface DeliveryEstimation {
  projectType: WebProjectType;
  referenceWeeksMin: number;
  referenceWeeksMax: number;
  label: string; // Ex: '1–2 semaines', '3–4 semaines', '7–9 semaines', 'après cadrage'
  clientDependencies: string[];
  targetStartDate: string;
  notes: string;
}

export interface CompanyLegalProfile {
  companyName: string;
  legalForm: string;
  tradeName: string;
  address: string;
  postalCode: string;
  city: string;
  country: string;
  sirenSiret: string;
  rcsNumber: string;
  vatNumber: string; // Numéro TVA intracommunautaire (ou mention franchise)
  contactEmail: string;
  contactPhone: string;
  ibanBic: string;
  paymentTerms: string;
  legalNotice: string;
  invoiceNumberPrefix: string;
  nextInvoiceSequence: number;
  logoUrl?: string;
  bannerUrl?: string;
}

export interface ClientLegalProfile {
  companyName: string;
  contactName: string;
  contactRole?: string;
  address: string;
  postalCode: string;
  city: string;
  country: string;
  sirenSiret?: string;
  vatNumber?: string;
  email: string;
  phone: string;
}

export type DocumentType =
  | 'cahier_technique'
  | 'cahier_client'
  | 'bon_commande'
  | 'facture';

export type DocumentStatus = 'brouillon' | 'figé_validé';

export interface GeneratedDocument {
  id: string;
  type: DocumentType;
  title: string;
  version: number;
  status: DocumentStatus;
  createdAt: string;
  updatedAt: string;
  referenceNumber: string;
  content: {
    meta: {
      projectId: string;
      projectTitle: string;
      clientName: string;
      author: string;
      date: string;
    };
    bodyHtml?: string;
    blockingErrors?: string[];
    structuredData: Record<string, unknown>;
  };
}

export interface WebConfiguration {
  id: string;
  projectId: string;
  projectTitle: string;
  prospectId?: string;
  clientName: string;
  projectType: WebProjectType;
  requirements: FramingRequirement[];
  selections: Record<string, ComponentSelection>;
  pricing: PricingParameters;
  delivery: DeliveryEstimation;
  clientLegal: ClientLegalProfile;
  documents: GeneratedDocument[];
  scopeExceedsStandardOffer?: {
    exceeds: boolean;
    reason?: string;
  };
  createdAt: string;
  updatedAt: string;
}
