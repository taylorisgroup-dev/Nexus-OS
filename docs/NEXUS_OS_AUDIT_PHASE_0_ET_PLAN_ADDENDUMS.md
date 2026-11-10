# NEXUS OS — AUDIT TECHNIQUE COMPLET ET PLAN D'INTÉGRATION DES 3 ADDENDUMS

**Version :** 1.0 — Phase 0  
**Date :** 10 novembre 2026  
**Projet :** NEXUS OS — Plateforme d'Ingénierie Commerciale et d'Acquisition B2B  
**Entreprise :** NEXUS Premium Solutions  
**Statut :** Livrable de cadrage architectural et d'audit préalable à la refactorisation  

---

# 1. ARCHITECTURE ACTUELLE DE LA CODEBASE

L'analyse exhaustive de l'ensemble des 54 fichiers sources du dépôt (`/src`, `/server.ts`, `/package.json`, `/supabase/`) met en lumière une codebase en cours de transition architecturale :

* **Pile Runtime & Bundler :** React 19.0.1, Vite 8.3.0, TypeScript 7.0.2, Tailwind CSS v4.3.3, Node.js + Express 4.21.2 (`server.ts`) **[CONFIRMÉ PAR LE CODE : package.json]**.
* **Coexistence Hybride de Deux Systèmes de Données :**
  1. *L'ancien socle NoSQL Firebase Firestore (`src/lib/firebase.ts`, `src/context/DataContext.tsx`) :* Encore utilisé par les anciens composants (`PhoningStationView.tsx`, `ProspectsView.tsx`, `ConfiguratorView.tsx`), stockant des prospects, campagnes et règles d'alertes via des listeners temps réel non paginés `onSnapshot`.
  2. *Le nouveau socle relationnel PostgreSQL / Supabase (`supabase/migrations/20261109000000_nexus_os_core_schema.sql`, `src/services/supabase/client.ts`, `src/services/crm/crmService.ts`) :* 27 tables SQL normalisées avec RLS, index et un adaptateur local résilient pour le développement hors-connexion.
* **Serveur Backend Express (`server.ts`) :**
  * Rate-limiting activé via `express-rate-limit` (120 req/15min API, 40 req/15min IA).
  * Route réelle `/api/nexus-data/search-companies` connectée à l'API officielle Recherche d'entreprises (INSEE / SIRENE) avec Zod schema.
  * Route d'audit web `/api/nexus-data/enrich-website` extrayant le HTML réel avant synthèse Gemini.
  * Route de statut `/api/outlook/status`.

---

# 2. INVENTAIRE DES MODULES ET ÉCRANS EXISTANTS

| Module | Fichier source principal | Rôle fonctionnel | État technique constaté |
| :--- | :--- | :--- | :--- |
| **Cockpit Central** | `src/components/cockpit/ExecutiveCockpitView.tsx` & `CockpitView.tsx` | Tableau de bord décisionnel, alertes relances, KPIs | **Partiel / Doublon** : Coexistence de l'ancien `CockpitView.tsx` (basé sur `DataContext`) et du nouveau `ExecutiveCockpitView.tsx`. |
| **NEXUS DATA (Acquisition)** | `src/components/acquisition/NexusDataAcquisitionView.tsx` | Recherche d'entreprises réelles via SIRENE gouv, audit web, import CRM | **Opérationnel** : Recherche certifiée, zéro hallucination, import contrôlé. |
| **Lead Scraper (Legacy)** | `src/components/acquisition/LeadScraperView.tsx` | Ancien formulaire de scraping par prompt Gemini | **À déprécier / Remplacé** par NEXUS DATA. |
| **Poste Phoning (Ancien)** | `src/components/phoning/PhoningStationView.tsx` | Poste d'appel téléphonique, scripts, objections | **Monolithe de 1983 lignes** dépendant de `DataContext.tsx` et Firestore. |
| **Prospection Terrain** | `src/components/field/FieldProspectingView.tsx` | Gestion des tournées, arrêts géocodés, comptes rendus | **Prototype initial** : Manque le mode hors-connexion robuste et la carte dynamique Leaflet interactive. |
| **Emailing Commercial** | `src/components/email/EmailProspectingView.tsx` | Envoi d'emails commerciaux et templates de cadrage | **Opérationnel localement** : Liaison Microsoft Graph prête. |
| **Campagnes Commerciales** | `src/components/campaigns/CampaignsView.tsx` | Liste et configuration des campagnes | **Incomplet** : Stocke encore les campagnes dans `DataContext` au lieu de la table SQL `campaigns`. |
| **Fichier Prospects CRM** | `src/components/prospects/ProspectsView.tsx` | Base CRM, filtres, kanban, fiches prospects | **Partiel** : Lié à Firestore, nécessite bascule vers `crmService` unifié. |
| **Automatisations (Ancien)** | `src/components/automations/AutomationsView.tsx` | Détection basique en mémoire (tâches en retard, prospects gagnés) | **Non conforme à l'Addendum 1** : N'est pas un Workflow Engine, aucun éditeur visuel de blocs, aucune file d'attente persistante. |
| **Configurateur Web 24pts** | `src/components/configurator/*` | Chiffrage de devis et documents légaux NEXUS Digital | **Opérationnel métier**, à préserver tel quel pour la branche digitale. |
| **Offres & Projets** | `src/components/offers/OffersView.tsx`, `ProjectsView.tsx` | Catalogue de services et suivi des livrables | **Opérationnel**, à basculer sur le schéma unifié. |
| **Tâches & Relances** | `src/components/tasks/TasksView.tsx` | Todo-list des actions commerciales | **Opérationnel**, à relier à la planification centrale. |

