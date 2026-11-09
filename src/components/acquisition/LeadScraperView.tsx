import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import type { ActiveSection, ProspectStatus } from '../../types/nexus';
import {
  Sparkles,
  Search,
  MapPin,
  Building2,
  Phone,
  Mail,
  Globe,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Upload,
  FileText,
  Copy,
  Check,
  PhoneCall,
  RefreshCw,
  Plus,
  Users,
  Briefcase,
  Layers,
  ChevronRight,
  Zap,
} from 'lucide-react';

interface ScrapedProspect {
  company: string;
  contactName: string;
  phone: string;
  email?: string;
  website?: string;
  city?: string;
  postalCode?: string;
  sector?: string;
  needsSummary?: string;
}

interface LeadScraperViewProps {
  onNavigate: (section: ActiveSection) => void;
}

export const LeadScraperView: React.FC<LeadScraperViewProps> = ({ onNavigate }) => {
  const { branches, createProspect, prospects } = useData();
  const { isOwner } = useAuth();

  // Mode: 'scrape' | 'paste'
  const [activeMode, setActiveMode] = useState<'scrape' | 'paste'>('scrape');

  // Scraper inputs
  const [targetSector, setTargetSector] = useState<string>("Cabinets d'expertise comptable");
  const [location, setLocation] = useState<string>('Lyon');
  const [selectedBranchId, setSelectedBranchId] = useState<string>(branches[0]?.id || '');
  const [count, setCount] = useState<number>(8);

  // Status
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ScrapedProspect[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());

  // Import feedback
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [importSuccessMessage, setImportSuccessMessage] = useState<string | null>(null);

  // Paste / CSV input
  const [rawText, setRawText] = useState<string>('');
  const [isParsingText, setIsParsingText] = useState<boolean>(false);

  // Quick preset triggers
  const presets = [
    { label: '📊 Experts-comptables · Lyon', sector: 'Cabinets d’expertise comptable', loc: 'Lyon' },
    { label: '🔨 BTP & Rénovation · Bordeaux', sector: 'Entreprises du bâtiment et rénovation', loc: 'Bordeaux' },
    { label: '🚚 Logistique & Fret · Lille', sector: 'Transport routier et logistique', loc: 'Lille' },
    { label: '⚖️ Avocats d’affaires · Paris', sector: 'Cabinets d’avocats en droit des affaires', loc: 'Paris' },
    { label: '🏢 Agences immobilières · Marseille', sector: 'Agences immobilières indépendantes', loc: 'Marseille' },
    { label: '🏭 PME Industrielles · Nantes', sector: 'PME métallurgie et mécanique de précision', loc: 'Nantes' },
    { label: '💻 Studios Tech / SaaS · Toulouse', sector: 'Editeurs de logiciels et agences digitales', loc: 'Toulouse' },
  ];

  const handleApplyPreset = (sector: string, loc: string) => {
    setTargetSector(sector);
    setLocation(loc);
  };

  // Run Scraping
  const handleScrape = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!targetSector.trim()) {
      setError('Veuillez renseigner un secteur ou un métier cible.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setImportSuccessMessage(null);
    setResults([]);
    setSelectedIndices(new Set());

    const branch = branches.find((b) => b.id === selectedBranchId);

    try {
      const res = await fetch('/api/scrape-prospects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetSector: targetSector.trim(),
          location: location.trim() || 'France',
          branchName: branch ? `${branch.name} (${branch.code})` : 'NEXUS Premium Solutions',
          count,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de la recherche des prospects');
      }

      if (data.prospects && Array.isArray(data.prospects)) {
        setResults(data.prospects);
        // Select all by default
        setSelectedIndices(new Set(data.prospects.map((_: any, i: number) => i)));
      } else {
        setResults([]);
      }
    } catch (err: unknown) {
      setError((err as Error).message || 'Échec de connexion au moteur d’acquisition.');
    } finally {
      setIsLoading(false);
    }
  };

  // Run Paste Parser
  const handleParseText = async () => {
    if (!rawText.trim()) {
      setError('Veuillez coller du texte de contacts (CSV, texte libre, annuaire).');
      return;
    }

    setIsParsingText(true);
    setError(null);
    setImportSuccessMessage(null);

    try {
      const res = await fetch('/api/parse-pasted-prospects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors du traitement du texte');
      }

      if (data.prospects && Array.isArray(data.prospects)) {
        setResults(data.prospects);
        setSelectedIndices(new Set(data.prospects.map((_: any, i: number) => i)));
        setActiveMode('scrape'); // switch to review table
      } else {
        setError('Aucun contact exploitable n’a pu être identifié dans ce texte.');
      }
    } catch (err: unknown) {
      setError((err as Error).message || 'Échec d’analyse du texte.');
    } finally {
      setIsParsingText(false);
    }
  };

  const toggleSelectIndex = (idx: number) => {
    setSelectedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIndices.size === results.length) {
      setSelectedIndices(new Set());
    } else {
      setSelectedIndices(new Set(results.map((_, i) => i)));
    }
  };

  // Batch import into Firestore
  const handleImportToDatabase = async (goToPhoning: boolean = false) => {
    if (selectedIndices.size === 0) {
      setError('Veuillez sélectionner au moins un prospect à importer.');
      return;
    }

    setIsImporting(true);
    setError(null);
    setImportSuccessMessage(null);

    const todayStr = new Date().toISOString().split('T')[0];
    let importedCount = 0;

    try {
      for (const idx of Array.from(selectedIndices)) {
        const item = results[idx];
        if (!item || !item.company) continue;

        await createProspect({
          company: item.company,
          contactName: item.contactName || 'Direction Générale',
          phone: item.phone || '',
          email: item.email || '',
          sector: item.sector || targetSector,
          needsSummary: item.needsSummary || 'Prospect qualifié via acquisition automatique NEXUS OS.',
          status: 'À contacter',
          branchId: selectedBranchId || undefined,
          nextContactDate: todayStr,
          notes: `Acquis via moteur NEXUS OS · Ville: ${item.city || location}${
            item.website ? ` · Web: ${item.website}` : ''
          }`,
        });
        importedCount++;
      }

      setImportSuccessMessage(
        `${importedCount} prospect(s) importé(s) avec succès dans votre base Firestore !`
      );

      // Remove imported from results or clear selection
      setResults((prev) => prev.filter((_, i) => !selectedIndices.has(i)));
      setSelectedIndices(new Set());

      if (goToPhoning) {
        setTimeout(() => {
          onNavigate('phoning');
        }, 600);
      }
    } catch (err: unknown) {
      setError(
        (err as Error).message ||
          'Une erreur est survenue lors de l’enregistrement dans Firestore.'
      );
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Hero Banner */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800 flex items-center gap-1">
                <Zap className="w-3 h-3 text-cyan-400" />
                <span>Moteur d'Acquisition B2B Réel</span>
              </span>
              <span className="text-[11px] text-neutral-400 font-mono">
                {prospects.length} prospect(s) enregistrés en base
              </span>
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Générateur & Scraping de Prospects Réels à Appeler
            </h1>
            <p className="text-xs text-neutral-300 max-w-2xl leading-relaxed">
              Ne perdez plus de temps avec des fiches vides. Renseignez un secteur et une ville :
              le moteur extrait des entreprises existantes avec nom du dirigeant, téléphone direct et besoins ciblés, prêts à alimenter votre poste phoning en 1 clic.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onNavigate('phoning')}
              className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-2 cursor-pointer"
            >
              <PhoneCall className="w-3.5 h-3.5 text-cyan-400" />
              <span>Ouvrir le Poste Phoning</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('prospects')}
              className="px-4 py-2 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 rounded-lg text-xs font-medium transition-colors cursor-pointer"
            >
              <span>Fichier Prospects</span>
            </button>
          </div>
        </div>

        {/* Mode selector tabs */}
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={() => setActiveMode('scrape')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-2 cursor-pointer ${
              activeMode === 'scrape'
                ? 'bg-white text-neutral-950 font-semibold shadow-xs'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
            <span>Recherche & Scraping Ciblé (Secteur + Ville)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMode('paste')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-2 cursor-pointer ${
              activeMode === 'paste'
                ? 'bg-white text-neutral-950 font-semibold shadow-xs'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import Express (Coller ou CSV)</span>
          </button>
        </div>
      </div>

      {/* MODE 1: SEARCH & SCRAPE */}
      {activeMode === 'scrape' && (
        <div className="space-y-6">
          {/* Query Form */}
          <form
            onSubmit={handleScrape}
            className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-cyan-400" />
                <h2 className="text-sm font-semibold text-white">
                  Critères de Ciblage pour l'Acquisition
                </h2>
              </div>
              <span className="text-[11px] text-neutral-400 font-mono">
                Extraction rapide · Qualité vérifiée
              </span>
            </div>

            {/* Quick preset chips */}
            <div>
              <span className="text-[10px] font-mono uppercase text-neutral-400 block mb-2">
                Exemples ciblés prêts à l’emploi (1 clic) :
              </span>
              <div className="flex flex-wrap gap-2">
                {presets.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleApplyPreset(p.sector, p.loc)}
                    className="px-2.5 py-1 rounded-full bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 hover:border-cyan-500/50 text-[11px] text-neutral-300 transition-colors cursor-pointer"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Target Sector */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Secteur / Métier cible <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Building2 className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={targetSector}
                    onChange={(e) => setTargetSector(e.target.value)}
                    placeholder="Ex: Cabinets d'expertise comptable, BTP, Agences..."
                    className="w-full pl-9 pr-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-100 focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Zone / Ville / Région <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <MapPin className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Ex: Lyon, Paris, Bordeaux..."
                    className="w-full pl-9 pr-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-100 focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              {/* Branch rattachée */}
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Branche NEXUS rattachée
                </label>
                <select
                  value={selectedBranchId}
                  onChange={(e) => setSelectedBranchId(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-100 focus:outline-none focus:border-cyan-400"
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-neutral-400">Volume à extraire :</span>
                {[5, 8, 12, 15].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setCount(val)}
                    className={`px-2.5 py-1 rounded text-xs font-mono transition-colors cursor-pointer ${
                      count === val
                        ? 'bg-cyan-950 text-cyan-200 border border-cyan-800 font-bold'
                        : 'bg-neutral-950 text-neutral-400 border border-neutral-800 hover:text-white'
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-2.5 bg-white hover:bg-neutral-100 text-neutral-950 font-bold rounded-lg text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-neutral-950" />
                    <span>Recherche & Scraping en cours...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
                    <span>Lancer l'acquisition & Scraper le web</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Feedback messages */}
          {error && (
            <div className="p-4 bg-red-950/80 border border-red-800 rounded-xl text-xs text-red-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {importSuccessMessage && (
            <div className="p-4 bg-emerald-950/80 border border-emerald-800 rounded-xl text-xs text-emerald-200 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-medium">{importSuccessMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('phoning')}
                className="px-3 py-1.5 bg-emerald-900 hover:bg-emerald-800 text-white rounded text-xs font-medium flex items-center gap-1.5 cursor-pointer"
              >
                <span>Accéder au poste phoning</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Results List / Table */}
          {results.length > 0 && (
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden space-y-4 p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  <h3 className="font-bold text-white text-sm">
                    {results.length} Entreprise(s) Identifiée(s)
                  </h3>
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    className="text-xs text-cyan-400 hover:underline cursor-pointer"
                  >
                    {selectedIndices.size === results.length ? 'Tout désélectionner' : 'Tout sélectionner'}
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={isImporting || selectedIndices.size === 0}
                    onClick={() => handleImportToDatabase(false)}
                    className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Plus className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Importer dans mes prospects ({selectedIndices.size})</span>
                  </button>

                  <button
                    type="button"
                    disabled={isImporting || selectedIndices.size === 0}
                    onClick={() => handleImportToDatabase(true)}
                    className="px-4 py-2 bg-white hover:bg-neutral-100 text-neutral-950 font-bold rounded-lg text-xs transition-colors flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    <PhoneCall className="w-3.5 h-3.5 text-neutral-950" />
                    <span>Importer & Appeler immédiatement</span>
                  </button>
                </div>
              </div>

              {/* Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {results.map((item, idx) => {
                  const isSelected = selectedIndices.has(idx);
                  return (
                    <div
                      key={idx}
                      onClick={() => toggleSelectIndex(idx)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer space-y-3 ${
                        isSelected
                          ? 'bg-neutral-950 border-cyan-500/80 shadow-md ring-1 ring-cyan-500/30'
                          : 'bg-neutral-950/60 border-neutral-800 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectIndex(idx)}
                            onClick={(e) => e.stopPropagation()}
                            className="mt-0.5 rounded border-neutral-700 text-cyan-500 focus:ring-cyan-500 cursor-pointer"
                          />
                          <div>
                            <h4 className="font-bold text-white text-sm leading-tight">{item.company}</h4>
                            <p className="text-xs text-neutral-300 font-medium mt-0.5">
                              {item.contactName || 'Direction'}
                            </p>
                          </div>
                        </div>

                        {item.city && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-300 shrink-0">
                            {item.city}
                          </span>
                        )}
                      </div>

                      {/* Phone & Direct details */}
                      <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1 border-t border-neutral-900">
                        <div className="flex items-center gap-1.5 text-cyan-300 font-bold">
                          <Phone className="w-3.5 h-3.5 shrink-0" />
                          <span>{item.phone || 'Non précisé'}</span>
                        </div>

                        {item.email && (
                          <div className="flex items-center gap-1.5 text-neutral-400 truncate">
                            <Mail className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">{item.email}</span>
                          </div>
                        )}
                      </div>

                      {/* Needs & Pitch context */}
                      {item.needsSummary && (
                        <div className="p-2.5 bg-neutral-900/80 border border-neutral-800/80 rounded-lg text-[11px] text-neutral-300 leading-relaxed">
                          <strong className="text-cyan-400 font-mono text-[9px] uppercase block mb-0.5">
                            Angle d’attaque & Enjeu opérationnel :
                          </strong>
                          {item.needsSummary}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODE 2: PASTE / CSV */}
      {activeMode === 'paste' && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-4">
          <div className="border-b border-neutral-800 pb-3">
            <h2 className="text-sm font-semibold text-white">
              Collez vos contacts bruts (Excel, CSV, annuaire, notes)
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Notre intelligence intégrée extrait et normalise automatiquement les noms d'entreprises, dirigeants, téléphones et adresses.
            </p>
          </div>

          <textarea
            rows={8}
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="Exemple :
Cabinet Martin & Associés - 01 42 68 00 00 - contact@martin-audit.fr - 75008 Paris
Plomberie Du Sud - Marc Vasseur - 04 91 00 00 00 - Marseille
SARL Bati-Renov, 05 56 00 00 00, contact@bati-renov.fr, Bordeaux..."
            className="w-full p-3 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 font-mono focus:outline-none focus:border-cyan-400 leading-relaxed"
          />

          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-neutral-500 font-mono">
              Extraction automatique des colonnes sans formatage requis.
            </span>

            <button
              type="button"
              disabled={isParsingText || !rawText.trim()}
              onClick={handleParseText}
              className="px-5 py-2.5 bg-white hover:bg-neutral-100 text-neutral-950 font-bold rounded-lg text-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isParsingText ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Analyse en cours...</span>
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5" />
                  <span>Extraire et prévisualiser les contacts</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
