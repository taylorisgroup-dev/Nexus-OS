import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '5mb' }));

// 1. Limiteurs de débit (Protection Anti-DoS & Quotas)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 120, // 120 requêtes par fenêtre
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Limite de requêtes atteinte. Veuillez patienter quelques minutes.' },
});

const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40, // 40 requêtes IA par 15 min
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Quota de requêtes analytiques IA temporairement saturé. Veuillez patienter.' },
});

app.use('/api/', apiLimiter);

// 2. Client Gemini
const ai = new GoogleGenAI({});

// 3. Schémas de Validation Zod
const searchCompaniesSchema = z.object({
  query: z.string().min(1).max(200),
  location: z.string().max(100).optional().default(''),
  postalCode: z.string().max(10).optional().default(''),
  department: z.string().max(10).optional().default(''),
  count: z.number().int().min(1).max(25).optional().default(10),
});

const enrichWebsiteSchema = z.object({
  companyName: z.string().min(1).max(200),
  websiteUrl: z.string().url().max(300),
  siren: z.string().optional(),
});

// ==============================================================================
// 4. MOTEUR D'ACQUISITION RÉEL (NEXUS DATA)
// Source officielle : API Recherche d'entreprises / SIRENE (Gouvernement Français)
// ZÉRO HALLUCINATION : 100% entreprises existantes avec SIREN, dirigeants et adresses
// ==============================================================================

