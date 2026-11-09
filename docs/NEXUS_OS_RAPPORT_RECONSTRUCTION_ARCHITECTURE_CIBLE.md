# NEXUS OS — RAPPORT DE RECONSTRUCTION ET ARCHITECTURE CIBLE

**Version :** 1.0 — 9 novembre 2026  
**Auteur :** Équipe d'Ingénierie & Architecture NEXUS OS  
**Client / Destinataire :** NEXUS Premium Solutions  
**Dépôt source audité :** `https://github.com/taylorisgroup-dev/Nexus-OS.git` (Branche `main`, Commit `06297f5`)  
**Statut :** Document de cadrage architectural et plan d'exécution directeur  

---

## CONVENTION DE QUALIFICATION DES INFORMATIONS

Pour garantir une rigueur méthodologique absolue conformément aux exigences du Master Prompt :
* **[CONFIRMÉ PAR LE CODE]** : Constat vérifié ligne par ligne dans les fichiers du dépôt actuel.
* **[DÉDUIT DE L'ARCHITECTURE]** : Conséquence technique mécanique directe de la structure actuelle.
* **[PROPOSITION TECHNIQUE]** : Solution d'ingénierie soumise pour la nouvelle architecture.
* **[DÉCISION REQUISE DU CRÉATEUR]** : Arbitrage métier ou d'infrastructure nécessitant un accord explicite.

---

# 1. ÉTAT RÉEL DU PROJET

L'audit approfondi des 61 fichiers synchronisés sur GitHub révèle une application React 19 / Express / Firebase fonctionnelle en surface, dotée d'une interface soignée reprenant les codes visuels officiels de NEXUS Premium Solutions (titane, bleu néon, rouge carmin, logo 3D métal ADN), mais reposant sur des fondations techniques fragiles, un stockage inadapté aux volumes industriels et des mécanismes de collecte en contradiction avec la règle de véracité des données.

### Synthèse de la cartographie réelle :
* **Environnement d'exécution :** Node.js / Express 4.21.2 + Vite 8.3 + React 19.0.1 + Tailwind CSS v4.3.3 **[CONFIRMÉ PAR LE CODE : package.json]**.
* **Persistance actuelle :** Firebase Firestore (NoSQL temps réel) via SDK Client Web 12.19.0 **[CONFIRMÉ PAR LE CODE : src/lib/firebase.ts]**.
* **Sécurité des données :** Règles `firestore.rules` verrouillées sur un seul compte propriétaire (`nexuspremiumsolutions@gmail.com`) avec validation stricte des schémas de documents **[CONFIRMÉ PAR LE CODE : firestore.rules]**.
* **Moteur Backend :** Fichier unique `server.ts` de 283 lignes servant à la fois les middlewares Vite et trois endpoints d'IA Gemini **[CONFIRMÉ PAR LE CODE : server.ts]**.
* **Modules visibles dans l'interface :**
  1. Cockpit Exécutif (KPIs, alertes, actions du jour).
  2. Acquisition de Leads / Scraping (Formulaire + appel Gemini).
  3. Campagnes de Phoning Interne (Gestionnaire de campagnes & scripts).
  4. Station de Phoning Concentré (Guide d'appel interactif, objections, saisie de compte-rendu).
  5. Base Prospects & Pipeline CRM (Tableau Kanban, archivage, export CSV/JSON).
  6. Configurateur NEXUS Digital (Devis, règles de tarification, fiches légales, génération de documents PDF/HTML).
  7. Offres & Projets (Suivi des livrables de prestation).
  8. Plan d'actions & Tâches (Gestionnaire todo avec dates d'échéance).
  9. Idées & Décisions Actées (Registre stratégique de gouvernance).
  10. Branches d'activités & Gouvernance (Répartition matricielle des offres).
  11. Centre d'Automatisations internes (Simulateur et déclenchement de règles).

---

# 2. LES FONCTIONNALITÉS EXISTANTES DÉTAILLÉES

### 2.1 Acquisition & Recherche de prospects (`src/components/acquisition/LeadScraperView.tsx`)
* **[CONFIRMÉ PAR LE CODE]** : L'interface permet de saisir un secteur d'activité, une localisation géographique et un nombre de prospects (entre 3 et 20).
* **[CONFIRMÉ PAR LE CODE]** : Deux modes sont proposés : le « scraping direct » et le « copier-coller de texte brut ».
* **[CONFIRMÉ PAR LE CODE]** : Les prospects retournés peuvent être sélectionnés puis injectés dans la collection `prospects` de Firestore en un clic.

### 2.2 Poste de prospection téléphonique (`src/components/phoning/PhoningStationView.tsx`)
* **[CONFIRMÉ PAR LE CODE]** : Écran de 1983 lignes intégrant une file d'attente de prospects filtrable (par campagne, branche, statut, urgence).
* **[CONFIRMÉ PAR LE CODE]** : Affichage d'un guide d'entretien commercial structuré en 5 étapes dynamiques (Accroche, Qualification, Présentation de la valeur, Traitement des objections, Conclusion / Prise de RDV).
* **[CONFIRMÉ PAR LE CODE]** : Annuaire interactif d'objections classées par catégories avec réponses pré-rédigées et contre-questions.
* **[CONFIRMÉ PAR LE CODE]** : Formulaire de qualification post-appel enregistrant le résultat, les notes, le statut suggéré, la date du prochain contact et créant automatiquement une tâche de relance liée.

### 2.3 CRM & Base Prospects (`src/components/prospects/ProspectsView.tsx`)
* **[CONFIRMÉ PAR LE CODE]** : Liste paginée/filtrable de prospects avec statuts : *À qualifier, À contacter, Contacté, Échange, Rendez-vous, Proposition envoyée, Gagné, Perdu, En attente*.
* **[CONFIRMÉ PAR LE CODE]** : Modal d'enrichissement IA appelant `/api/enrich-prospect` pour tenter d'extraire la maturité digitale, les dirigeants et les points de douleur.
* **[CONFIRMÉ PAR LE CODE]** : Enregistrement de l'historique des interactions dans la sous-collection Firestore `/prospects/{id}/interactions`.

### 2.4 Campagnes de prospection (`src/components/campaigns/CampaignsView.tsx`)
* **[CONFIRMÉ PAR LE CODE]** : Création et modification de campagnes commerciales avec ciblage de secteur, zone, volume et sélection d'un script d'appel et d'objections.
* **[CONFIRMÉ PAR LE CODE]** : Modale d'extraction directe de prospects rattachés immédiatement à la campagne choisie.

### 2.5 Configurateur Web & Moteur de Devis (`src/components/configurator/*`)
* **[CONFIRMÉ PAR LE CODE]** : Moteur de calcul budgétaire complet pour la branche NEXUS Digital (composants web, formules, maintenance récurrente, remises, calcul de marge).
* **[CONFIRMÉ PAR LE CODE]** : Générateur de documents contractuels (Lettre de cadrage, Proposition commerciale, Bon de commande avec mentions légales de l'entreprise et du client).

### 2.6 Automatisations Internes (`src/components/automations/AutomationsView.tsx`)
* **[CONFIRMÉ PAR LE CODE]** : Moteur de règles purement frontend évaluant les tâches en retard, les prospects gagnés sans projet rattaché et générant des alertes en mémoire et des journaux stockés dans Firestore.

---

# 3. LES FONCTIONNALITÉS À CONSERVER

Ces fonctionnalités sont mûres sur le plan métier, éprouvées dans leur logique ergonomique et doivent être conservées et réintégrées dans la nouvelle architecture :

1. **Le Poste de Phoning Ergonomique :** Le principe de file d'appels fluide, sans ouverture de modale perturbatrice pendant l'appel, avec script pas-à-pas et bibliothèque d'objections instantanée **[PROPOSITION TECHNIQUE : Recomposer en sous-composants légers connectés à Supabase]**.
2. **Le Référentiel des Objections & Réponses :** La matrice d'objections (Prix, Manque de temps, Déjà équipé, Envoi d'email de barrage, Décideur absent) est un actif commercial de grande valeur pour NEXUS **[CONFIRMÉ PAR LE CODE : src/types/phoning.ts]**.
3. **Le Moteur de Calcul & Génération Contractuelle NEXUS Digital :** La logique financière de chiffrage de projets digitaux et de cadrage 45 min est opérationnelle et distinctive **[CONFIRMÉ PAR LE CODE : src/lib/configuratorEngine.ts]**.
4. **L'Identité Visuelle Officielle 3D Métal & Thème Sombre :** La charte graphique (logo 3D métal avec brin d'ADN coloré, contrastes titane `#0d1117`, accents bleu néon `#2563eb` et rouge carmin `#dc2626`) est validée et confère à la plateforme son statut exécutif premium **[CONFIRMÉ PAR LE CODE : src/components/brand/*]**.
5. **Le Système d'Alertes et de Tâches Liées aux Résultats d'Appel :** La création systématique d'une tâche de relance horodatée lors d'un appel « À rappeler » ou « RDV obtenu » **[CONFIRMÉ PAR LE CODE : DataContext.tsx]**.

---

# 4. LES FONCTIONNALITÉS À RECONSTRUIRE

Ces modules répondent à un besoin métier réel mais leur implémentation technique actuelle est défaillante, incomplète ou non conforme aux exigences :

1. **Le Moteur d'Acquisition & Scraping (NEXUS DATA) :**
   * *Actuel :* Envoie un prompt à Gemini lui demandant « d'extraire des entreprises réelles de sa mémoire ».
   * *Cible :* Reconstruction complète avec requêtage d'API de données vérifiées (API INSEE / SIRENE pour les données légales et d'activité NAF/APE, API Google Places officielle ou Overpass / OpenStreetMap pour les coordonnées géographiques et de contact vérifiées). Gemini n'interviendra qu'en aval pour la normalisation, le parsing et le dédoublonnage.
2. **Le Système de Campagnes :**
   * *Actuel :* Stocké comme un tableau JSON unique dans un seul document Firestore (`settings/nexus_phoning_campaigns`). Aucun lien relationnel natif avec les prospects (simple champ string dénormalisé).
   * *Cible :* Table relationnelle PostgreSQL `campaigns` reliée par clés étrangères à `campaign_targets`, `campaign_leads` et `campaign_events`.
3. **Le Centre de Données CRM & Fiches Prospects :**
   * *Actuel :* Document Firestore unique par prospect mélangeant données de base, notes déstructurées et enrichissement IA.
   * *Cible :* Modèle relationnel scindé en `companies` (personnes morales), `contacts` (décideurs physiques avec téléphones directs et emails), `prospects` (opportunité commerciale active) et `interactions` (journal immuable).
4. **Le Cockpit Exécutif :**
   * *Actuel :* Calcule les KPIs en mémoire en filtrant les tableaux complets téléchargés côté client.
   * *Cible :* Vues SQL matérialisées ou requêtes d'agrégation PostgreSQL ultra-rapides (`COUNT`, `SUM`, fenêtrage temporel quotidien/hebdomadaire/mensuel).
5. **Le Système de Relances et de Planification :**
   * *Actuel :* Simple liste de tâches plates sans notion de créneau, de temps de communication ou de synchronisation d'agenda.
   * *Cible :* Calendrier structuré avec gestion de la capacité quotidienne d'appels et d'interventions terrain.

---

# 5. LES FONCTIONNALITÉS À ABANDONNER ET POURQUOI

1. **Le "Scraping par Hallucination LLM" sans source externe [CONFIRMÉ PAR LE CODE : server.ts lignes 30-84] :**
   * *Pourquoi :* Demander à un modèle de langage d'inventer ou de restituer de mémoire des numéros de téléphone et des emails sans grounding web en direct produit inévitablement des données fausses, des numéros inactifs ou des entreprises fictives, violant la règle 2.4 du Master Prompt.
2. **Le Stockage NoSQL Firestore Monolithique [CONFIRMÉ PAR LE CODE : firestore.rules, DataContext.tsx] :**
   * *Pourquoi :* Firestore impose une limite de 1 Mo par document, facture à la lecture/écriture par document sans possibilité de jointures SQL, et verrouille l'application dans une structure de sous-collections complexe. Il est remplacé à 100% par Supabase PostgreSQL.
3. **Le Stockage Global de Campagnes et de Branches dans `settings/*` [CONFIRMÉ PAR LE CODE : DataContext.tsx lignes 421-486] :**
   * *Pourquoi :* Antipattern majeur consistant à écraser l'ensemble des campagnes d'une entreprise à chaque mise à jour d'un statut. Remplacé par des tables PostgreSQL dédiées avec verrous d'intégrité transactionnels.
4. **Le Moteur d'Automatisations purement frontend dans React [CONFIRMÉ PAR LE CODE : DataContext.tsx lignes 971-1135] :**
   * *Pourquoi :* Les alertes et les calculs d'échéances ne s'exécutaient que si l'utilisateur gardait l'onglet du navigateur ouvert. Remplacé par des déclencheurs (Triggers) PostgreSQL et des Edge Functions ou cron jobs planifiés.

---

# 6. LES PROBLÈMES TECHNIQUES CONFIRMÉS

L'analyse du code source confirme formellement 6 dysfonctionnements majeurs :

1. **Absence totale de contrôle d'accès sur l'API Backend Express [CONFIRMÉ PAR LE CODE : server.ts lignes 19, 129, 204] :**
   * Les routes `/api/scrape-prospects`, `/api/enrich-prospect` et `/api/parse-pasted-prospects` ne vérifient aucun token Bearer, aucune session et aucune clé secrète. N'importe qui envoyant une requête HTTP POST sur ces routes peut exécuter des requêtes Gemini et épuiser les quotas.
2. **Absence de pagination sur la collection `prospects` [CONFIRMÉ PAR LE CODE : DataContext.tsx lignes 236-253] :**
   * Le hook `onSnapshot(collection(db, 'prospects'))` télécharge l'intégralité de la base de prospects dans la RAM du navigateur client. Avec 5 000 ou 10 000 prospects, l'application crashera par dépassement mémoire du navigateur mobile/desktop.
3. **Absence des modules Prospection Terrain et Emailing [CONFIRMÉ PAR LE CODE : src/components/*] :**
   * Bien que le phoning dispose d'une station dédiée, il n'existe actuellement aucun composant ni route pour la prospection physique sur le terrain (tournées géographiques, cartographie, visites) ni pour la prospection par email.
4. **Absence de l'intégration Microsoft Outlook / Graph [CONFIRMÉ PAR LE CODE : package.json, src/*] :**
   * Il n'y a actuellement aucun SDK `@microsoft/microsoft-graph-client`, aucun flux OAuth Azure AD et aucun service d'envoi ou de lecture de calendrier Microsoft 365.
5. **Limitation du parsing de texte brut à 8 000 caractères tronqués [CONFIRMÉ PAR LE CODE : server.ts ligne 215] :**
   * `rawText.slice(0, 8000)` coupe arbitrairement les fichiers CSV ou listes d'annuaires au milieu d'une ligne, générant des erreurs de parsing JSON.
6. **Mélange de logique métier et de rendu dans `PhoningStationView.tsx` (1983 lignes) et `DataContext.tsx` (1634 lignes) [CONFIRMÉ PAR LE CODE] :**
   * Deux fichiers concentrent à eux seuls plus de 3 600 lignes de code, causant des re-renders massifs à chaque frappe au clavier ou changement de filtre.

---

# 7. LES RISQUES DE SÉCURITÉ

1. **Fuite de quotas et Déni de Service (DoS) sur Gemini [CONFIRMÉ PAR LE CODE : server.ts] :**
   * Aucun rate-limiting (pas de `express-rate-limit`). Un script externe peut saturer l'API et générer des coûts ou un blocage API Google.
2. **Exposition des données d'enrichissement par injection de prompt [CONFIRMÉ PAR LE CODE : server.ts lignes 136-172] :**
   * Les variables transmises par le client (`company`, `website`) sont concaténées directement dans le prompt système sans échappement ni validation Zod stricte.
3. **Perte de traçabilité des modifications [DÉDUIT DE L'ARCHITECTURE] :**
   * En l'absence de table `audit_logs` relationnelle immuable, la suppression accidentelle ou la modification d'un prospect ou d'un compte rendu d'appel est définitive et non traçable.
4. **RGPD & Prospection commerciale B2B [DÉDUIT DE L'ARCHITECTURE] :**
   * Absence actuelle de gestion explicite de la liste d'opposition (opt-out / "Ne plus contacter" centralisé), de traçabilité de la date de collecte légale et de durée de rétention.

---

# 8. LES LIMITES DE L'ARCHITECTURE ACTUELLE

| Axe d'analyse | Architecture Actuelle (Firebase + Monolithe) | Limite opérationnelle constatée |
| :--- | :--- | :--- |
| **Modèle de données** | NoSQL orienté document non relationnel | Impossibilité de faire des requêtes analytiques croisées (ex: taux de conversion par secteur et par campagne) sans télécharger tous les documents. |
| **Scalabilité** | Écoute temps réel globale sans curseur | Dégradation exponentielle des performances dès 1 000 fiches prospects actives. |
| **Intégrité référentielle** | Gérée manuellement par code React | Si un prospect est supprimé, ses tâches et interactions orphelines subsistent dans Firestore. |
| **Gouvernance des accès** | Règle hardcodée sur une seule adresse Gmail | Impossibilité d'ajouter des collaborateurs, commerciaux ou superviseurs avec des droits restreints. |
| **Dépendance client** | Traitements et calculs exécutés dans le navigateur | Si le navigateur est fermé, aucune relance n'est planifiée, aucun email n'est traité. |

---

# 9. LE SCHÉMA FONCTIONNEL CIBLE

NEXUS OS est structuré en **7 grands piliers opérationnels interconnectés**, articulés autour d'une base relationnelle unique :

```
                          ┌──────────────────────────────────────────────┐
                          │         POSTE DE COMMANDEMENT EXÉCUTIF        │
                          │                    COCKPIT                   │
                          │   Indicateurs · Actions du jour · Relances   │
                          └──────────────────────┬───────────────────────┘
                                                 │
          ┌──────────────────────────────────────┼──────────────────────────────────────┐
          │                                      │                                      │
┌─────────▼─────────┐                 ┌──────────▼──────────┐                ┌──────────▼──────────┐
│    NEXUS DATA     │                 │   CRM CENTRAL &     │                │   PLANIFICATION     │
│   (Acquisition)   │                 │    OPPORTUNITÉS     │                │    COMMERCIALE      │
├───────────────────┤                 ├─────────────────────┤                ├─────────────────────┤
│• Référentiel NAF  │  Import contrôlé│• Fiches Entreprises │ Synchronisation│• Agenda unifié      │
│• API SIRENE/INSEE │────────────────►│• Multi-contacts     │◄──────────────►│• Relances auto      │
│• Google Places API│  avec dédoublon │• Historique immuable│   bidirection  │• Capacité de travail│
│• Overpass/OSM     │                 │• Cycle de vente     │                │• Gestion des délais │
└───────────────────┘                 └──────────┬──────────┘                └──────────┬──────────┘
                                                 │                                      │
          ┌──────────────────────────────────────┼──────────────────────────────────────┘
          │                                      │
┌─────────▼─────────┐                 ┌──────────▼──────────┐                ┌─────────────────────┐
│  CANAL PHONING    │                 │    CANAL TERRAIN    │                │    CANAL EMAIL      │
├───────────────────┤                 ├─────────────────────┤                ├─────────────────────┤
│• File d'appels    │                 │• Tournées géocodées │                │• Modèles validés    │
│• Guide dynamique  │                 │• Cartographie pins  │                │• Envois unitaires/lot│
│• Matrice objection│                 │• Fiches mobiles     │                │• Suivi des réponses │
│• Qualification 1cl│                 │• Comptes-rendus GPS │                │• Conformité RGPD    │
└─────────┬─────────┘                 └──────────┬──────────┘                └──────────┬──────────┘
          │                                      │                                      │
          └──────────────────────────────────────┼──────────────────────────────────────┘
                                                 │
                                      ┌──────────▼──────────┐
                                      │ OUTLOOK & MS GRAPH  │
                                      │• Emails synchronisés│
                                      │• Calendrier partagé │
                                      └─────────────────────┘
```

---

# 10. L'ARCHITECTURE SUPABASE PROPOSÉE

La nouvelle infrastructure technique s'appuie sur le moteur PostgreSQL managé de Supabase :

1. **Supabase PostgreSQL :** Moteur relationnel robuste avec extensions activées :
   * `uuid-ossp` : Génération d'identifiants uniques non séquentiels et sécurisés.
   * `pgcrypto` : Chiffrement des tokens OAuth Microsoft au repos.
   * `postgis` (optionnel) ou calculs géodésiques : Calcul des distances pour les tournées de prospection terrain.
2. **Supabase Auth :** Gestion de l'authentification avec support de sessions sécurisées JWT et possibilité d'activer le Single Sign-On (SSO) ou le Magic Link.
3. **Row Level Security (RLS) :** Protection native au niveau de chaque ligne de table. Même en cas de faille frontend, aucune donnée ne peut être lue ou modifiée sans respecter la politique de sécurité de l'organisation.
4. **Supabase Edge Functions (Deno / TypeScript) :** Exécution sécurisée des tâches sensibles :
   * Proxy d'appel aux API externes (Google Places, SIRENE, Microsoft Graph).
   * Orchestration des appels d'analyse Gemini avec contrôle strict des quotas.
   * Traitements asynchrones d'enrichissement et d'import massif.
5. **Supabase Realtime :** Utilisé chirurgicalement pour notifier le Cockpit lorsqu'un appel est terminé, qu'un prospect est converti ou qu'une relance urgente arrive à échéance.

---

# 11. LE MODÈLE DE DONNÉES RELATIONNEL CIBLE (POSTGRESQL)

Ce schéma normalisé 3NF élimine les doublons et garantit l'intégrité référentielle :

### 11.1 Utilisateurs & Sécurité
* `profiles` : `id (uuid, PK -> auth.users)`, `email (text)`, `full_name (text)`, `role (text: 'owner' | 'manager' | 'agent')`, `created_at (timestamptz)`.
* `app_settings` : `key (text, PK)`, `value (jsonb)`, `updated_at (timestamptz)`.

### 11.2 Référentiel Métier & Activités
* `activity_domains` : `id (uuid, PK)`, `code (text)`, `label (text)`.
* `activity_sectors` : `id (uuid, PK)`, `domain_id (uuid, FK)`, `code (text)`, `label (text)`.
* `activity_professions` : `id (uuid, PK)`, `sector_id (uuid, FK)`, `naf_code (text)`, `label (text)`.
* `activity_sub_professions` : `id (uuid, PK)`, `profession_id (uuid, FK)`, `label (text)`, `keywords (text[])`.

### 11.3 Acquisition & Données Brutes (NEXUS DATA)
* `data_sources` : `id (uuid, PK)`, `name (text)`, `type (text: 'sirene' | 'google_places' | 'osm' | 'manual')`, `status (text)`.
* `collection_jobs` : `id (uuid, PK)`, `name (text)`, `source_id (uuid, FK)`, `status (text: 'pending' | 'running' | 'completed' | 'error')`, `target_count (int)`, `found_count (int)`, `verified_count (int)`, `criteria (jsonb)`, `created_at (timestamptz)`.
* `data_leads` : `id (uuid, PK)`, `job_id (uuid, FK)`, `company_name (text)`, `siren (text)`, `siret (text)`, `naf_code (text)`, `phone (text)`, `email (text)`, `website (text)`, `address (text)`, `postal_code (text)`, `city (text)`, `latitude (float)`, `longitude (float)`, `confidence_score (float)`, `verification_status (text)`, `raw_data (jsonb)`, `is_imported_to_crm (boolean)`, `created_at (timestamptz)`.

### 11.4 CRM Central & Entités Commerciales
* `companies` : `id (uuid, PK)`, `commercial_name (text)`, `legal_name (text)`, `siren (text, unique)`, `siret (text)`, `naf_code (text)`, `sector (text)`, `website (text)`, `standard_phone (text)`, `general_email (text)`, `address_street (text)`, `postal_code (text)`, `city (text)`, `source_origin (text)`, `created_at (timestamptz)`.
* `contacts` : `id (uuid, PK)`, `company_id (uuid, FK)`, `first_name (text)`, `last_name (text)`, `role_title (text)`, `direct_phone (text)`, `mobile_phone (text)`, `email (text)`, `is_primary (boolean)`, `created_at (timestamptz)`.
* `prospects` : `id (uuid, PK)`, `company_id (uuid, FK)`, `primary_contact_id (uuid, FK)`, `campaign_id (uuid, FK, nullable)`, `status (text: 'nouveau' | 'a_qualifier' | 'premier_contact' | 'interet_identifie' | 'rdv_a_programmer' | 'rdv_programme' | 'proposition_en_cours' | 'proposition_envoyee' | 'negociation' | 'gagne' | 'perdu' | 'a_recontacter')`, `priority (text: 'basse' | 'moyenne' | 'haute')`, `next_action_date (date)`, `assigned_to (uuid, FK -> profiles)`, `notes (text)`, `created_at (timestamptz)`.
* `interactions` : `id (uuid, PK)`, `prospect_id (uuid, FK)`, `contact_id (uuid, FK, nullable)`, `channel (text: 'phone' | 'field' | 'email' | 'meeting')`, `result (text)`, `summary (text)`, `performed_at (timestamptz)`, `performed_by (uuid, FK -> profiles)`.

### 11.5 Campagnes & Prospection
* `campaigns` : `id (uuid, PK)`, `name (text)`, `channel (text: 'phone' | 'field' | 'email' | 'hybrid')`, `status (text: 'draft' | 'active' | 'paused' | 'completed')`, `target_sector (text)`, `target_location (text)`, `target_count (int)`, `start_date (date)`, `end_date (date)`, `script_id (uuid, FK, nullable)`, `created_at (timestamptz)`.
* `campaign_prospects` : `campaign_id (uuid, FK)`, `prospect_id (uuid, FK)`, `queue_order (int)`, `call_attempts (int)`, `last_attempt_at (timestamptz)`, `PRIMARY KEY (campaign_id, prospect_id)`.
* `scripts` : `id (uuid, PK)`, `title (text)`, `target_sector (text)`, `branch_id (text)`, `steps (jsonb)`, `is_default (boolean)`.
* `objections` : `id (uuid, PK)`, `category (text)`, `title (text)`, `rebuttal (text)`, `key_questions (text[])`.

### 11.6 Terrain & Tournées
* `field_routes` : `id (uuid, PK)`, `name (text)`, `date (date)`, `assigned_to (uuid, FK)`, `status (text: 'planned' | 'in_progress' | 'completed')`, `total_distance_km (float)`.
* `field_visits` : `id (uuid, PK)`, `route_id (uuid, FK)`, `prospect_id (uuid, FK)`, `visit_order (int)`, `status (text: 'a_visiter' | 'visite' | 'absent' | 'ferme' | 'refus' | 'rdv_obtenu')`, `report_notes (text)`, `latitude (float)`, `longitude (float)`, `visited_at (timestamptz)`.

### 11.7 Planification & Tâches
* `tasks` : `id (uuid, PK)`, `prospect_id (uuid, FK, nullable)`, `title (text)`, `description (text)`, `due_date (date)`, `due_time (time, nullable)`, `priority (text)`, `status (text: 'todo' | 'in_progress' | 'done')`, `task_type (text: 'relance_tel' | 'visite_terrain' | 'email' | 'cadrage')`, `assigned_to (uuid, FK)`, `completed_at (timestamptz)`.
* `appointments` : `id (uuid, PK)`, `prospect_id (uuid, FK)`, `title (text)`, `start_time (timestamptz)`, `end_time (timestamptz)`, `location (text)`, `outlook_event_id (text, nullable)`, `status (text: 'scheduled' | 'held' | 'cancelled')`.

### 11.8 Intégration Microsoft
* `microsoft_accounts` : `id (uuid, PK)`, `user_id (uuid, FK)`, `email (text)`, `access_token_encrypted (text)`, `refresh_token_encrypted (text)`, `expires_at (timestamptz)`, `sync_status (text)`.
* `email_messages` : `id (uuid, PK)`, `prospect_id (uuid, FK, nullable)`, `outlook_message_id (text, unique)`, `subject (text)`, `sender_email (text)`, `recipient_email (text)`, `body_preview (text)`, `sent_at (timestamptz)`.

---

# 12. LE FONCTIONNEMENT DÉTAILLÉ DES TROIS CANAUX DE PROSPECTION

### 12.1 Canal 1 : Prospection Téléphonique (Phoning Haute Performance)
1. **Sélection de session :** L'utilisateur choisit une campagne active. Le système charge la file d'attente ordonnée par priorité et dernière date de contact.
2. **Poste d'appel sans distraction :** La fiche du prospect s'affiche avec son numéro de téléphone cliquable (`tel:`), le nom du décideur et les notes passées.
3. **Assistance au discours :** Le script commercial validé se déroule pas à pas. Si le prospect émet une objection, un clic sur la pastille correspondante ouvre immédiatement la réponse chirurgicale sans masquer les notes d'appel.
4. **Qualification en 2 clics :** À la fin de l'appel, l'opérateur clique sur le résultat (*Pas de réponse, Barrage standard, Échange constructif, RDV obtenu, Ne plus contacter*).
5. **Effet automatique garanti :**
   * Si *À rappeler* ou *RDV obtenu* : une tâche de relance ou un rendez-vous calendrier est immédiatement créé avec date d'échéance.
   * La file passe automatiquement au prospect suivant.

### 12.2 Canal 2 : Prospection Terrain (Espace Mobilité & Tournées)
1. **Cartographie des cibles :** Visualisation géographique des entreprises qualifiées sur une carte interactive (Google Maps ou MapLibre).
2. **Construction de tournée :** Sélection par zone ou code postal d'un groupe d'entreprises. Le système calcule l'ordre optimal de passage.
3. **Mode visite mobile :** Interface responsive adaptée aux smartphones et tablettes :
   * Bouton de guidage GPS ouvrant Google Maps Navigation / Waze.
   * Bouton "Je suis sur place".
   * Saisie rapide du compte-rendu oral (dictée vocale) ou textuel.
   * Qualification du statut de visite (*Rencontré, Absent, Fermé, RDV pris*).

### 12.3 Canal 3 : Prospection Numérique & Emailing
1. **Ciblage chirurgical :** Sélection de prospects disposant d'une adresse email vérifiée (strictement B2B).
2. **Modèles commerciaux pré-approuvés :** Sélection d'un template adapté à la branche (ex: Invitation au Cadrage 45 min NEXUS Digital).
3. **Validation avant émission :** Prévisualisation avec injection des variables réelles (Nom, Entreprise, Problématique identifiée).
4. **Envoi via Microsoft Graph :** L'email est expédié directement depuis la boîte professionnelle Outlook connectée de l'utilisateur (aucun serveur SMTP tiers blacklistable).
5. **Traçabilité CRM :** Le message envoyé est archivé dans la table `interactions` et lié à la fiche prospect.

---

# 13. L'INTÉGRATION MICROSOFT OUTLOOK (MICROSOFT GRAPH)

Conformément à la règle 2.3, l'intégration Microsoft est **réelle, sécurisée et bidirectionnelle** :

### 13.1 Architecture de connexion OAuth 2.0
* Utilisation du protocole OAuth 2.0 Authorization Code Flow avec PKCE via Azure App Registration.
* Scopes strictement nécessaires :
  * `User.Read` : Profil de l'utilisateur connecté.
  * `Mail.ReadWrite`, `Mail.Send` : Consultation des échanges avec les prospects et émission d'emails de prospection.
  * `Calendars.ReadWrite` : Lecture des disponibilités et écriture des rendez-vous commerciaux.
* **Sécurité des secrets :** Le `client_secret` et les tokens d'accès/refresh sont conservés exclusivement côté serveur dans le backend Supabase / Edge Functions, avec chiffrement en base (`pgcrypto`). Aucun token ne transite dans le bundle frontend.

### 13.2 Gestion du Calendrier
* Lors de la validation d'un rendez-vous dans le module Phoning ou Terrain, un événement est créé via l'API Graph : `POST /me/events`.
* L'identifiant Microsoft de l'événement (`outlook_event_id`) est stocké dans la table `appointments`.
* Si le rendez-vous est déplacé ou annulé dans Outlook, un webhook Microsoft Graph (Change Notification) ou une synchronisation différentielle met à jour le statut dans NEXUS OS.

### 13.3 Gestion des Emails
* Détection automatique des emails entrants et sortants échangés avec les adresses des contacts enregistrés dans le CRM.
* Rattachement automatique du fil de discussion à la fiche entreprise correspondante.

---

# 14. LE RÔLE DE GEMINI ET L'ENCADREMENT DE L'IA

Conformément à la règle 2.4 (*Vérité des données*), Gemini n'est plus utilisé comme un "générateur de prospects imaginaires", mais comme un **moteur analytique et transformateur de données déjà collectées** :

1. **Cas d'usage autorisés :**
   * **Normalisation & Dédoublonnage :** Comparer deux raisons sociales proches (ex: "SARL DUPONT COUVERTURE" et "Dupont Rénovation Toiture") pour calculer une probabilité de doublon.
   * **Extraction d'informations publiques :** À partir du texte brut récupéré sur le site web officiel vérifié d'une entreprise, extraire la liste des prestations réelles et les technologies utilisées.
   * **Assistance à la rédaction personnalisée :** Rédiger une amorce d'email d'introduction spécifique en s'appuyant strictement sur les faits vérifiés de l'entreprise (secteur, ville, dirigeant, activité).
   * **Synthèse exécutive :** Résumer un historique complexe de 12 interactions d'un prospect avant un rendez-vous commercial de closing.
2. **Encadrement strict & Anti-hallucination :**
   * Injection d'un garde-fou système interdisant l'extrapolation : *"N'utilise QUE les faits explicitement fournis. Si une information est absente, indique 'Non renseigné' sans la déduire."*
   * Traçabilité de chaque champ enrichi par l'IA avec le tag `provenance: 'gemini_analysis'` et un score de confiance.
   * Utilisation du modèle économique et ultra-rapide `gemini-3.1-flash-lite` pour les tâches de parsing et de `gemini-3.8-flash` pour les synthèses complexes.
3. **Contrôle des coûts et quotas :**
   * Cache des analyses web basé sur le hash du contenu pour éviter de ré-analyser une entreprise déjà auditée.
   * Limitation de débit (Rate Limiter) par utilisateur et par heure.

---

# 15. LE SYSTÈME D'AUTOMATISATION INTERNE

Abandon des timers JavaScript dans le navigateur au profit d'une architecture serveur résiliente :

1. **Déclencheurs (Triggers) Événementiels :**
   * `prospect_status_changed` -> Si le statut passe à "RDV programmé", génération automatique de la tâche de préparation et synchronisation du calendrier.
   * `call_logged` -> Si résultat = "À rappeler", programmation automatique de la relance dans la file d'attente à la date convenue.
2. **Déclencheurs Temporels (Cron Jobs) :**
   * Exécution quotidienne à 08h00 : Calcul des relances en retard et notification prioritaire dans le Cockpit.
   * Exécution hebdomadaire le vendredi à 18h00 : Calcul du rapport d'activité (taux de conversion par canal, volume d'appels, nombre de rendez-vous obtenus).
3. **Dispositif de sécurité & Maîtrise :**
   * Table `automation_logs` enregistrant chaque exécution avec statut (`succès`, `avertissement`, `erreur`).
   * Bouton "Arrêt d'urgence" dans le cockpit permettant de débrayer immédiatement toutes les automatisations actives.

---

# 16. LE PLAN DE MIGRATION DE FIREBASE VERS SUPABASE

Pour garantir zéro perte de données et une transition sans rupture :

1. **Étape 1 : Inventaire complet des données Firestore existantes :**
   * Export des documents réels des collections `prospects`, `offers`, `projects`, `tasks`, `ideas`, `decisions` et du document `settings/nexus_digital_legal`.
2. **Étape 2 : Script de transformation & Nettoyage :**
   * Script Node.js de normalisation extrayant les entreprises uniques vers la table `companies`, les contacts associés vers `contacts`, et créant les clés étrangères respectives.
   * Élimination des données tests identifiées comme factices avec confirmation.
3. **Étape 3 : Chargement dans Supabase PostgreSQL :**
   * Insertion transactionnelle respectant les contraintes d'intégrité (clés primaires, dépendances FK).
4. **Étape 4 : Validation de parité :**
   * Vérification du décompte exact d'enregistrements entre Firestore et PostgreSQL.
5. **Étape 5 : Bascule et archivage :**
   * Déconnexion du SDK Firebase côté client une fois la parité vérifiée à 100%.
   * Conservation d'une archive JSON chiffrée complète de Firestore dans un dossier sécurisé.

---

# 17. LE PLAN DE RECONSTRUCTION PAR PHASES

Le calendrier technique est structuré selon les 9 phases du Master Prompt :

| Phase | Intitulé | Durée estimée | Livrable vérifiable |
| :--- | :--- | :--- | :--- |
| **Phase 0** | **Audit & Cartographie** | Immédiat (Présent) | Rapport d'audit et matrice d'architecture validés. |
| **Phase 1** | **Architecture Cible** | Immédiat | Schéma relationnel PostgreSQL, plan des API et matrice RLS. |
| **Phase 2** | **Socle Technique & Supabase** | 1-2 jours | Connexion Supabase Client/Server, tables initiales, RLS activées, Auth fonctionnelle. |
| **Phase 3** | **Module NEXUS DATA** | 2-3 jours | Pipeline de recherche par API SIRENE / Places, déduplication, table de qualification. |
| **Phase 4** | **CRM Central & Campagnes** | 2-3 jours | Fiches entreprises/contacts normalisées, campagnes multicanales reliées. |
| **Phase 5** | **Poste Phoning & Terrain** | 3-4 jours | Station de phoning modulaire temps réel + Espace cartographique tournées terrain. |
| **Phase 6** | **Outlook & Emailing** | 2-3 jours | OAuth Azure AD, synchronisation calendrier et boîte mail Microsoft Graph. |
| **Phase 7** | **Cockpit Exécutif & Automatisations** | 2 jours | Dashboard temps réel avec requêtes SQL d'agrégation, moteur de relances auto. |
| **Phase 8** | **Qualité, Migration & Recette** | 2 jours | Migration des données, tests de non-régression, audit de sécurité final, push GitHub. |

---

# 18. LES DÉPENDANCES ET ACCÈS NÉCESSAIRES

Pour exécuter ce plan directeur, les éléments suivants seront requis aux étapes clés :

1. **Instance Supabase :**
   * URL de projet (`SUPABASE_URL`) et Clé publique (`SUPABASE_ANON_KEY`).
   * Clé de service backend (`SUPABASE_SERVICE_ROLE_KEY`) pour les opérations serveur et les migrations RLS.
2. **Microsoft Azure AD / Microsoft Graph :**
   * Inscription d'application (App Registration) sur le portail Azure pour NEXUS OS.
   * `CLIENT_ID`, `CLIENT_SECRET` et `TENANT_ID` (ou multi-tenant) avec autorisations `Mail` et `Calendars`.
3. **Sources de Données Réelles d'Acquisition :**
   * Accès à l'API Recherche d'entreprises / SIRENE (gratuite et ouverte du gouvernement français).
   * Clé API Google Places (pour les coordonnées physiques précises, avis et horaires des établissements).
4. **Google Gemini API :**
   * Clé API Gemini active pour les tâches de qualification analytique.

---

# 19. LES TESTS DE VALIDATION ET PARCOURS CRITIQUES

Avant de déclarer l'application opérationnelle à chaque étape, les 6 parcours critiques du Master Prompt seront exécutés et vérifiés :

* **Scénario A (Acquisition) :** Lancement d'une recherche d'artisans plombiers sur Lyon -> Récupération de 15 fiches SIRENE/Places -> Dédoublonnage réussi -> Qualification -> Intégration CRM d'un clic.
* **Scénario B (Phoning) :** Sélection de la campagne -> File d'appel chargée -> Clic sur le numéro -> Déroulement du script -> Enregistrement d'un résultat "RDV obtenu" -> Vérification de la création de la tâche de relance et de l'incrémentation des KPIs du Cockpit.
* **Scénario C (Terrain) :** Sélection de 5 prospects -> Création d'une tournée -> Affichage sur la carte -> Saisie du compte-rendu de visite -> Mise à jour immédiate du statut dans le CRM.
* **Scénario D (Email) :** Sélection de 3 prospects -> Choix du template de cadrage -> Validation des variables -> Envoi réel via Microsoft Graph -> Constat du mail dans la boîte d'envoi Outlook et sur la fiche prospect.
* **Scénario E (Calendrier) :** Prise de rendez-vous depuis le poste d'appel -> Création de l'événement dans le calendrier Outlook -> Modification de l'horaire dans Outlook -> Constat de la mise à jour automatique dans NEXUS OS.
* **Scénario F (Relance) :** Constat d'une relance du jour dans le Cockpit -> Clic direct pour ouvrir la fiche -> Traitement de la relance -> Clôture de la tâche -> Disparition du compteur d'alerte.

---

# 20. LES DÉCISIONS REQUÉRANT L'ACCORD DU CRÉATEUR

Avant d'engager la Phase 2 (Socle technique Supabase), les arbitrages structurants suivants nécessitent votre validation explicite :

1. **Choix de l'instance Supabase :**
   * *Option A :* Vous disposez déjà d'un compte ou d'un projet Supabase créé pour NEXUS OS (auquel cas vous fournirez les variables d'environnement de configuration dans `.env`).
   * *Option B :* Vous souhaitez que l'on configure initialement une base PostgreSQL locale / Cloud SQL ou un conteneur dédié avant de brancher le projet Supabase Cloud définitif.
2. **Fournisseur de données cartographiques et géocodage pour le Terrain :**
   * *Option A :* Google Maps Platform (nécessite une clé Google Maps API active).
   * *Option B :* OpenStreetMap / Leaflet (100% open-source et sans frais d'API, parfaitement suffisant pour la cartographie des tournées et le positionnement des points).
3. **Données existantes de Firestore :**
   * Confirmez-vous que la totalité des fiches de tests générées lors des itérations précédentes peut être purgée, ou souhaitez-vous sauvegarder certaines fiches réelles créées récemment dans Firestore ?
4. **Ordre de priorité des chantiers immédiats :**
   * Validez-vous d'entamer les développements par **le socle Supabase + le module NEXUS DATA (Acquisition réelle vérifiée sans hallucination)**, puis d'enchaîner directement sur le **Poste de Phoning refondu** ?

---
*Ce rapport constitue la feuille de route intégrale et officielle pour la reconstruction de NEXUS OS.*
