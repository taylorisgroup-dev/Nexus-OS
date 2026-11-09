-- ==============================================================================
-- NEXUS OS — SEED DATA INITIAL (SUPABASE POSTGRESQL)
-- Données de référence officielles : Nomenclature APE/NAF & Bibliothèque commerciale
-- ==============================================================================

-- 1. Domaines d'activités
INSERT INTO activity_domains (id, code, label) VALUES
('11111111-1111-1111-1111-111111111101', 'BTP', 'Bâtiment, Construction & Rénovation'),
('11111111-1111-1111-1111-111111111102', 'SERVICES_PRO', 'Services aux Entreprises & Conseil B2B'),
('11111111-1111-1111-1111-111111111103', 'COMMERCE_CHR', 'Commerce de Proximité, Restauration & CHR'),
('11111111-1111-1111-1111-111111111104', 'INDUSTRIE', 'Industrie, Production & Logistique')
ON CONFLICT (code) DO NOTHING;

-- 2. Secteurs
INSERT INTO activity_sectors (id, domain_id, code, label) VALUES
('22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111101', 'BTP_SECOND_OEUVRE', 'Second œuvre & Rénovation'),
('22222222-2222-2222-2222-222222222202', '11111111-1111-1111-1111-111111111102', 'CONSEIL_COMPTA_DROIT', 'Expertise-comptable & Juridique'),
('22222222-2222-2222-2222-222222222203', '11111111-1111-1111-1111-111111111102', 'DIGITAL_COMMUNICATION', 'Digital, Informatique & Communication'),
('22222222-2222-2222-2222-222222222204', '11111111-1111-1111-1111-111111111103', 'RESTAURATION_TRAD', 'Restauration & Métiers de Bouche')
ON CONFLICT (code) DO NOTHING;

-- 3. Métiers & Professions avec codes NAF officiels
INSERT INTO activity_professions (id, sector_id, naf_code, label, description) VALUES
('33333333-3333-3333-3333-333333333301', '22222222-2222-2222-2222-222222222201', '43.22A', 'Travaux d''installation d''eau et de gaz en tous locaux', 'Plombiers chauffagistes, installateurs sanitaires'),
('33333333-3333-3333-3333-333333333302', '22222222-2222-2222-2222-222222222201', '43.21A', 'Installation électrique', 'Électriciens généraux, domotique, courants faibles'),
('33333333-3333-3333-3333-333333333303', '22222222-2222-2222-2222-222222222202', '69.20Z', 'Activités comptables', 'Cabinets d''expertise comptable, commissaires aux comptes'),
('33333333-3333-3333-3333-333333333304', '22222222-2222-2222-2222-222222222202', '69.10Z', 'Activités juridiques', 'Avocats d''affaires, notaires, conseils juridiques'),
('33333333-3333-3333-3333-333333333305', '22222222-2222-2222-2222-222222222204', '56.10A', 'Restauration traditionnelle', 'Restaurants traditionnels avec service à table'),
('33333333-3333-3333-3333-333333333306', '22222222-2222-2222-2222-222222222203', '62.01Z', 'Programmation informatique', 'Éditeurs de logiciels, ESN, agences de développement web')
ON CONFLICT DO NOTHING;