app.post('/api/nexus-data/search-companies', async (req: Request, res: Response) => {
  try {
    const parseResult = searchCompaniesSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Paramètres de recherche invalides.',
        details: parseResult.error.format(),
      });
    }

    const { query, location, postalCode, department, count } = parseResult.data;

    // Construction de la requête pour l'API Recherche d'Entreprises officielle
    let searchUrl = `https://recherche-entreprises.api.gouv.fr/search?q=${encodeURIComponent(query)}&per_page=${count}`;
    
    if (postalCode && postalCode.trim()) {
      searchUrl += `&code_postal=${encodeURIComponent(postalCode.trim())}`;
    } else if (department && department.trim()) {
      searchUrl += `&departement=${encodeURIComponent(department.trim())}`;
    }

    console.log(`[NEXUS DATA] Querying SIRENE API: ${searchUrl}`);

    const apiResponse = await fetch(searchUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'NEXUS-OS-Commercial-Engineering/1.0',
      },
      signal: AbortSignal.timeout(10000), // Timeout 10s
    });

    if (!apiResponse.ok) {
      throw new Error(`API SIRENE HTTP ${apiResponse.status}: ${apiResponse.statusText}`);
    }

    const data: any = await apiResponse.json();
    const rawResults = data.results || [];

    // Normalisation stricte des entreprises réelles
    const verifiedCompanies = rawResults.map((item: any) => {
      const siege = item.siege || {};
      const dirigeantsList: any[] = [];

      // Extraction des dirigeants physiques légaux au RCS
      if (Array.isArray(item.dirigeants)) {
        item.dirigeants.forEach((d: any) => {
          if (d.nom || d.prenoms) {
            dirigeantsList.push({
              name: `${d.prenoms || ''} ${d.nom || ''}`.trim(),
              role: d.qualite || 'Dirigeant / Représentant légal',
            });
          }
        });
      }

      const fullStreet = [siege.numero_voie, siege.type_voie, siege.libelle_voie]
        .filter(Boolean)
        .join(' ') || siege.adresse || 'Adresse déclarée au RCS';

      const city = siege.libelle_commune || siege.commune || location || 'France';
      const qMaps = encodeURIComponent(`${item.nom_complet || ''} ${city}`);
      const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${qMaps}`;

      return {
        id: `lead_${item.siren}_${Date.now()}`,
        companyName: item.nom_complet || item.nom_raison_sociale || 'Entreprise vérifiée',
        legalName: item.nom_raison_sociale || item.nom_complet,
        siren: item.siren,
        siret: siege.siret || null,
        nafCode: item.activite_principale || null,
        sector: query,
        profession: item.libelle_activite_principale || query,
        phone: null, // Le téléphone sera complété lors de l'audit ou vérification d'annuaire
        email: null,
        website: null,
        addressStreet: fullStreet,
        postalCode: siege.code_postal || postalCode || null,
        city: city,
        department: siege.departement || department || null,
        region: siege.region || null,
        latitude: siege.latitude ? parseFloat(siege.latitude) : null,
        longitude: siege.longitude ? parseFloat(siege.longitude) : null,
        mapsUrl,
        legalDirectors: dirigeantsList,
        verificationStatus: 'verified_sirene',
        confidenceScore: 1.0,
        provenanceSource: 'Annuaire Officiel des Entreprises (INSEE / SIRENE)',
        trancheEffectif: item.tranche_effectif_salarie || 'Non renseigné',
        dateCreation: item.date_creation || null,
        etatAdministratif: item.etat_administratif || 'A', // A = Actif
      };
    });

    return res.json({
      success: true,
      query: { query, location, postalCode, count },
      totalFound: data.total_results || verifiedCompanies.length,
      companies: verifiedCompanies,
    });
  } catch (error: unknown) {
    console.error('[NEXUS DATA] Search error:', error);
    return res.status(500).json({
      error: 'Échec de connexion au registre officiel des entreprises.',
      details: (error as Error).message,
    });
  }
});

// ==============================================================================
// 5. AUDIT & ANALYSE DE SITE WEB EN TEMPS RÉEL (CADRAGE NEXUS)
// Récupère le vrai contenu web et utilise Gemini UNIQUEMENT pour la synthèse
// ==============================================================================

app.post('/api/nexus-data/enrich-website', aiLimiter, async (req: Request, res: Response) => {
  try {
    const parseResult = enrichWebsiteSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: 'URL de site web invalide.' });
    }

    const { companyName, websiteUrl } = parseResult.data;

    console.log(`[NEXUS AUDIT] Fetching website content: ${websiteUrl}`);

    let htmlText = '';
    try {
      const webRes = await fetch(websiteUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) NEXUS-OS/1.0',
          'Accept': 'text/html,application/xhtml+xml',
        },
        signal: AbortSignal.timeout(6000), // Timeout 6s
      });

      if (webRes.ok) {
        const fullHtml = await webRes.text();
        // Élimine balises scripts/styles et ne garde que le texte visible utile (max 6000 caractères)
        htmlText = fullHtml
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 6000);
      }
    } catch (fetchErr) {
      console.warn(`[NEXUS AUDIT] Could not scrape direct HTML from ${websiteUrl}:`, (fetchErr as Error).message);
    }

    // Détection regex de numéros de téléphone et emails visibles sur la page
    const phoneMatches = htmlText.match(/(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}/g) || [];
    const emailMatches = htmlText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];

    const detectedPhone = phoneMatches[0]?.trim() || null;
    const detectedEmail = emailMatches[0]?.trim() || null;

    // Analyse Gemini STRICTE sur les données textuelles réellement récupérées
    const prompt = `Tu es l'ingénieur d'affaires senior de NEXUS Premium Solutions.
Entreprise analysée : "${companyName}"
URL officielle : "${websiteUrl}"
Texte réel extrait du site web :
"""
${htmlText || 'Page web inaccessible ou protégée par pare-feu.'}
"""

RÈGLES STRICTES :
- N'invente AUCUN fait ni chiffre.
- Base-toi uniquement sur le texte fourni ci-dessus.
- Synthétise la maturité digitale de l'entreprise ('Faible' | 'Moyenne' | 'Avancée').
- Identifie 3 prestations visibles.
- Formule 3 accroches d'ingénierie concrètes pour NEXUS Premium Solutions (cadrage exécutif de 45 minutes sans engagement).

Réponds au format JSON STRICT :
{
  "digitalMaturity": "Faible" | "Moyenne" | "Avancée",
  "visibleServices": ["...", "...", "..."],
  "painPoints": ["...", "...", "..."],
  "nexusMeetingAngles": ["...", "...", "..."]
}`;

    const aiRes = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.1,
      },
    });

    const parsedAi = JSON.parse(aiRes.text || '{}');

    return res.json({
      success: true,
      companyName,
      websiteUrl,
      detectedPhone,
      detectedEmail,
      audit: {
        digitalMaturity: parsedAi.digitalMaturity || 'Moyenne',
        visibleServices: parsedAi.visibleServices || [],
        painPoints: parsedAi.painPoints || [],
        nexusMeetingAngles: parsedAi.nexusMeetingAngles || [],
      },
    });
  } catch (error: unknown) {
    console.error('[NEXUS AUDIT] Error:', error);
    return res.status(500).json({
      error: 'Erreur lors de l’audit web de l’entreprise.',
      details: (error as Error).message,
    });
  }
});

// ==============================================================================
// 6. MODULE MICROSOFT GRAPH & OUTLOOK (STATUT & PREPARATION)
// ==============================================================================

app.get('/api/outlook/status', (_req: Request, res: Response) => {
  const hasAzureConfig = Boolean(
    process.env.MICROSOFT_CLIENT_ID &&
    process.env.MICROSOFT_CLIENT_SECRET
  );

  return res.json({
    configured: hasAzureConfig,
    provider: 'Microsoft Graph / Azure AD',
    scopes: ['User.Read', 'Mail.ReadWrite', 'Mail.Send', 'Calendars.ReadWrite'],
    message: hasAzureConfig
      ? 'Intégration Microsoft Graph prête pour synchronisation des emails et calendriers.'
      : 'Identifiants Azure AD (MICROSOFT_CLIENT_ID, MICROSOFT_CLIENT_SECRET) en attente dans .env.',
  });
});

// 7. Servir le frontend Vite en développement ou distribution statique
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  const PORT = Number(process.env.PORT) || 3000;

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[NEXUS OS] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[NEXUS OS] Failed to start server:', err);
  process.exit(1);
});
