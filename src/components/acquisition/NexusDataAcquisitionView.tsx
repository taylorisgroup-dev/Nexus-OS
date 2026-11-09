import React, { useState } from 'react';
import { nexusDataService, type WebsiteAuditResult } from '../../services/acquisition/nexusDataService';
import { crmService } from '../../services/crm/crmService';
import { phoningService } from '../../services/phoning/phoningService';
import type { DataLead, Campaign } from '../../services/supabase/types';
import {
  Search,
  Building2,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  Users,
  Briefcase,
  ArrowRight,
  Globe,
  Plus,
  Layers,
  Sparkles,
  AlertCircle,
  FileCheck,
  ChevronRight,
  Check,
  RotateCw,
} from 'lucide-react';

interface NexusDataAcquisitionViewProps {
  onNavigateToPhoning?: () => void;
  onNavigateToCrm?: () => void;
}

export const NexusDataAcquisitionView: React.FC<NexusDataAcquisitionViewProps> = ({
  onNavigateToPhoning,
  onNavigateToCrm,
}) => {
  // Recherche
  const [query, setQuery] = useState<string>("Experts-comptables");
  const [location, setLocation] = useState<string>("Lyon");
  const [department, setDepartment] = useState<string>("69");
  const [count, setCount] = useState<number>(10);

  // Résultats
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [leads, setLeads] = useState<DataLead[]>([]);
  const [totalFound, setTotalFound] = useState<number>(0);
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());

  // Import vers CRM
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);

  // Audit Web Modal / Drawer
  const [auditedLead, setAuditedLead] = useState<DataLead | null>(null);
  const [isAuditing, setIsAuditing] = useState<boolean>(false);
  const [auditResult, setAuditResult] = useState<WebsiteAuditResult | null>(null);
  const [auditWebsiteUrl, setAuditWebsiteUrl] = useState<string>('');
  const [auditError, setAuditError] = useState<string | null>(null);

  // Charger les campagnes au montage
  React.useEffect(() => {
    phoningService.getCampaigns().then((c) => {
      setCampaigns(c);
      if (c.length > 0) setSelectedCampaignId(c[0].id);
    });
  }, []);

  // Déclencheur de recherche
  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) {
      setError('Veuillez renseigner un secteur ou métier à rechercher.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setImportSuccess(null);
    setLeads([]);
    setSelectedLeads(new Set());

    try {
      const res = await nexusDataService.searchCompanies({
        query: query.trim(),
        location: location.trim(),
        department: department.trim(),
        count,
      });

      setLeads(res.companies);
      setTotalFound(res.totalFound);
      // Sélectionner par défaut toutes les entreprises trouvées
      setSelectedLeads(new Set(res.companies.map((c) => c.id)));
    } catch (err: unknown) {
      setError((err as Error).message || 'Échec de connexion au registre des entreprises.');
    } finally {
      setIsLoading(false);
    }
  };

  // Sélection individuelle
  const toggleSelect = (id: string) => {
    setSelectedLeads((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Tout sélectionner / désélectionner
  const toggleSelectAll = () => {
    if (selectedLeads.size === leads.length) {
      setSelectedLeads(new Set());
    } else {
      setSelectedLeads(new Set(leads.map((l) => l.id)));
    }
  };

  // Import contrôlé vers le CRM
  const handleImportToCrm = async () => {
    if (selectedLeads.size === 0) return;

    setIsImporting(true);
    setImportSuccess(null);
    setError(null);

    try {
      const leadsToImport = leads.filter((l) => selectedLeads.has(l.id));
      let countImported = 0;

      for (const lead of leadsToImport) {
        await crmService.importDataLeadToCrm(lead, selectedCampaignId || undefined);
        countImported++;
      }

      setImportSuccess(
        `${countImported} entreprise(s) et contact(s) vérifiés ont été injectés avec succès dans le CRM et rattachés à la file de prospection !`
      );

      // Marquer comme importés
      setLeads((prev) =>
        prev.map((l) =>
          selectedLeads.has(l.id) ? { ...l, is_imported_to_crm: true } : l
        )
      );
    } catch (err: unknown) {
      setError((err as Error).message || 'Erreur lors de l’intégration CRM.');
    } finally {
      setIsImporting(false);
    }
  };

  // Lancer l'audit de site web
  const handleStartAudit = async (lead: DataLead) => {
    setAuditedLead(lead);
    setAuditWebsiteUrl(lead.website || '');
    setAuditResult(null);
    setAuditError(null);
  };

  const handleExecuteAudit = async () => {
    if (!auditWebsiteUrl.trim() || !auditedLead) return;

    setIsAuditing(true);
    setAuditError(null);

    try {
      const res = await nexusDataService.auditCompanyWebsite(
        auditedLead.company_name,
        auditWebsiteUrl.trim(),
        auditedLead.siren
      );
      setAuditResult(res);

      // Mettre à jour l'URL du site sur le lead localement
      setLeads((prev) =>
        prev.map((l) =>
          l.id === auditedLead.id ? { ...l, website: auditWebsiteUrl.trim(), phone: res.detectedPhone || l.phone, email: res.detectedEmail || l.email } : l
        )
      );
    } catch (err: unknown) {
      setAuditError((err as Error).message || 'Échec de l’audit web.');
    } finally {
      setIsAuditing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête NEXUS DATA */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/80 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-400 mb-1">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Pipeline d'Acquisition Officiel · 100% Vérifié & Sans Hallucination</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
              NEXUS DATA
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                INSEE / SIRENE / RCS
              </span>
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Recherchez des entreprises réelles actives en France avec SIREN, dirigeants officiels au RCS, adresses géocodées et effectifs déclarés.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Règle 2.4 :</span>
            <span className="text-xs px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-slate-200 font-mono">
              Données Certifiées
            </span>
          </div>
        </div>
      </div>

      {/* Formulaire de Recherche Multicritère */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg">
        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-4">
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Activité, Métier ou Raison Sociale
            </label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ex: Experts-comptables, Plombiers, Avocats..."
                className="w-full bg-slate-800/90 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          <div className="md:col-span-3">
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Ville ou Zone
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Ex: Lyon, Paris, Bordeaux..."
                className="w-full bg-slate-800/90 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Département (N°)
            </label>
            <input
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="Ex: 69, 75, 33"
              className="w-full bg-slate-800/90 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <div className="md:col-span-1">
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Volume
            </label>
            <select
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="w-full bg-slate-800/90 border border-slate-700 rounded-lg px-2 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={20}>20</option>
              <option value={25}>25</option>
            </select>
          </div>

          <div className="md:col-span-2 flex items-end">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-[38px] bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium text-sm rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 transition-all cursor-pointer"
            >
              {isLoading ? (
                <>
                  <RotateCw className="w-4 h-4 animate-spin" />
                  <span>Recherche...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Lancer l'Acquisition</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Suggestions Rapides de Métiers B2B */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap items-center gap-2 text-xs text-slate-400">
          <span className="font-semibold text-slate-300">Ciblages recommandés :</span>
          {[
            { q: 'Cabinets expertise comptable', loc: 'Lyon', dep: '69' },
            { q: 'Entreprises plomberie chauffage', loc: 'Bordeaux', dep: '33' },
            { q: 'Cabinets avocats droit des affaires', loc: 'Paris', dep: '75' },
            { q: 'Sociétés menuiserie rénovation', loc: 'Nantes', dep: '44' },
            { q: 'PME métallurgie mécanique', loc: 'Lille', dep: '59' },
          ].map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setQuery(preset.q);
                setLocation(preset.loc);
                setDepartment(preset.dep);
              }}
              className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              {preset.q} ({preset.loc})
            </button>
          ))}
        </div>
      </div>

      {/* Messages d'erreur ou succès */}
      {error && (
        <div className="p-4 bg-red-950/40 border border-red-800 rounded-xl text-sm text-red-300 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {importSuccess && (
        <div className="p-4 bg-emerald-950/40 border border-emerald-800 rounded-xl text-sm text-emerald-300 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{importSuccess}</span>
          </div>
          <div className="flex items-center gap-2">
            {onNavigateToPhoning && (
              <button
                onClick={onNavigateToPhoning}
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-medium cursor-pointer"
              >
                Ouvrir Phoning
              </button>
            )}
            {onNavigateToCrm && (
              <button
                onClick={onNavigateToCrm}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-medium cursor-pointer"
              >
                Voir dans le CRM
              </button>
            )}
          </div>
        </div>
      )}

      {/* Barre d'Action si résultats */}
      {leads.length > 0 && (
        <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={toggleSelectAll}
              className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-xs text-white font-medium flex items-center gap-2 cursor-pointer transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              <span>
                {selectedLeads.size === leads.length ? 'Tout désélectionner' : 'Tout sélectionner'}
              </span>
            </button>
            <span className="text-xs text-slate-300">
              <strong className="text-white">{selectedLeads.size}</strong> sur {leads.length} entreprise(s) sélectionnée(s)
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-300 whitespace-nowrap">Rattacher à :</label>
              <select
                value={selectedCampaignId}
                onChange={(e) => setSelectedCampaignId(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
              >
                <option value="">Aucune campagne (CRM général)</option>
                {campaigns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              disabled={selectedLeads.size === 0 || isImporting}
              onClick={handleImportToCrm}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg flex items-center gap-2 shadow-md cursor-pointer transition-colors"
            >
              {isImporting ? (
                <>
                  <RotateCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Importation...</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  <span>Injecter dans le CRM ({selectedLeads.size})</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Grille des Entreprises Réelles Trouvées */}
      {leads.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {leads.map((lead) => {
            const isSelected = selectedLeads.has(lead.id);
            const mainDirector = lead.legal_directors?.[0];

            return (
              <div
                key={lead.id}
                className={`border rounded-xl p-5 transition-all relative ${
                  isSelected
                    ? 'bg-slate-900/95 border-blue-500/80 shadow-lg shadow-blue-500/5'
                    : 'bg-slate-900/60 border-slate-800 opacity-80'
                }`}
              >
                {/* Header fiche */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(lead.id)}
                      className="mt-1 w-4 h-4 rounded text-blue-600 focus:ring-0 bg-slate-800 border-slate-600 cursor-pointer"
                    />
                    <div>
                      <h3 className="font-bold text-white text-base leading-snug">
                        {lead.company_name}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className="text-[11px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 font-mono border border-blue-500/30">
                          SIREN {lead.siren}
                        </span>
                        {lead.naf_code && (
                          <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                            APE {lead.naf_code}
                          </span>
                        )}
                        <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Vérifié RCS
                        </span>
                      </div>
                    </div>
                  </div>

                  <a
                    href={lead.maps_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                    title="Voir sur Google Maps"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>

                {/* Corps fiche */}
                <div className="space-y-2 text-xs text-slate-300 mt-3 pt-3 border-t border-slate-800/80">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span>
                      {lead.address_street}, {lead.postal_code} {lead.city}
                    </span>
                  </div>

                  {mainDirector && (
                    <div className="flex items-start gap-2">
                      <Users className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-white">{mainDirector.name}</strong>
                        <span className="text-slate-400 ml-1">({mainDirector.role})</span>
                      </div>
                    </div>
                  )}

                  {lead.raw_payload && (lead.raw_payload as any).trancheEffectif && (
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>
                        Effectif déclaré : Tranche {(lead.raw_payload as any).trancheEffectif}
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions au bas de la fiche */}
                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-400">
                    Source : {lead.provenance_source}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleStartAudit(lead)}
                    className="px-3 py-1 rounded bg-slate-800 hover:bg-blue-600/30 hover:text-blue-300 border border-slate-700 text-xs text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Globe className="w-3.5 h-3.5 text-blue-400" />
                    <span>Audit Web & Cadrage</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal / Tiroir d'Audit Web Réel */}
      {auditedLead && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 mb-4 pb-4 border-b border-slate-800">
              <div>
                <span className="text-xs text-blue-400 font-semibold uppercase tracking-wider">
                  Audit de Cadrage Exécutif 45 min
                </span>
                <h3 className="text-xl font-bold text-white mt-1">
                  {auditedLead.company_name}
                </h3>
                <p className="text-xs text-slate-400">
                  SIREN {auditedLead.siren} · {auditedLead.city}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setAuditedLead(null)}
                className="px-2.5 py-1 text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  URL officielle du site web de l'entreprise :
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={auditWebsiteUrl}
                    onChange={(e) => setAuditWebsiteUrl(e.target.value)}
                    placeholder="https://www.nom-entreprise.fr"
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    disabled={isAuditing || !auditWebsiteUrl}
                    onClick={handleExecuteAudit}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-2 cursor-pointer"
                  >
                    {isAuditing ? (
                      <>
                        <RotateCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Audit en cours...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Analyser le site</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {auditError && (
                <div className="p-3 bg-red-950/40 border border-red-800 rounded-lg text-xs text-red-300">
                  {auditError}
                </div>
              )}

              {auditResult && (
                <div className="space-y-4 bg-slate-800/60 border border-slate-700/80 rounded-xl p-4 mt-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-700">
                    <span className="text-xs text-slate-400">Maturité digitale détectée :</span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-semibold">
                      {auditResult.digitalMaturity}
                    </span>
                  </div>

                  {auditResult.detectedPhone && (
                    <div className="text-xs text-slate-300">
                      <strong>Téléphone détecté sur le site :</strong>{' '}
                      <span className="font-mono text-emerald-400">{auditResult.detectedPhone}</span>
                    </div>
                  )}

                  {auditResult.detectedEmail && (
                    <div className="text-xs text-slate-300">
                      <strong>Email détecté sur le site :</strong>{' '}
                      <span className="font-mono text-emerald-400">{auditResult.detectedEmail}</span>
                    </div>
                  )}

                  <div>
                    <h4 className="text-xs font-semibold text-slate-300 uppercase mb-2">
                      Prestations et services visibles :
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {auditResult.visibleServices.map((s, i) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-slate-900 text-slate-300 text-xs">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-slate-300 uppercase mb-2">
                      Angles d'attaque & Accroches Cadrage 45 min NEXUS :
                    </h4>
                    <ul className="space-y-2 text-xs text-slate-200">
                      {auditResult.nexusMeetingAngles.map((angle, i) => (
                        <li key={i} className="flex items-start gap-2 bg-slate-900/80 p-2.5 rounded-lg border border-slate-700/60">
                          <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                          <span>{angle}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setAuditedLead(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-medium cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