---

# 3. ANALYSE CRITIQUE AU REGARD DES 3 ADDENDUMS

### 3.1 Déficits par rapport à l'Addendum 1 (NEXUS WORKFLOW ENGINE)
* **[CONFIRMÉ PAR LE CODE : `src/components/automations/AutomationsView.tsx`]** : Le composant actuel propose seulement 3 déclencheurs codés en dur (`task_overdue`, `prospect_won`, `period_end`) exécutés dans le navigateur via un simple `setInterval` ou au clic.
* **Absence d'éditeur visuel de blocs :** Il n'existe actuellement aucun canvas de graphe de nœuds (déclencheurs -> conditions -> actions), aucun système de liaisons (edges), ni paramétrage modulaire.
* **Absence d'infrastructure d'exécution côté serveur :** Aucun ordonnanceur persistant (Queue), aucune gestion d'idempotence, aucune politique de tentatives automatiques (retry exponential backoff) en base de données.
* **Absence des tables de Workflow dans le schéma SQL :** Les tables `workflows`, `workflow_nodes`, `workflow_edges`, `workflow_executions`, `workflow_execution_logs` n'ont pas encore été créées.

### 3.2 Déficits par rapport à l'Addendum 2 (Interconnexion Globale & CALL DESK)
* **[CONFIRMÉ PAR LE CODE : `src/components/phoning/PhoningStationView.tsx`]** : Le poste de phoning actuel fait 1983 lignes. Il lit et écrit dans `DataContext.tsx` via Firestore.
* **Rupture de continuité de flux :** L'enchaînement exigé (*Campagne -> Acquisition -> NEXUS DATA -> Validation -> CRM -> Attribution -> CALL DESK -> Résultat -> Relance -> Outlook Sync*) est morcelé entre deux couches de données distinctes (Firestore d'un côté, LocalStore/Supabase de l'autre).
* **Absence de gestion de sessions d'appels :** Pas d'entité `phoning_sessions` permettant de mesurer la durée d'une session, le nombre d'appels effectifs par heure, le temps moyen par communication et les taux de concrétisation par session.

### 3.3 Déficits par rapport à l'Addendum 3 (NEXUS FIELD)
* **[CONFIRMÉ PAR LE CODE : `src/components/field/FieldProspectingView.tsx`]** : Bien qu'un premier composant fonctionnel existe, il lui manque :
  1. La carte interactive intégrée (Leaflet / OpenStreetMap) avec regroupement (clustering) par quartier/code postal et pastilles de statut couleur.
  2. La gestion des sessions terrain structurées (`field_sessions` avec statuts `planned`, `ready`, `in_progress`, `suspended`, `completed`).
  3. L'architecture hors-connexion (Offline-first) : Cache local sécurisé permettant de charger une tournée en zone blanche et de synchroniser les comptes rendus de visite en différé au retour du réseau.

---

# 4. ANALYSE DU MODÈLE DE DONNÉES & TABLES NÉCESSAIRES

Pour supporter intégralement les 3 addendums, le schéma SQL doit être complété par une migration d'extension (`20261110000000_nexus_os_addendums_engine.sql`) créant :

### Nouvelles tables pour le Workflow Engine (Addendum 1) :
1. `workflow_definitions` : Définition des workflows (nom, déclencheur, statut `draft` | `active` | `paused`, version, catégorie).
2. `workflow_nodes` : Nœuds du workflow (type de bloc, coordonnées x/y, configuration JSON, entrées/sorties).
3. `workflow_edges` : Connexions entre les blocs (source_node_id, target_node_id, condition_handle).
4. `workflow_executions` : Historique des runs (statut `running` | `completed` | `failed` | `paused`, déclencheur, contexte d'entrée, horodatage, durée).
5. `workflow_execution_steps` : Détail de l'exécution bloc par bloc (entrée, sortie, statut, log d'erreur, durée ms, tentative n°).
6. `workflow_queue_jobs` : File d'attente persistante pour les tâches asynchrones planifiées (exécution différée, dédoublonnage, clé d'idempotence).

