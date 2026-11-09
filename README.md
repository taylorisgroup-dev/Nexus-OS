# NEXUS OS — Plateforme de Pilotage & Prospection B2B
> **NEXUS Premium Solutions**  
> *« THINK HUMAN, EXECUTE AI, EVOLVE HYBRID. »*  
> *« L’entreprise d’abord. La technologie ensuite. »*

---

## 📌 Présentation

**NEXUS OS** est la plateforme web privée de pilotage exécutif et d'intelligence commerciale conçue pour **NEXUS Premium Solutions**. Elle unifie en une interface sombre, fluide et sans dispersion :

1. **Cockpit Exécutif Dirigeant** : Tableau de bord quotidien, indicateurs clés de conversion, actions prioritaires et alertes.
2. **Poste de Prospection Téléphonique Concentré** : File d'appels ciblée, composition manuelle au combiné (zéro appel automatique intrusif), guide vivant de conversation en 4 étapes et bibliothèque d'objections (Comprendre → Répondre → Rebondir).
3. **Moteur d'Acquisition & Scraping Réel en Direct** : Extraction en temps réel de vraies entreprises B2B avec dirigeants, numéros directs français, adresses physiques et liens directs Google Maps via l'API Gemini.
4. **Module d'Enrichissement Google Maps & Web** : Audit instantané de la présence en ligne, note et avis Google Maps, technologies web détectées, décideurs identifiés et 3 angles d'attaque personnalisés.
5. **Catalogue des Offres & Solutions** : Cadrage des expertises NEXUS (Digital, Consulting, Automatisation, Énergie, IA).
6. **Configurateur Web 24 Points & Documents Contractuels** : Moteur de règles déterministe, chiffrage transparent et génération des contrats et documents préparatoires.
7. **Gouvernance & Sécurité Firestore** : Règles d'accès strictes en mode *deny-by-default*, réservées exclusivement au compte dirigeant vérifié.

---

## 🛠️ Stack Technique

- **Front-End** : React 19, TypeScript (Strict Mode), Vite 8, Tailwind CSS v4 (`@tailwindcss/vite`), Lucide React, Motion.
- **Back-End** : Node.js, Express, TSX (Full-Stack dev middleware).
- **Intelligence Artificielle & Scraping** : `@google/genai` (SDK officiel Google GenAI), modèles `gemini-3.1-flash-lite` et `gemini-3.8-flash`.
- **Base de Données & Authentification** : Firebase Firestore (temps réel `onSnapshot`), Firebase Authentication (Google Sign-In).

---

## 📁 Architecture du Projet

```text
├── server.ts                             # Serveur Express & Endpoints d'acquisition IA
├── firestore.rules                       # Règles de sécurité Firestore (Deny-by-default)
├── index.html                            # Point d'entrée HTML
├── metadata.json                         # Métadonnées et permissions AI Studio
├── package.json                          # Dépendances et scripts de build
├── tsconfig.json                         # Configuration TypeScript
├── vite.config.ts                        # Configuration Vite & Tailwind v4
├── public/
│   ├── assets/aistudio/                  # Logo officiel métal 3D avec double hélice ADN
│   └── brand/                            # Actifs de marque NEXUS
└── src/
    ├── main.tsx                          # Point d'entrée React 19
    ├── App.tsx                           # Routage conditionnel & modales transverses
    ├── types/                            # Typage métier strict TypeScript
    │   ├── nexus.ts                      # Prospects, EnrichedData, Tâches, Projets
    │   ├── phoning.ts                    # Campagnes, Scripts, Objections
    │   ├── branches.ts                   # Branches d'activité NEXUS
    │   ├── automations.ts                # Moteur d'automatisations & alertes in-app
    │   └── configurator.ts               # Cadrage 24 points & chiffrage
    ├── lib/
    │   ├── firebase.ts                   # Initialisation client Firebase
    │   └── firestoreErrors.ts            # Gestion unifiée des erreurs Firestore
    ├── context/
    │   ├── AuthContext.tsx               # Authentification & Gate Dirigeant
    │   └── DataContext.tsx               # Synchronisation temps réel Firestore
    └── components/
        ├── brand/                        # NexusLogo & NexusBanner
        ├── cockpit/                      # Tableau de bord exécutif
        ├── phoning/                      # Poste d'appel concentré
        ├── campaigns/                    # Gestion des campagnes & scraping
        ├── prospects/                    # Fichier prospects & modal d'enrichissement Maps
        ├── tasks/                        # Actions & relances
        ├── offers/                       # Catalogue d'offres
        ├── projects/                     # Projets clients
        ├── configurator/                 # Configurateur web & documents
        ├── branches/                     # Consolidation transversale
        ├── automations/                  # Alertes & automatisations internes
        └── settings/                     # Nettoyage des données & exports CSV/JSON
```

---

## 🚀 Installation & Démarrage

### 1. Cloner le dépôt
```bash
git clone https://github.com/taylorisgroup-dev/Nexus-OS.git
cd Nexus-OS
```

### 2. Installer les dépendances
```bash
npm install
```

### 3. Configurer l'environnement
Copiez `.env.example` en `.env` et renseignez votre clé API Gemini :
```bash
cp .env.example .env
```
Variables requises :
- `GEMINI_API_KEY` : Clé API Google Gemini pour le scraping et l'enrichissement.

### 4. Lancer le serveur de développement
```bash
npm run dev
```
L'application démarre sur `http://localhost:3000`.

### 5. Build de production
```bash
npm run build
npm start
```

---

## 🔐 Sécurité & Droits d'Accès

- **Propriétaire Exclusif** : Seul le compte vérifié `nexuspremiumsolutions@gmail.com` est autorisé par `firestore.rules`.
- **Règles Firestore** : Toute tentative d'écriture ou de lecture par un utilisateur tiers ou anonyme est rejetée côté serveur (`allow read, write: if false;` par défaut).
- **Zéro fuite de clés** : Le client web n'expose aucune clé API privée. Tous les appels vers Gemini transitent par le backend Express (`server.ts`).

---

## 📡 Endpoints API Internes (`server.ts`)

- `POST /api/scrape-prospects` : Extraction ciblée de prospects réels par secteur et ville avec dirigeants, téléphones directs, adresses et liens Google Maps.
- `POST /api/enrich-prospect` : Vérification en profondeur Google Maps, note & avis, audit digital du site et angles d'attaque commerciaux.
- `POST /api/parse-pasted-prospects` : Normalisation instantanée de listes ou contacts bruts collés.

---

## ⚖️ Licence & Propriété

Usage privé interne — **NEXUS Premium Solutions**. Tous droits réservés.
