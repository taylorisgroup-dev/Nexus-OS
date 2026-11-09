/**
 * NEXUS OS - Prospection Téléphonique Opérationnelle Interne
 * ADN : « THINK HUMAN, EXECUTE AI, EVOLVE HYBRID. »
 * Principe : « L’entreprise d’abord. La technologie ensuite. »
 *
 * Ce module constitue le poste de prospection téléphonique interne
 * pour les branches de NEXUS Premium Solutions (Consulting, Digital, Academy, QVT...).
 * Le produit client « NEXUS Customer & Sales Pilot » demeure un produit distinct.
 */

export type CallResult =
  | 'Rendez-vous pris'
  | 'Échange constructif'
  | 'Rappel planifié'
  | 'Barrage secrétaire'
  | 'Injoignable / Messagerie'
  | 'Pas de besoin actuel'
  | 'Refus catégorique'
  | 'Numéro erroné';

export const CALL_RESULTS: { id: CallResult; label: string; color: string; isContacted: boolean; isQualified: boolean; isAppointment: boolean }[] = [
  { id: 'Rendez-vous pris', label: 'Rendez-vous pris (Cadrage / Démo)', color: 'bg-emerald-950/80 text-emerald-300 border-emerald-800', isContacted: true, isQualified: true, isAppointment: true },
  { id: 'Échange constructif', label: 'Échange constructif (Intérêt confirmé)', color: 'bg-blue-950/80 text-blue-300 border-blue-800', isContacted: true, isQualified: true, isAppointment: false },
  { id: 'Rappel planifié', label: 'Rappel planifié (Date demandée)', color: 'bg-cyan-950/80 text-cyan-300 border-cyan-800', isContacted: true, isQualified: false, isAppointment: false },
  { id: 'Barrage secrétaire', label: 'Barrage assistanat / Filtre', color: 'bg-amber-950/80 text-amber-300 border-amber-800', isContacted: false, isQualified: false, isAppointment: false },
  { id: 'Injoignable / Messagerie', label: 'Injoignable / Messagerie vocale', color: 'bg-neutral-800 text-neutral-300 border-neutral-700', isContacted: false, isQualified: false, isAppointment: false },
  { id: 'Pas de besoin actuel', label: 'Pas de besoin actuel (Poli)', color: 'bg-neutral-800 text-neutral-400 border-neutral-700', isContacted: true, isQualified: false, isAppointment: false },
  { id: 'Refus catégorique', label: 'Refus catégorique / Pas d’accord', color: 'bg-red-950/80 text-red-300 border-red-800', isContacted: true, isQualified: false, isAppointment: false },
  { id: 'Numéro erroné', label: 'Numéro erroné / Invalide', color: 'bg-neutral-900 text-neutral-500 border-neutral-800', isContacted: false, isQualified: false, isAppointment: false },
];

export type ObjectionCategory =
  | 'Prix'
  | 'Temps'
  | 'Prestataire en place'
  | 'Pas le décideur'
  | 'Envoyez un email'
  | 'Pas de besoin'
  | 'Autre';

export interface ObjectionItem {
  id: string;
  title: string;
  category: ObjectionCategory;
  comprendre: string;
  repondre: string;
  rebondir: string;
  preuves: string[];
  erreursAEviter: string[];
  prochaineAction: string;
}

export interface ConversationStep {
  id: string;
  stepNumber: number;
  name: string;
  goal: string;
  possibleQuestions: string[];
  usableProofs: string[];
  conclusionTriggers: string[];
  tips: string;
}

