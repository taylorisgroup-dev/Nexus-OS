import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import type {
  ActiveSection,
  InternalPhoningCampaign,
  ConversationStep,
  ObjectionItem,
  Prospect,
} from '../../types/nexus';
import { CAMPAIGN_TEMPLATES } from '../../types/phoning';
import { Modal } from '../ui/Modal';
import {
  Layers,
  Plus,
  Zap,
  PhoneCall,
  Search,
  MapPin,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  Edit2,
  Trash2,
  Users,
  Briefcase,
  Sparkles,
  ChevronRight,
  RefreshCw,
  Phone,
  Mail,
  AlertCircle,
  HelpCircle,
  BookOpen,
  ExternalLink,
} from 'lucide-react';

interface CampaignsViewProps {
  onNavigate: (section: ActiveSection) => void;
  onSelectCampaignForPhoning?: (campaignId: string) => void;
}

export const CampaignsView: React.FC<CampaignsViewProps> = ({
  onNavigate,
  onSelectCampaignForPhoning,
}) => {
  const {
    phoningCampaigns,
    savePhoningCampaign,
    deletePhoningCampaign,
    prospects,
    branches,
    createProspect,
  } = useData();
  const { isOwner } = useAuth();

  // Search & filter
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Active' | 'Cadrage' | 'En pause' | 'Terminée'>('all');

  // Modal: Create / Edit Campaign
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<InternalPhoningCampaign | null>(null);

  // Modal: Live Web Scraping for a specific Campaign
  const [scrapingCampaign, setScrapingCampaign] = useState<InternalPhoningCampaign | null>(null);
  const [scrapeSector, setScrapeSector] = useState('');
  const [scrapeLocation, setScrapeLocation] = useState('');
  const [scrapeCount, setScrapeCount] = useState(8);
  const [isScraping, setIsScraping] = useState(false);
  const [scrapeError, setScrapeError] = useState<string | null>(null);
  const [scrapedResults, setScrapedResults] = useState<any[]>([]);
  const [selectedLeads, setSelectedLeads] = useState<Set<number>>(new Set());
  const [isSavingLeads, setIsSavingLeads] = useState(false);
  const [scrapeSuccessMsg, setScrapeSuccessMsg] = useState<string | null>(null);

  // Filtered campaigns
  const filteredCampaigns = useMemo(() => {
    return phoningCampaigns.filter((c) => {
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const mName = c.name.toLowerCase().includes(q);
        const mObj = (c.objective || '').toLowerCase().includes(q);
        const mSector = (c.targetSector || '').toLowerCase().includes(q);
        const mLoc = (c.location || '').toLowerCase().includes(q);
        return mName || mObj || mSector || mLoc;
      }
      return true;
    });
  }, [phoningCampaigns, statusFilter, searchTerm]);

  // Open live scraping modal for a campaign
  const handleOpenScraping = (campaign: InternalPhoningCampaign) => {
    setScrapingCampaign(campaign);
    setScrapeSector(campaign.targetSector || campaign.targetAudience || 'Entreprises B2B');
    setScrapeLocation(campaign.location || 'France');
    setScrapeCount(campaign.targetCount || 8);
    setScrapeError(null);
    setScrapeSuccessMsg(null);
    setScrapedResults([]);
    setSelectedLeads(new Set());
  };

  // Run real web scraping via backend API
  const handleRunScrape = async () => {
    if (!scrapeSector.trim()) {
      setScrapeError('Veuillez préciser un secteur ou métier cible.');
      return;
    }
    setIsScraping(true);
    setScrapeError(null);
    setScrapeSuccessMsg(null);
    setScrapedResults([]);
    setSelectedLeads(new Set());

    try {
      const res = await fetch('/api/scrape-prospects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetSector: scrapeSector.trim(),
          location: scrapeLocation.trim() || 'France',
          branchName: scrapingCampaign?.name || 'NEXUS Premium Solutions',
          count: scrapeCount,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors du scraping');
      }

      if (data.prospects && Array.isArray(data.prospects)) {
        setScrapedResults(data.prospects);
        setSelectedLeads(new Set(data.prospects.map((_: any, i: number) => i)));
      } else {
        setScrapedResults([]);
        setScrapeError('Aucun résultat trouvé pour ces critères.');
      }
    } catch (err: unknown) {
      setScrapeError((err as Error).message || 'Échec de connexion au moteur de recherche.');
    } finally {
      setIsScraping(false);
    }
  };

  // Save selected scraped leads to Firestore with campaign link
  const handleSaveLeadsToCampaign = async (andStartPhoning = false) => {
    if (!scrapingCampaign || selectedLeads.size === 0) return;
    setIsSavingLeads(true);
    setScrapeError(null);
    const todayStr = new Date().toISOString().split('T')[0];
    let countSaved = 0;

    try {
      for (const idx of Array.from(selectedLeads)) {
        const item = scrapedResults[idx];
        if (!item || !item.company) continue;

        await createProspect({
          company: item.company,
          contactName: item.contactName || 'Direction Générale',
          phone: item.phone || '',
          email: item.email || '',
          sector: item.sector || scrapeSector,
          city: item.city || scrapeLocation,
          website: item.website || '',
          needsSummary: item.needsSummary || `Prospect qualifié pour la campagne ${scrapingCampaign.name}.`,
          status: 'À contacter',
          campaignId: scrapingCampaign.id,
          campaignName: scrapingCampaign.name,
          branchId: scrapingCampaign.branchId || undefined,
          nextContactDate: todayStr,
          notes: `Campagne : ${scrapingCampaign.name} · Ville: ${item.city || scrapeLocation}`,
        });
        countSaved++;
      }

      setScrapeSuccessMsg(`${countSaved} prospect(s) réels ajoutés avec succès à la campagne !`);
      setScrapedResults((prev) => prev.filter((_, i) => !selectedLeads.has(i)));
      setSelectedLeads(new Set());

      if (andStartPhoning) {
        if (onSelectCampaignForPhoning) {
          onSelectCampaignForPhoning(scrapingCampaign.id);
        }
        setScrapingCampaign(null);
        onNavigate('phoning');
      }
    } catch (err: unknown) {
      setScrapeError((err as Error).message || 'Erreur lors de l’enregistrement dans Firestore');
    } finally {
      setIsSavingLeads(false);
    }
  };

  const handleLaunchPhoning = (campaignId: string) => {
    if (onSelectCampaignForPhoning) {
      onSelectCampaignForPhoning(campaignId);
    }
    onNavigate('phoning');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-4 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                <span>Centre Opérationnel de Campagnes</span>
              </span>
              <span className="text-[11px] text-neutral-400 font-mono">
                {phoningCampaigns.length} campagne(s) au total
              </span>
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Campagnes & Acquisition Réelle de Prospects
            </h1>
            <p className="text-xs text-neutral-300 max-w-2xl leading-relaxed">
              Créez vos campagnes ciblées par métier et par ville. Lancez le scraping en direct pour extraire de vraies entreprises et alimenter automatiquement votre poste d'appels.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onNavigate('phoning')}
              className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl text-xs font-medium transition-colors flex items-center gap-2 cursor-pointer"
            >
              <PhoneCall className="w-3.5 h-3.5 text-cyan-400" />
              <span>Ouvrir le Poste Phoning</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setEditingCampaign(null);
                setIsCampaignModalOpen(true);
              }}
              className="px-5 py-2 bg-white hover:bg-neutral-100 text-neutral-950 font-bold rounded-xl text-xs transition-colors flex items-center gap-2 cursor-pointer shadow-md"
            >
              <Plus className="w-4 h-4 text-neutral-950" />
              <span>+ Créer une Campagne</span>
            </button>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher une campagne, un secteur, une ville..."
              className="w-full pl-9 pr-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-400 font-mono">Statut :</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-2.5 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none"
            >
              <option value="all">Tous les statuts</option>
              <option value="Active">Actives</option>
              <option value="Cadrage">En cadrage</option>
              <option value="En pause">En pause</option>
              <option value="Terminée">Terminées</option>
            </select>
          </div>
        </div>
      </div>

      {/* Campaigns Grid or Empty State */}
      {filteredCampaigns.length === 0 ? (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-10 text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-neutral-950 border border-neutral-800 flex items-center justify-center text-cyan-400 shadow-md">
            <Layers className="w-8 h-8" />
          </div>

          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-lg font-bold text-white">
              {searchTerm || statusFilter !== 'all' ? 'Aucune campagne correspondante' : 'Aucune campagne active'}
            </h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              {searchTerm || statusFilter !== 'all'
                ? 'Modifiez votre recherche ou réinitialisez le filtre de statut.'
                : 'Créez votre première campagne pour lancer le scraping de prospects réels et démarrer vos appels.'}
            </p>
          </div>

          {/* Quick starter templates */}
          <div className="max-w-2xl mx-auto pt-2 space-y-3">
            <span className="text-[11px] font-mono uppercase text-neutral-400 block font-semibold">
              Ou démarrez en 1 clic avec un modèle optimisé :
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
              {CAMPAIGN_TEMPLATES.map((tmpl) => (
                <div
                  key={tmpl.id}
                  onClick={() => {
                    setEditingCampaign({
                      ...tmpl,
                      id: `camp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                      createdAt: new Date().toISOString(),
                      updatedAt: new Date().toISOString(),
                    });
                    setIsCampaignModalOpen(true);
                  }}
                  className="p-3.5 bg-neutral-950 hover:bg-neutral-950/80 border border-neutral-800 hover:border-cyan-500/50 rounded-xl transition-all cursor-pointer space-y-1.5 group"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-white text-xs group-hover:text-cyan-300 transition-colors">
                      {tmpl.name}
                    </h4>
                    <ChevronRight className="w-3.5 h-3.5 text-neutral-500 group-hover:text-cyan-400 transition-colors" />
                  </div>
                  <p className="text-[11px] text-neutral-400 line-clamp-2 leading-relaxed">
                    {tmpl.objective}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                setEditingCampaign(null);
                setIsCampaignModalOpen(true);
              }}
              className="px-6 py-2.5 bg-white hover:bg-neutral-100 text-neutral-950 font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-md inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Créer une Campagne Personnalisée</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredCampaigns.map((camp) => {
            const campaignProspects = prospects.filter((p) => p.campaignId === camp.id);
            const branch = branches.find((b) => b.id === camp.branchId);

            return (
              <div
                key={camp.id}
                className="bg-neutral-900 border border-neutral-800 hover:border-neutral-700 rounded-2xl p-6 flex flex-col justify-between space-y-5 transition-all shadow-md"
              >
                <div className="space-y-4">
                  {/* Campaign Header & Status */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-white text-base tracking-tight">
                          {camp.name}
                        </h3>
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-semibold ${
                            camp.status === 'Active'
                              ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                              : camp.status === 'Cadrage'
                              ? 'bg-amber-950 text-amber-300 border-amber-800'
                              : 'bg-neutral-800 text-neutral-400 border-neutral-700'
                          }`}
                        >
                          {camp.status}
                        </span>
                      </div>
                      {branch && (
                        <span className="text-[11px] font-mono text-neutral-400 block">
                          Branche : <strong className="text-neutral-200">{branch.name}</strong> ({branch.code})
                        </span>
                      )}
                    </div>

                    {isOwner && (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCampaign(camp);
                            setIsCampaignModalOpen(true);
                          }}
                          className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
                          title="Modifier la campagne"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            if (confirm(`Supprimer la campagne "${camp.name}" ?`)) {
                              await deletePhoningCampaign(camp.id);
                            }
                          }}
                          className="p-1.5 text-neutral-500 hover:text-red-400 rounded-lg hover:bg-neutral-800 transition-colors"
                          title="Supprimer la campagne"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Objective & Targeting */}
                  <p className="text-xs text-neutral-300 leading-relaxed">
                    {camp.objective}
                  </p>

                  <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl space-y-1.5 text-xs font-mono">
                    {camp.targetSector && (
                      <div className="flex items-center gap-2 text-neutral-300">
                        <Building2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span>Cible : <strong>{camp.targetSector}</strong></span>
                      </div>
                    )}
                    {camp.location && (
                      <div className="flex items-center gap-2 text-neutral-300">
                        <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span>Zone : <strong>{camp.location}</strong></span>
                      </div>
                    )}
                    {!camp.targetSector && !camp.location && camp.targetAudience && (
                      <div className="text-neutral-400 text-[11px]">
                        Cible : {camp.targetAudience}
                      </div>
                    )}
                  </div>

                  {/* Real Stats Metrics */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2.5 bg-neutral-950/80 border border-neutral-800/80 rounded-xl">
                      <span className="text-[10px] font-mono uppercase text-neutral-500 block">Prospects réels</span>
                      <strong className="text-base font-bold font-mono text-cyan-300">
                        {campaignProspects.length}
                      </strong>
                    </div>

                    <div className="p-2.5 bg-neutral-950/80 border border-neutral-800/80 rounded-xl">
                      <span className="text-[10px] font-mono uppercase text-neutral-500 block">Guide d'appel</span>
                      <strong className="text-base font-bold font-mono text-white">
                        {camp.steps?.length || 0} étapes
                      </strong>
                    </div>

                    <div className="p-2.5 bg-neutral-950/80 border border-neutral-800/80 rounded-xl">
                      <span className="text-[10px] font-mono uppercase text-neutral-500 block">Objections</span>
                      <strong className="text-base font-bold font-mono text-amber-300">
                        {camp.objections?.length || 0} fiches
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-4 border-t border-neutral-800 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => handleOpenScraping(camp)}
                    className="flex-1 py-2 px-3 bg-cyan-950 hover:bg-cyan-900 border border-cyan-800 text-cyan-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Zap className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Scraper des cibles</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleLaunchPhoning(camp.id)}
                    className="flex-1 py-2 px-3 bg-white hover:bg-neutral-100 text-neutral-950 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>Lancer les appels</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: LIVE SCRAPING & LEAD EXTRACTION */}
      {scrapingCampaign && (
        <Modal
          isOpen={Boolean(scrapingCampaign)}
          onClose={() => setScrapingCampaign(null)}
          title={`Scraping Web Réel : ${scrapingCampaign.name}`}
          subtitle="Extraction en direct d'entreprises réelles avec coordonnées et dirigeants"
          maxWidth="max-w-3xl"
        >
          <div className="space-y-5 text-xs text-neutral-300">
            {/* Scraping Inputs */}
            <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-400 mb-1">Secteur / Métier cible *</label>
                  <input
                    type="text"
                    value={scrapeSector}
                    onChange={(e) => setScrapeSector(e.target.value)}
                    placeholder="Ex: Cabinets d'expertise comptable, BTP..."
                    className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-neutral-400 mb-1">Ville / Localisation géographique *</label>
                  <input
                    type="text"
                    value={scrapeLocation}
                    onChange={(e) => setScrapeLocation(e.target.value)}
                    placeholder="Ex: Lyon, Bordeaux, Paris..."
                    className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <span className="text-neutral-400">Nombre de cibles à extraire :</span>
                  {[5, 8, 12].map((cnt) => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => setScrapeCount(cnt)}
                      className={`px-2 py-0.5 rounded text-xs font-mono cursor-pointer ${
                        scrapeCount === cnt
                          ? 'bg-cyan-950 text-cyan-200 border border-cyan-800 font-bold'
                          : 'bg-neutral-900 text-neutral-400 border border-neutral-800'
                      }`}
                    >
                      {cnt}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  disabled={isScraping}
                  onClick={handleRunScrape}
                  className="px-5 py-2 bg-white hover:bg-neutral-100 text-neutral-950 font-bold rounded-lg text-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50 shadow-xs"
                >
                  {isScraping ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Extraction en cours...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-3.5 h-3.5 text-cyan-600 fill-cyan-500" />
                      <span>Lancer le Scraping Web</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Error & Success Alerts */}
            {scrapeError && (
              <div className="p-3 bg-red-950/80 border border-red-800 rounded-lg text-red-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{scrapeError}</span>
              </div>
            )}

            {scrapeSuccessMsg && (
              <div className="p-3 bg-emerald-950/80 border border-emerald-800 rounded-lg text-emerald-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{scrapeSuccessMsg}</span>
              </div>
            )}

            {/* Results Review & Batch Import */}
            {scrapedResults.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <strong className="text-white">{scrapedResults.length} entreprise(s) trouvée(s)</strong>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedLeads.size === scrapedResults.length) setSelectedLeads(new Set());
                      else setSelectedLeads(new Set(scrapedResults.map((_, i) => i)));
                    }}
                    className="text-xs text-cyan-400 hover:underline cursor-pointer"
                  >
                    {selectedLeads.size === scrapedResults.length ? 'Tout désélectionner' : 'Tout sélectionner'}
                  </button>
                </div>

                <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                  {scrapedResults.map((item, idx) => {
                    const isSel = selectedLeads.has(idx);
                    return (
                      <div
                        key={idx}
                        onClick={() => {
                          setSelectedLeads((prev) => {
                            const next = new Set(prev);
                            if (next.has(idx)) next.delete(idx);
                            else next.add(idx);
                            return next;
                          });
                        }}
                        className={`p-3 rounded-xl border transition-all cursor-pointer space-y-2 ${
                          isSel
                            ? 'bg-neutral-950 border-cyan-500/80 shadow-md ring-1 ring-cyan-500/30'
                            : 'bg-neutral-950/50 border-neutral-800 opacity-60'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2">
                            <input
                              type="checkbox"
                              checked={isSel}
                              onChange={() => {}}
                              className="mt-0.5 rounded border-neutral-700 text-cyan-500"
                            />
                            <div>
                              <h4 className="font-bold text-white text-xs">{item.company}</h4>
                              <p className="text-[11px] text-neutral-400">{item.contactName || 'Direction'}</p>
                            </div>
                          </div>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-300">
                            {item.city || scrapeLocation}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-xs font-mono flex-wrap">
                          <span className="text-cyan-300 font-bold flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {item.phone || 'Non renseigné'}
                          </span>
                          {item.email && (
                            <span className="text-neutral-400 truncate flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {item.email}
                            </span>
                          )}
                          <a
                            href={item.mapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${item.company} ${item.city || scrapeLocation}`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-[11px] text-red-400 hover:text-red-300 hover:underline flex items-center gap-1"
                          >
                            <MapPin className="w-3 h-3" />
                            <span>Google Maps</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        </div>

                        {item.needsSummary && (
                          <div className="p-2 bg-neutral-900 border border-neutral-800/80 rounded-lg text-[11px] text-neutral-300">
                            <span className="text-cyan-400 font-mono text-[9px] uppercase block">Angle :</span>
                            {item.needsSummary}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-800">
                  <button
                    type="button"
                    disabled={isSavingLeads || selectedLeads.size === 0}
                    onClick={() => handleSaveLeadsToCampaign(false)}
                    className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-xs font-medium cursor-pointer disabled:opacity-50"
                  >
                    <span>Ajouter à la campagne ({selectedLeads.size})</span>
                  </button>

                  <button
                    type="button"
                    disabled={isSavingLeads || selectedLeads.size === 0}
                    onClick={() => handleSaveLeadsToCampaign(true)}
                    className="px-5 py-2 bg-white hover:bg-neutral-100 text-neutral-950 font-bold rounded-lg text-xs cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>Ajouter & Lancer les appels</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* MODAL 2: CREATE / EDIT CAMPAIGN */}
      {isCampaignModalOpen && (
        <Modal
          isOpen={isCampaignModalOpen}
          onClose={() => setIsCampaignModalOpen(false)}
          title={editingCampaign?.id ? `Modifier : ${editingCampaign.name}` : 'Créer une Nouvelle Campagne'}
          subtitle="Configurez vos critères de ciblage, script et objections"
          maxWidth="max-w-2xl"
        >
          <CampaignFormModal
            campaign={editingCampaign}
            branches={branches}
            onSave={async (camp) => {
              await savePhoningCampaign(camp);
              setIsCampaignModalOpen(false);
            }}
            onCancel={() => setIsCampaignModalOpen(false)}
          />
        </Modal>
      )}
    </div>
  );
};

/**
 * Sub-component for Campaign editing form
 */
const CampaignFormModal: React.FC<{
  campaign: InternalPhoningCampaign | null;
  branches: Array<{ id: string; name: string; code: string }>;
  onSave: (camp: InternalPhoningCampaign) => Promise<void>;
  onCancel: () => void;
}> = ({ campaign, branches, onSave, onCancel }) => {
  const [name, setName] = useState(campaign?.name || '');
  const [targetSector, setTargetSector] = useState(campaign?.targetSector || '');
  const [location, setLocation] = useState(campaign?.location || 'France');
  const [objective, setObjective] = useState(campaign?.objective || '');
  const [branchId, setBranchId] = useState(campaign?.branchId || branches[0]?.id || '');
  const [status, setStatus] = useState<InternalPhoningCampaign['status']>(campaign?.status || 'Active');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Template pre-fill
  const handleApplyTemplate = (tmpl: InternalPhoningCampaign) => {
    setName(tmpl.name);
    setObjective(tmpl.objective);
    setBranchId(tmpl.branchId || branches[0]?.id || '');
    if (tmpl.targetSector) setTargetSector(tmpl.targetSector);
    if (tmpl.location) setLocation(tmpl.location);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Le nom de la campagne est requis.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const now = new Date().toISOString();
      const payload: InternalPhoningCampaign = {
        id: campaign?.id || `camp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: name.trim(),
        targetSector: targetSector.trim() || undefined,
        location: location.trim() || undefined,
        objective: objective.trim(),
        branchId,
        targetAudience: targetSector.trim() || name.trim(),
        status,
        steps: campaign?.steps || [
          {
            id: `step_${Date.now()}_1`,
            stepNumber: 1,
            name: 'Accroche & Respect du temps',
            goal: 'Capter l’attention avec respect et valider l’écoute',
            possibleQuestions: ['Bonjour [Nom], avez-vous deux minutes pour échanger sur vos processus opérationnels ?'],
            usableProofs: ['Approche d’ingénierie d’affaires NEXUS : L’entreprise d’abord. La technologie ensuite.'],
            conclusionTriggers: ['L’interlocuteur confirme avoir 2 minutes'],
            tips: 'Ton posé et confraternel',
          },
          {
            id: `step_${Date.now()}_2`,
            stepNumber: 2,
            name: 'Découverte des frictions & Cadrage',
            goal: 'Identifier les goulots d’étranglement ou surcharges actuelles',
            possibleQuestions: ['Quelles sont vos priorités actuelles pour fluidifier la charge de vos équipes ?'],
            usableProofs: ['Gains de temps mesurables dès le premier diagnostic'],
            conclusionTriggers: ['Intérêt exprimé pour un audit'],
            tips: 'Écoute active',
          },
          {
            id: `step_${Date.now()}_3`,
            stepNumber: 3,
            name: 'Proposition de Diagnostic de 45 minutes',
            goal: 'Proposer une session de cadrage sans engagement',
            possibleQuestions: ['Seriez-vous ouvert à une session d’échange de 45 min pour auditer vos besoins ?'],
            usableProofs: ['Remise d’une note de cadrage synthétique offerte'],
            conclusionTriggers: ['Accord sur le principe'],
            tips: 'Mettre en avant la gratuité de la découverte mutuelle',
          },
          {
            id: `step_${Date.now()}_4`,
            stepNumber: 4,
            name: 'Fixation du créneau',
            goal: 'Valider une date et heure ferme dans les 10 jours',
            possibleQuestions: ['Seriez-vous plus disponible mardi matin ou jeudi après-midi ?'],
            usableProofs: ['Invitation d’agenda avec lien sécurisé'],
            conclusionTriggers: ['Date et heure validées'],
            tips: 'Proposer 2 choix fermes',
          },
        ],
        objections: campaign?.objections || [
          {
            id: `obj_${Date.now()}_1`,
            title: '« Pas le temps en ce moment »',
            category: 'Temps',
            comprendre: 'Surcharge ou barrage protecteur',
            repondre: 'Je comprends parfaitement, c’est précisément lorsque le temps manque que les processus méritent d’être allégés.',
            rebondir: 'Est-ce une surcharge ponctuelle ou un état récurrent depuis plusieurs mois ?',
            preuves: ['Audit initial de 45 minutes condensé'],
            erreursAEviter: ['Insister lourdement sans écouter'],
            prochaineAction: 'Caler un rappel à date convenue',
          },
          {
            id: `obj_${Date.now()}_2`,
            title: '« Envoyez-moi une plaquette ou un email »',
            category: 'Envoyez un email',
            comprendre: 'Tentative d’évacuer l’appel',
            repondre: 'Très volontiers, mais pour que le document soit réellement pertinent pour votre activité...',
            rebondir: '...quel est votre défi prioritaire du moment : la fluidification des flux ou la réduction de la charge mentale ?',
            preuves: ['Étude de cas ciblée'],
            erreursAEviter: ['Raccrocher immédiatement sans poser de question'],
            prochaineAction: 'Noter le focus et envoyer le document ciblé',
          },
        ],
        createdAt: campaign?.createdAt || now,
        updatedAt: now,
      };

      await onSave(payload);
    } catch (err: unknown) {
      setError((err as Error).message || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-xs text-neutral-300">
      {error && <div className="p-3 bg-red-950/80 border border-red-800 text-red-200 rounded-lg">{error}</div>}

      {/* Template selector chips */}
      <div>
        <span className="text-[10px] font-mono uppercase text-neutral-400 block mb-1.5 font-semibold">
          Pré-remplir avec un modèle type (Facultatif) :
        </span>
        <div className="flex flex-wrap gap-2">
          {CAMPAIGN_TEMPLATES.map((tmpl) => (
            <button
              key={tmpl.id}
              type="button"
              onClick={() => handleApplyTemplate(tmpl)}
              className="px-2.5 py-1 rounded-full bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-[11px] text-neutral-300 cursor-pointer"
            >
              {tmpl.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-neutral-400 mb-1">Nom de la campagne *</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Cadrage PME Lyon, BTP Bordeaux..."
            className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white focus:outline-none focus:border-cyan-400"
          />
        </div>

        <div>
          <label className="block text-neutral-400 mb-1">Branche NEXUS rattachée</label>
          <select
            value={branchId}
            onChange={(e) => setBranchId(e.target.value)}
            className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white focus:outline-none focus:border-cyan-400"
          >
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.code})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-neutral-400 mb-1">Secteur / Métier cible</label>
          <input
            type="text"
            value={targetSector}
            onChange={(e) => setTargetSector(e.target.value)}
            placeholder="Ex: Experts-comptables, BTP, Agences..."
            className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white focus:outline-none focus:border-cyan-400"
          />
        </div>

        <div>
          <label className="block text-neutral-400 mb-1">Zone géographique / Ville</label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Ex: Lyon, Bordeaux, Paris..."
            className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white focus:outline-none focus:border-cyan-400"
          />
        </div>
      </div>

      <div>
        <label className="block text-neutral-400 mb-1">Objectif principal de l'appel</label>
        <textarea
          rows={2}
          value={objective}
          onChange={(e) => setObjective(e.target.value)}
          placeholder="Ex: Détecter les goulots d’étranglement organisationnels et convenir d’un diagnostic initial de 45 minutes."
          className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white focus:outline-none focus:border-cyan-400"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-neutral-400 mb-1">Statut initial</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white focus:outline-none focus:border-cyan-400"
          >
            <option value="Active">Active (Prête pour les appels)</option>
            <option value="Cadrage">Cadrage (Préparation)</option>
            <option value="En pause">En pause</option>
            <option value="Terminée">Terminée</option>
          </select>
        </div>
      </div>

      <div className="pt-3 flex items-center justify-end gap-2 border-t border-neutral-800">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-xs cursor-pointer"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2 bg-white hover:bg-neutral-100 text-neutral-950 font-bold rounded-lg text-xs cursor-pointer shadow-xs disabled:opacity-50"
        >
          {saving ? 'Enregistrement...' : 'Enregistrer la campagne'}
        </button>
      </div>
    </form>
  );
};