-- 4. Bibliothèque d'objections commerciales officielles NEXUS
INSERT INTO objections (category, title, rebuttal, counter_questions) VALUES
(
    'Barrage standard',
    'C''est à quel sujet ? / Il n''est pas disponible',
    'Bonjour, c''est à propos du développement et de la digitalisation opérationnelle de votre établissement. C''est le dirigeant qui prend les arbitrages sur ce sujet. Est-il joignable en fin de matinée ou préférez-vous que je rappelle vers 14h ?',
    ARRAY['Est-il sur place aujourd''hui ?', 'Quel est le moment le plus calme pour échanger 2 minutes ?']
),
(
    'Temps',
    'Je n''ai pas le temps en ce moment',
    'Je comprends parfaitement, vous êtes en plein dans les opérations. C''est justement pour cela qu''on propose un échange de cadrage ultra-concentré de 45 minutes sans engagement, pour identifier immédiatement où vous perdez du temps et des opportunités.',
    ARRAY['Sur quel dossier passez-vous le plus de temps actuellement ?', 'Si on pouvait vous libérer 5h par semaine, cela vaudrait-il 30 minutes de discussion ?']
),
(
    'Budget',
    'Nous n''avons pas de budget pour cela',
    'Je ne vous appelle pas pour vous vendre une prestation à l''aveugle. Notre approche chez NEXUS Premium Solutions consiste d''abord à auditer vos points de friction. Si notre intervention ne génère pas un retour sur investissement mesurable, nous ne travaillons pas ensemble.',
    ARRAY['Quel budget aviez-vous alloué à votre acquisition client cette année ?', 'Quels sont vos objectifs de croissance pour les 6 prochains mois ?']
),
(
    'Concurrence',
    'Nous avons déjà quelqu''un qui gère ça',
    'C''est une excellente chose. La plupart de nos clients avaient également un prestataire historique. Notre valeur ajoutée chez NEXUS n''est pas de remplacer ce qui fonctionne, mais d''apporter une sur-couche d''ingénierie et d''automatisation que les prestataires classiques ne couvrent pas.',
    ARRAY['Êtes-vous pleinement satisfait des résultats concrets générés ?', 'Avez-vous une visibilité claire sur votre ROI ?']
),
(
    'Email de barrage',
    'Envoyez-moi un email, je regarderai',
    'Avec plaisir ! Mais pour que je vous envoie un document réellement utile et sur-mesure pour votre structure plutôt qu''une plaquette générique qui ira à la corbeille, quel est votre défi majeur en ce moment : la rentabilité ou le flux de nouveaux clients ?',
    ARRAY['À quelle adresse directe puis-je vous l''adresser ?', 'Puis-je vous rappeler jeudi à 11h après lecture ?']
)
ON CONFLICT DO NOTHING;

-- 5. Script commercial par défaut (Cadrage 45 min NEXUS Premium Solutions)
INSERT INTO scripts (id, title, target_sector, branch_name, steps) VALUES
(
    '44444444-4444-4444-4444-444444444401',
    'Script Exécutif — Cadrage 45 min & Acquisition',
    'Tous secteurs B2B',
    'NEXUS Premium Solutions',
    '[
        {
            "id": "step_1",
            "title": "1. Accroche chirurgicale",
            "objective": "Passer le barrage et capter l''attention du dirigeant en 15 secondes",
            "suggestedTalk": "Bonjour [Nom Dirigeant], je vous contacte de la part de NEXUS Premium Solutions. Je ne vous dérange que 30 secondes : nous accompagnons les dirigeants de [Secteur] sur [Ville] pour structurer leur acquisition client et digitaliser leurs processus clés.",
            "durationSeconds": 30
        },
        {
            "id": "step_2",
            "title": "2. Question de rupture / Diagnostic",
            "objective": "Faire parler le dirigeant sur ses vraies difficultés",
            "suggestedTalk": "Aujourd''hui, sur votre activité à [Ville], votre principal levier de croissance repose-t-il sur le bouche-à-oreille traditionnel ou avez-vous mis en place un canal proactif et prédictible de nouveaux prospects ?",
            "durationSeconds": 60
        },
        {
            "id": "step_3",
            "title": "3. Présentation de la valeur NEXUS",
            "objective": "Montrer l''expertise hybride Humain + IA",
            "suggestedTalk": "Notre métier chez NEXUS Premium Solutions : « L''entreprise d''abord, la technologie ensuite ». Nous combinons prospection humaine ciblée et automatisation sur-mesure pour vous apporter des rendez-vous qualifiés prêts à signer.",
            "durationSeconds": 60
        },
        {
            "id": "step_4",
            "title": "4. Proposition de Cadrage 45 min",
            "objective": "Verrouiller une date et une heure précises",
            "suggestedTalk": "Je vous propose un échange de cadrage exécutif de 45 minutes, en visio ou sur place, sans aucun engagement. Nous passons en revue votre organisation et vous repartez avec un diagnostic clair. Seriez-vous plus disponible ce jeudi à 10h ou vendredi à 14h30 ?",
            "durationSeconds": 45
        }
    ]'::jsonb
)
ON CONFLICT DO NOTHING;

-- 6. Sources de données d'acquisition
INSERT INTO collection_sources (name, source_type, base_url) VALUES
('Annuaire des Entreprises & SIRENE (Gouv)', 'sirene_insee', 'https://recherche-entreprises.api.gouv.fr/search'),
('Google Places & Business API', 'google_places', 'https://maps.googleapis.com/maps/api/place'),
('OpenStreetMap & Overpass B2B', 'osm_overpass', 'https://overpass-api.de/api/interpreter')
ON CONFLICT (name) DO NOTHING;
