/**
 * NEXUS OS - Branches & Gouvernance
 * ADN : « THINK HUMAN, EXECUTE AI, EVOLVE HYBRID. »
 * Principe : « L’entreprise d’abord. La technologie ensuite. »
 */

export type BranchMaturity =
  | 'Idée'
  | 'Cadrage'
  | 'En cours'
  | 'Actif'
  | 'En pause';

export const BRANCH_MATURITIES: BranchMaturity[] = [
  'Idée',
  'Cadrage',
  'En cours',
  'Actif',
  'En pause',
];

export interface Branch {
  id: string;
  name: string;
  code: string;
  description: string;
  maturity: BranchMaturity;
  responsible?: string;
  priorities: string[];
  color?: string;
  isCustom?: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Branches par défaut de NEXUS Premium Solutions.
 * Conformément aux directives de direction :
 * AUCUNE branche n'est déclarée "Actif" par défaut sans justification validée.
 */
export const DEFAULT_BRANCHES: Branch[] = [
  {
    id: 'branch_consulting',
    name: 'Consulting',
    code: 'CONS',
    description: 'Conseil stratégique, audit organisationnel, ingénierie d’affaires et accompagnement des dirigeants.',
    maturity: 'Cadrage', // Non actif par défaut
    responsible: 'Direction Générale',
    priorities: [
      'Structuration des méthodologies de cadrage stratégique',
      'Définition du modèle d’intervention B2B',
    ],
    color: '#0879E8', // Bleu signature NEXUS
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'branch_digital',
    name: 'Digital',
    code: 'DIGI',
    description: 'Ingénierie web, configurateur de solutions numériques, architectures sécurisées et prospective produits.',
    maturity: 'Cadrage', // Non actif par défaut
    responsible: 'Ingénierie & Systèmes',
    priorities: [
      'Gouvernance du Configurateur Web & Documents',
      'Cadrage du produit autonome NEXUS Customer & Sales Pilot',
    ],
    color: '#E3262E', // Rouge signature NEXUS
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'branch_academy',
    name: 'Academy',
    code: 'ACAD',
    description: 'Transmission de compétences, programmes de montée en niveau, formations exécutives et ateliers hybrides.',
    maturity: 'Idée',
    responsible: '',
    priorities: [
      'Recensement des besoins de formation des partenaires',
      'Élaboration d’un référentiel de compétences',
    ],
    color: '#10B981', // Émeraude sobre
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'branch_capital',
    name: 'Capital',
    code: 'CAP',
    description: 'Structuration patrimoniale, allocation d’actifs, investissements stratégiques et ingénierie financière.',
    maturity: 'Idée',
    responsible: '',
    priorities: [
      'Étude de faisabilité des véhicules d’investissement',
      'Veille réglementaire et financière',
    ],
    color: '#F59E0B', // Ambre doré
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'branch_qvt',
    name: 'QVT',
    code: 'QVT',
    description: 'Qualité de Vie au Travail, ergonomie organisationnelle, prévention de la charge mentale et synergie humaine.',
    maturity: 'Idée',
    responsible: '',
    priorities: [
      'Diagnostic des leviers d’équilibre en milieu professionnel hybride',
      'Conception d’indicateurs d’épanouissement au travail',
    ],
    color: '#8B5CF6', // Violet sobre
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'branch_brand_site',
    name: 'Marque / Site',
    code: 'BRAND',
    description: 'Identité de marque NEXUS Premium Solutions, portail vitrine institutionnel et supports de rayonnement.',
    maturity: 'Cadrage',
    responsible: 'Communication & Marque',
    priorities: [
      'Cohérence de l’identité visuelle graphite/rouge/bleu',
      'Mise à niveau de la documentation officielle',
    ],
    color: '#D9DCE2', // Argent titanium
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
];