export interface InternalPhoningCampaign {
  id: string;
  name: string;
  objective: string;
  branchId: string;
  offerId?: string;
  targetSector?: string;
  location?: string;
  targetCount?: number;
  targetAudience: string;
  startDate?: string;
  endDate?: string;
  status: 'Active' | 'Cadrage' | 'En pause' | 'Terminée';
  steps: ConversationStep[];
  objections: ObjectionItem[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Liste par défaut des campagnes internes : vide pour démarrer sans donnée factice.
 */
export const DEFAULT_INTERNAL_CAMPAIGNS: InternalPhoningCampaign[] = [];

/**
 * Modèles prêts à l’emploi que l'utilisateur peut choisir d'appliquer lors de la création d'une campagne.
 */
export const CAMPAIGN_TEMPLATES: InternalPhoningCampaign[] = [
  {
    id: 'camp_consulting_audit',
    name: 'Cadrage Stratégique & Audit des Flux Métiers',
    objective: 'Détecter les goulots d’étranglement organisationnels et convenir d’un diagnostic initial de 45 minutes.',
    branchId: 'branch_consulting',
    offerId: '',
    targetAudience: 'Dirigeants de PME, directeurs des opérations, industriels et prestataires de services B2B (20 à 250 salariés).',
    startDate: '2026-02-01',
    endDate: '2026-12-31',
    status: 'Active',
    steps: [
      {
        id: 'step_cons_1',
        stepNumber: 1,
        name: 'Accroche & Respect du Temps',
        goal: 'Établir une connexion respectueuse sans agressivité commerciale et valider 2 minutes d’attention.',
        possibleQuestions: [
          'Bonjour [Nom], je vous contacte au sujet de l’organisation de vos flux opérationnels chez [Entreprise]. Avez-vous deux minutes ou préférez-vous convenir d’un moment plus propice ?',
          'En observant le développement de [Entreprise], nous accompagnons des dirigeants sur l’arbitrage entre charge humaine et automatisation. Est-ce un sujet d’actualité sur votre bureau ?',
        ],
        usableProofs: [
          'Interventions menées auprès d’entreprises régionales en phase de pivot.',
          'Méthodologie NEXUS : « L’humain d’abord. La technologie ensuite. »',
        ],
        conclusionTriggers: [
          'L’interlocuteur confirme avoir 2 minutes ou mentionne une surcharge actuelle.',
        ],
        tips: 'Parler calmement, posé, ton de confrère dirigeant plutôt que de vendeur agressif.',
      },
      {
        id: 'step_cons_2',
        stepNumber: 2,
        name: 'Découverte des Irritants Opérationnels',
        goal: 'Identifier un point de friction réel : ressaisies manuelles, dispersion des priorités ou dépendances critiques.',
        possibleQuestions: [
          'Sur quel volet vos équipes perdent-elles le plus de temps utile aujourd’hui ? La coordination interne, la relance ou le reporting ?',
          'Avez-vous le sentiment que vos outils actuels soutiennent vos décisions ou qu’ils vous imposent des contraintes supplémentaires ?',
        ],
        usableProofs: [
          'Cas vécus où 30% du temps d’encadrement était absorbé par la réconciliation de fichiers disparates.',
        ],
        conclusionTriggers: [
          'Le prospect cite un irritant précis (« notre ERP est rigide », « on perd du temps sur les suivis »).',
        ],
        tips: 'Écoute active : reformuler les mots exacts du prospect avant d’avancer.',
      },
      {
        id: 'step_cons_3',
        stepNumber: 3,
        name: 'Proposition de Valeur & Cadrage',
        goal: 'Proposer un diagnostic d’ingénierie d’affaires sans engagement commercial direct.',
        possibleQuestions: [
          'Nous ne vendons pas de logiciel sur étagère. Notre rôle est de poser un diagnostic des flux pour sécuriser votre organisation. Seriez-vous ouvert à une session de 45 minutes pour auditer ce point précis ?',
        ],
        usableProofs: [
          'Rapport de diagnostic synthétique remis à l’issue de la session.',
        ],
        conclusionTriggers: [
          '« Pourquoi pas », « Comment cela se déroule-t-il concrètement ? »',
        ],
        tips: 'Mettre en avant l’absence totale d’obligation d’achat.',
      },
      {
        id: 'step_cons_4',
        stepNumber: 4,
        name: 'Fixation du Rendez-vous de Cadrage',
        goal: 'Bloquer une date et un créneau ferme dans les 10 jours.',
        possibleQuestions: [
          'Avez-vous votre agenda sous les yeux ? Seriez-vous plus disponible en début de semaine prochaine, mardi matin ou jeudi après-midi ?',
        ],
        usableProofs: [
          'Lien de confirmation direct avec invitation d’agenda.',
        ],
        conclusionTriggers: [
          'Validation d’une date et d’une heure précises.',
        ],
        tips: 'Toujours proposer deux options fermes plutôt qu’une question ouverte.',
      },
    ],
    objections: [
      {
        id: 'obj_cons_1',
        title: '« Nous n’avons pas le temps en ce moment »',
        category: 'Temps',
        comprendre: 'Le dirigeant est sous l’eau ou utilise le manque de temps comme bouclier protecteur.',
        repondre: 'Je comprends parfaitement, et c’est précisément lorsque le temps manque que les processus méritent d’être allégés.',
        rebondir: 'Est-ce une question de surcharge ponctuelle liée à un projet en cours, ou un état récurrent depuis plusieurs mois ?',
        preuves: ['Nos audits de cadrage durent seulement 45 minutes et font gagner plusieurs heures hebdomadaires dès le mois suivant.'],
        erreursAEviter: ['Insister lourdement sur la disponibilité immédiate', 'Minimiser sa charge de travail'],
        prochaineAction: 'Proposer un créneau à +2 semaines tôt le matin ou caler un rappel convenu.',
      },
      {
        id: 'obj_cons_2',
        title: '« Nous travaillons déjà avec un cabinet de conseil »',
        category: 'Prestataire en place',
        comprendre: 'Fidélité établie ou simple refus poli. Ne surtout pas dénigrer le confrère.',
        repondre: 'C’est une excellente démarche, cela prouve que vous accordez une vraie importance à la structuration de votre entreprise.',
        rebondir: 'Votre cabinet actuel vous accompagne-t-il sur la passerelle concrète entre vos processus humains et vos outils numériques, ou plutôt sur le volet juridique/fiscal ?',
        preuves: ['NEXUS se positionne en passerelle hybride opérationnelle, souvent en complémentarité avec l’expert-comptable ou l’avocat.'],
        erreursAEviter: ['Critiquer leur prestataire', 'Prétendre faire exactement la même chose'],
        prochaineAction: 'Proposer un point d’échange de cadrage croisé sans remettre en cause leur relation existante.',
      },
      {
        id: 'obj_cons_3',
        title: '« Envoyez-moi une plaquette ou un mail »',
        category: 'Envoyez un email',
        comprendre: 'Tentative classique d’évacuer l’appel ou demande sincère d’éléments avant de décider.',
        repondre: 'Je peux tout à fait vous transmettre un document de synthèse. Mais pour qu’il soit réellement pertinent pour [Entreprise] et ne finisse pas dans vos spams...',
        rebondir: '...quel est le défi prioritaire sur lequel vous aimeriez que j’oriente les exemples : la fluidification des flux ou la réduction de la charge mentale des équipes ?',
        preuves: ['Étude de cas personnalisée selon le secteur.'],
        erreursAEviter: ['Accepter l’envoi aveugle sans question en raccrochant immédiatement.'],
        prochaineAction: 'Noter le focus demandé, envoyer le document ciblé et caler la relance à date ferme.',
      },
      {
        id: 'obj_cons_4',
        title: '« Combien coûtent vos interventions ? »',
        category: 'Prix',
        comprendre: 'Souci budgétaire légitime ou tentative de cadrer le périmètre économique.',
        repondre: 'Nos diagnostics initiaux de 45 minutes sont offerts dans le cadre de notre découverte mutuelle. Ensuite, nos forfaits d’intervention démarrent uniquement si un retour sur investissement tangible est identifié.',
        rebondir: 'Quel ordre de grandeur de gains opérationnels justifierait pour vous un accompagnement externe ?',
        preuves: ['Transparence tarifaire intégrale : pas de facturation au temps passé non borné.'],
        erreursAEviter: ['Donner un tarif au hasard sans connaître le périmètre', 'Éluder complètement la question.'],
        prochaineAction: 'Confirmer le diagnostic gratuit pour dimensionner l’éventuelle suite.',
      },
    ],
    createdAt: '2026-02-01T00:00:00.000Z',
    updatedAt: '2026-02-01T00:00:00.000Z',
  },
  {
    id: 'camp_digital_configurator',
    name: 'Modernisation Applicative & Configurateur Web',
    objective: 'Identifier les entreprises ayant des outils web obsolètes ou des besoins d’espaces clients sécurisés.',
    branchId: 'branch_digital',
    offerId: '',
    targetAudience: 'Directeurs généraux, directeurs techniques et directeurs marketing de PME/ETI en transition digitale.',
    startDate: '2026-02-01',
    endDate: '2026-12-31',
    status: 'Active',
    steps: [
      {
        id: 'step_dig_1',
        stepNumber: 1,
        name: 'Accroche Métier & Architecture',
        goal: 'Positionner NEXUS Digital comme ingénieur de solutions sur mesure, loin des agences de communication généralistes.',
        possibleQuestions: [
          'Bonjour [Nom], chez NEXUS Digital nous aidons les PME à transformer leurs outils web en leviers de productivité interne et de conversion client. Disposez-vous de quelques instants ?',
        ],
        usableProofs: [
          'Architecture sécurisée Firestore / Cloud, configurateur déterministe en 24 points.',
          'Génération documentaire contractuelle automatisée.',
        ],
        conclusionTriggers: ['Écoute favorable sur le besoin d’outils professionnels.'],
        tips: 'Parler de ROI, de sécurité et d’efficacité, pas de jargon technique abstrait.',
      },
      {
        id: 'step_dig_2',
        stepNumber: 2,
        name: 'Diagnostic de l’Existant Numérique',
        goal: 'Évaluer la maturité et les frustrations actuelles (site vitrine statique, portail client absent, devis manuels).',
        possibleQuestions: [
          'Votre portail actuel permet-il à vos clients d’interagir directement ou passez-vous encore par des échanges d’emails et des formulaires manuels ?',
          'Avez-vous des projets de refonte ou de création d’espace applicatif prévus cette année ?',
        ],
        usableProofs: ['Démonstrateur de configurateur interactif prêt à l’emploi.'],
        conclusionTriggers: ['Frustration exprimée sur les délais des prestataires précédents.'],
        tips: 'Valoriser les délais de livraison stricts de NEXUS Digital (1-2 sem. vitrine, 3-4 sem. portail).',
      },
      {
        id: 'step_dig_3',
        stepNumber: 3,
        name: 'Proposition de Démonstration Personnalisée',
        goal: 'Convenir d’une session de démonstration du configurateur et de la méthode de chiffrage transparent.',
        possibleQuestions: [
          'Plutôt que des promesses, nous pouvons modéliser votre besoin en direct dans notre configurateur en 30 minutes. Seriez-vous disponible cette semaine ?',
        ],
        usableProofs: ['Chiffrage déterministe avec calcul instantané des charges et calendrier ferme.'],
        conclusionTriggers: ['Accord pour voir la démonstration.'],
        tips: 'Souligner que le cahier des charges et la proposition sont générés en direct.',
      },
    ],
    objections: [
      {
        id: 'obj_dig_1',
        title: '« Notre site fonctionne très bien ainsi »',
        category: 'Pas de besoin',
        comprendre: 'Le prospect pense au site vitrine basique et ne voit pas le potentiel d’un outil métier.',
        repondre: 'C’est parfait s’il remplit son rôle de vitrine. Nous n’intervenons d’ailleurs pas pour refaire de la cosmétique graphique inutile.',
        rebondir: 'Votre plateforme intègre-t-elle aujourd’hui des interactions connectées (devis instantané, espace client, portail partenaires) ?',
        preuves: ['Exemples de portails qui automatisent 70% des échanges administratifs.'],
        erreursAEviter: ['Critiquer le graphisme de leur site existant.'],
        prochaineAction: 'Proposer un benchmark d’usage de leur secteur.',
      },
      {
        id: 'obj_dig_2',
        title: '« Les projets informatiques coûtent trop cher et dérivent toujours »',
        category: 'Prix',
        comprendre: 'Mauvaise expérience passée avec une agence ou des développeurs qui ont dépassé les budgets et délais.',
        repondre: 'Votre méfiance est tout à fait légitime, c’est exactement le constat qui a présidé à la création de NEXUS Digital.',
        rebondir: 'Saviez-vous que notre configurateur verrouille contractuellement les délais et les fonctionnalités avant même le démarrage ?',
        preuves: ['Engagements de délais stricts : 1 à 2 semaines pour un site vitrine, 3 à 4 semaines pour un portail institutionnel.'],
        erreursAEviter: ['Minimiser les dérives passées subies par le prospect.'],
        prochaineAction: 'Montrer la matrice de validation déterministe en démo de 20 minutes.',
      },
    ],
    createdAt: '2026-02-01T00:00:00.000Z',
    updatedAt: '2026-02-01T00:00:00.000Z',
  },
  {
    id: 'camp_academy_formation',
    name: 'Transmission & Ateliers Hybrides Dirigeants',
    objective: 'Proposer les ateliers NEXUS Academy de montée en niveau sur la synergie humain / technologie.',
    branchId: 'branch_academy',
    offerId: '',
    targetAudience: 'Directions générales, directions des ressources humaines et managers opérationnels.',
    startDate: '2026-02-01',
    endDate: '2026-12-31',
    status: 'Cadrage',
    steps: [
      {
        id: 'step_acad_1',
        stepNumber: 1,
        name: 'Prise de Contact & Sensibilisation',
        goal: 'Sonder l’appétence des équipes dirigeantes pour l’acculturation technologique pragmatique.',
        possibleQuestions: [
          'Bonjour [Nom], nous organisons des sessions exécutives pour aider les managers à s’approprier les outils hybrides sans subir l’effet de mode. Comment vos équipes appréhendent-elles cette transition ?',
        ],
        usableProofs: ['Programmes courts axés cas pratiques concrets d’entreprise.'],
        conclusionTriggers: ['Intérêt pour la formation des cadres et chefs d’équipe.'],
        tips: 'Éviter le vocabulaire trop théorique ou futuriste.',
      },
    ],
    objections: [
      {
        id: 'obj_acad_1',
        title: '« Nous formons déjà nos salariés en interne »',
        category: 'Prestataire en place',
        comprendre: 'Dispositif existant ou OPCO déjà mobilisé.',
        repondre: 'C’est une force indéniable. Nos ateliers interviennent spécifiquement sur le niveau exécutif pour cadrer la posture des dirigeants.',
        rebondir: 'Vos managers disposent-ils d’un référentiel clair pour arbitrer ce qui relève de l’automatisation versus de la relation humaine ?',
        preuves: ['Programme de masterclass exécutive en 4 modules.'],
        erreursAEviter: ['Vouloir remplacer les formations techniques de base.'],
        prochaineAction: 'Partager le syllabus synthétique des ateliers.',
      },
    ],
    createdAt: '2026-02-01T00:00:00.000Z',
    updatedAt: '2026-02-01T00:00:00.000Z',
  },
  {
    id: 'camp_qvt_ergonomie',
    name: 'Diagnostic Ergonomie & Allègement de Charge Mentale',
    objective: 'Positionner la branche QVT sur la prévention de l’usure professionnelle en environnement hybride.',
    branchId: 'branch_qvt',
    offerId: '',
    targetAudience: 'Dirigeants, DRH, représentants du personnel et référents santé/QVT.',
    startDate: '2026-02-01',
    endDate: '2026-12-31',
    status: 'Cadrage',
    steps: [
      {
        id: 'step_qvt_1',
        stepNumber: 1,
        name: 'Éveil sur la Fatigue Numérique & les Processus',
        goal: 'Démontrer que la surcharge mentale provient souvent de mauvais processus opérationnels.',
        possibleQuestions: [
          'Bonjour [Nom], dans de nombreuses entreprises, la dispersion des canaux d’information crée une surcharge invisible pour les équipes. Constatez-vous ce phénomène chez [Entreprise] ?',
        ],
        usableProofs: ['Approche systémique NEXUS reliant processus et bien-être au travail.'],
        conclusionTriggers: ['Sensibilité de l’interlocuteur aux enjeux de rétention et climat social.'],
        tips: 'Poste d’écoute bienveillante, ton chaleureux et professionnel.',
      },
    ],
    objections: [
      {
        id: 'obj_qvt_1',
        title: '« La QVT n’est pas notre priorité budgétaire cette année »',
        category: 'Prix',
        comprendre: 'Vision de la QVT comme une dépense gadget (babyfoot, cours de yoga) plutôt qu’un levier de performance.',
        repondre: 'Nous partageons entièrement votre avis si la QVT est traitée comme un gadget. Notre approche cible l’élimination des frictions dans les tâches quotidiennes qui coûtent directement de la rentabilité.',
        rebondir: 'Combien coûte à votre entreprise le turnover ou l’absentéisme sur vos postes clés ?',
        preuves: ['Corrélation directe entre clarté des flux et baisse de l’absentéisme.'],
        erreursAEviter: ['Parler de bien-être abstrait sans lien avec le résultat d’exploitation.'],
        prochaineAction: 'Proposer la grille d’auto-évaluation de charge opérationnelle.',
      },
    ],
    createdAt: '2026-02-01T00:00:00.000Z',
    updatedAt: '2026-02-01T00:00:00.000Z',
  },
];