### Nouvelles tables pour le Call Desk & la Planification (Addendum 2) :
1. `call_sessions` : Sessions de phoning opérateur (date début, date fin, appels passés, contacts argumentés, RDV pris, statut).
2. `prospect_assignments` : Règles et historique d'attribution des prospects aux agents commerciaux.

### Nouvelles tables pour NEXUS FIELD (Addendum 3) :
1. `field_sessions` : Sessions de prospection physique sur le terrain (secteur, statut, date, tournée rattachée, distance estimée).
2. `field_offline_sync_queue` : File d'attente de synchronisation locale pour les visites enregistrées hors connexion.

---

# 5. PLAN DE RESTRUCTURATION DU CODE (RÉDUCTION DE LA DETTE TECHNIQUE)

Pour transformer NEXUS OS en système unifié et maintenable sans régressions :

1. **Décomposition du monolithe `PhoningStationView.tsx` (1983 lignes) :**
   * Remplacer par un module modulaire `src/modules/call-desk/` :
     * `CallDeskView.tsx` : Vue principale coordonnant la session active.
     * `CallQueuePanel.tsx` : File d'attente concentrée avec filtres prioritaires.
     * `ProspectCardConcentrated.tsx` : Fiche synthétique du prospect avec numérotation `tel:` en 1 clic.
     * `ConversationGuide.tsx` : Guide d'appel par étape dynamique.
     * `ObjectionAccordion.tsx` : Bibliothèque d'objections instantanée.
     * `CallOutcomeForm.tsx` : Formulaire de qualification en 2 clics générant la tâche de relance et l'événement de workflow.
2. **Construction de l'éditeur visuel `src/modules/workflow-engine/` :**
   * `WorkflowEngineView.tsx` : Vue d'ensemble avec supervision des runs et métriques réelles.
   * `WorkflowEditor.tsx` : Canvas visuel interactif permettant d'ajouter, déplacer et relier des blocs.
   * `WorkflowBlockPalette.tsx` : Bibliothèque des 18 blocs fonctionnels réels (Déclencheurs, Acquisition, Qualification, CALL DESK, FIELD, Outlook, Conditions, Relances).
   * `WorkflowExecutionHistory.tsx` : Journal de supervision des exécutions bloc par bloc avec replay et reprise sur erreur.
3. **Consolidation de `src/modules/field/` (NEXUS FIELD) :**
   * `FieldProspectingView.tsx` : Carte interactive Leaflet intégrée, filtres géographiques, sélection par polygone/rayon.
   * `TourPlanner.tsx` : Ordonnancement de la tournée et calcul d'itinéraire.
   * `FieldMobileVisitDrawer.tsx` : Fiche d'intervention mobile avec GPS et compte rendu en un clic.
   * `OfflineSyncBanner.tsx` : Indicateur visuel d'état de synchronisation (en ligne / hors-ligne / en attente de sync).
4. **Unification des flux de données :**
   * Déconnexion progressive de `DataContext.tsx` au profit de `crmService`, `nexusDataService`, `workflowService`, `phoningService`, et `fieldService`, partageant tous le même schéma PostgreSQL Supabase.

---

# 6. PLAN D'EXÉCUTION PAR PHASES SUCCESSIVES

* **PHASE 0 (Livrable actuel) :** Audit technique exhaustif, matrice d'incompatibilités et dossier d'architecture.
* **PHASE 1 :** Architecture cible détaillée et migration SQL des tables d'addendums (`20261110000000_nexus_os_addendums_engine.sql`).
* **PHASE 2 :** Socle technique unifié (Services partagés, bus d'événements interne, fin du double stockage).
* **PHASE 3 :** Intégration du **NEXUS WORKFLOW ENGINE** (Éditeur visuel de blocs, moteur d'exécution local/serveur, persistance, supervision).
* **PHASE 4 :** Reconstruction de **NEXUS CALL DESK** & Interconnexion CRM (Pipeline continu, scripts, objections, RDV Outlook).
* **PHASE 5 :** Intégration de **NEXUS FIELD** (Cartographie Leaflet, tournées ordonnées, fiches mobiles, synchronisation hors ligne).
* **PHASE 6 :** Interconnexion globale des modules (Vérification du parcours commercial de bout en bout).
* **PHASE 7 :** Tests d'intégration et validation des 4 parcours critiques (A : Phoning, B : Terrain, C : Workflow, D : Interconnexion).
* **PHASE 8 :** Livraison finale, documentation et synchronisation GitHub.

---
*Ce document d'audit constitue la validation formelle de la Phase 0 exigée par le Master Prompt.*
