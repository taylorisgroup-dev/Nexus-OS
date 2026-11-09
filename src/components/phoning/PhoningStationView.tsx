import React, { useState, useMemo, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../ui/Modal';
import type {
  Prospect,
  ProspectStatus,
  Interaction,
  TaskPriority,
  CallResult,
  InternalPhoningCampaign,
  ConversationStep,
  ObjectionItem,
  ObjectionCategory,
  ActiveSection,
} from '../../types/nexus';
import { CALL_RESULTS } from '../../types/phoning';
import {
  PhoneCall,
  Search,
  Filter,
  CheckCircle2,
  Calendar,
  Clock,
  AlertTriangle,
  Layers,
  Building2,
  Users,
  ChevronRight,
  BookOpen,
  HelpCircle,
  Shield,
  Plus,
  Edit2,
  Save,
  Download,
  FileText,
  Lock,
  ArrowRight,
  CheckSquare,
  Check,
  X,
  Copy,
  MessageSquare,
  Send,
  UserCheck,
  Briefcase,
  Play,
  RotateCw,
  Zap,
  Sparkles,
  MapPin,
  ExternalLink,
  Star,
} from 'lucide-react';
import { ProspectEnrichmentModal } from '../prospects/ProspectEnrichmentModal';

interface PhoningStationViewProps {
  onNavigateSection?: (section: ActiveSection) => void;
  initialCampaignId?: string;
}

export const PhoningStationView: React.FC<PhoningStationViewProps> = ({
  onNavigateSection,
  initialCampaignId,
}) => {
  const { isOwner, user } = useAuth();
  const {
    prospects,
    branches,
    offers,
    phoningCampaigns,
    savePhoningCampaign,
    logPhoningCall,
    getInteractions,
    loadedInteractions,
    fetchInteractionsForProspects,
  } = useData();

  // Active top tab in the workstation
  const [activeTab, setActiveTab] = useState<'station' | 'reporting' | 'campaigns_manager'>('station');

  // Active Campaign Filter
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>(() => {
    if (initialCampaignId) return initialCampaignId;
    return phoningCampaigns.find((c) => c.status === 'Active')?.id || phoningCampaigns[0]?.id || '';
  });

  const [queueCampaignFilter, setQueueCampaignFilter] = useState<'all' | 'current'>(
    initialCampaignId ? 'current' : 'all'
  );

  useEffect(() => {
    if (initialCampaignId) {
      setSelectedCampaignId(initialCampaignId);
      setQueueCampaignFilter('current');
    }
  }, [initialCampaignId]);

  // Selected Campaign object
  const currentCampaign = useMemo(() => {
    return phoningCampaigns.find((c) => c.id === selectedCampaignId) || phoningCampaigns[0] || null;
  }, [phoningCampaigns, selectedCampaignId]);

  // Queue Filters
  const [queueBranchFilter, setQueueBranchFilter] = useState<string>('all');
  const [queueStatusFilter, setQueueStatusFilter] = useState<string>('all');
  const [queueUrgencyFilter, setQueueUrgencyFilter] = useState<'all' | 'overdue' | 'today' | 'uncontacted'>('all');
  const [queueSearchTerm, setQueueSearchTerm] = useState<string>('');

  // Selected Prospect in concentrated call panel
  const [selectedProspectId, setSelectedProspectId] = useState<string | null>(null);

  // Active Prospect data
  const selectedProspect = useMemo(() => {
    return prospects.find((p) => p.id === selectedProspectId) || null;
  }, [prospects, selectedProspectId]);

  // Call Panel Tab: 'guide' | 'objections' | 'history' | 'call_log'
  const [panelTab, setPanelTab] = useState<'guide' | 'objections' | 'history' | 'call_log'>('guide');

  // Prospect interactions loaded for current prospect
  const [prospectInteractions, setProspectInteractions] = useState<Interaction[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);

  // Copy feedback
  const [copiedPhone, setCopiedPhone] = useState<boolean>(false);
  const [isEnrichModalOpen, setIsEnrichModalOpen] = useState<boolean>(false);

  // Post-Call Form State
  const [callResult, setCallResult] = useState<CallResult>('Échange constructif');
  const [callNotes, setCallNotes] = useState<string>('');
  const [callNextStep, setCallNextStep] = useState<string>('');
  const [callNextContactDate, setCallNextContactDate] = useState<string>('');
  const [suggestedStatus, setSuggestedStatus] = useState<ProspectStatus>('Échange');
  const [selectedObjectionMet, setSelectedObjectionMet] = useState<string>('');
  const [createReminderTask, setCreateReminderTask] = useState<boolean>(true);
  const [reminderPriority, setReminderPriority] = useState<TaskPriority>('Haute');
  const [isSubmittingCall, setIsSubmittingCall] = useState<boolean>(false);
  const [callSubmitSuccess, setCallSubmitSuccess] = useState<string | null>(null);
  const [callSubmitError, setCallSubmitError] = useState<string | null>(null);

  // Active Step in Conversation Guide
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);

  // Objections Search & Filter
  const [objectionSearch, setObjectionSearch] = useState<string>('');
  const [objectionCategoryFilter, setObjectionCategoryFilter] = useState<string>('all');
  const [inspectedObjection, setInspectedObjection] = useState<ObjectionItem | null>(null);

  // Reporting Period Filter
  const [reportPeriod, setReportPeriod] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [reportCampaignFilter, setReportCampaignFilter] = useState<string>('all');

  // Campaign Manager Modals
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState<boolean>(false);
  const [editingCampaign, setEditingCampaign] = useState<InternalPhoningCampaign | null>(null);

  // Pre-load interactions for all prospects when reporting tab opens
  useEffect(() => {
    if (activeTab === 'reporting' && prospects.length > 0) {
      const ids = prospects.map((p) => p.id);
      fetchInteractionsForProspects(ids);
    }
  }, [activeTab, prospects]);

  // Load interactions when selected prospect changes
  useEffect(() => {
    if (selectedProspectId) {
      setLoadingHistory(true);
      getInteractions(selectedProspectId)
        .then((items) => {
          setProspectInteractions(items || []);
        })
        .catch(() => setProspectInteractions([]))
        .finally(() => setLoadingHistory(false));

      // Reset form fields with sensible defaults for selected prospect
      const today = new Date().toISOString().split('T')[0];
      setCallResult('Échange constructif');
      setCallNotes('');
      setCallNextStep('');
      setCallNextContactDate(today);
      setSelectedObjectionMet('');
      setCallSubmitSuccess(null);
      setCallSubmitError(null);
      setActiveStepIndex(0);
    } else {
      setProspectInteractions([]);
    }
  }, [selectedProspectId]);

  // Adjust suggested status based on call result selection
  useEffect(() => {
    if (callResult === 'Rendez-vous pris') {
      setSuggestedStatus('Rendez-vous');
      setCreateReminderTask(true);
      setReminderPriority('Haute');
    } else if (callResult === 'Échange constructif') {
      setSuggestedStatus('Échange');
      setCreateReminderTask(true);
      setReminderPriority('Moyenne');
    } else if (callResult === 'Rappel planifié') {
      setSuggestedStatus('À contacter');
      setCreateReminderTask(true);
      setReminderPriority('Haute');
    } else if (callResult === 'Barrage secrétaire') {
      setSuggestedStatus('À contacter');
      setCreateReminderTask(true);
      setReminderPriority('Moyenne');
    } else if (callResult === 'Pas de besoin actuel') {
      setSuggestedStatus('En attente');
      setCreateReminderTask(false);
    } else if (callResult === 'Refus catégorique') {
      setSuggestedStatus('Perdu');
      setCreateReminderTask(false);
    }
  }, [callResult]);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Filter prospects in queue
  const filteredQueue = useMemo(() => {
    return prospects
      .filter((p) => !p.isArchived)
      .filter((p) => {
        // Specific campaign filter
        if (queueCampaignFilter === 'current' && currentCampaign) {
          const matchId = p.campaignId && p.campaignId === currentCampaign.id;
          const matchName = p.campaignName && p.campaignName.toLowerCase() === currentCampaign.name.toLowerCase();
          if (!matchId && !matchName) {
            return false;
          }
        }

        // Campaign branch matching
        if (currentCampaign && currentCampaign.branchId) {
          // If a prospect is explicitly linked to another branch, filter it unless queue branch filter is all
          if (p.branchId && p.branchId !== currentCampaign.branchId && queueBranchFilter === 'campaign') {
            return false;
          }
        }

        // Branch filter
        if (queueBranchFilter !== 'all' && queueBranchFilter !== 'campaign') {
          if (queueBranchFilter === 'unassigned') {
            if (p.branchId) return false;
          } else if (p.branchId !== queueBranchFilter) {
            return false;
          }
        }

        // Status filter
        if (queueStatusFilter !== 'all') {
          if (p.status !== queueStatusFilter) return false;
        }

        // Urgency filter
        if (queueUrgencyFilter === 'overdue') {
          if (!p.nextContactDate || p.nextContactDate >= todayStr) return false;
        } else if (queueUrgencyFilter === 'today') {
          if (p.nextContactDate !== todayStr) return false;
        } else if (queueUrgencyFilter === 'uncontacted') {
          if (p.status !== 'À qualifier' && p.status !== 'À contacter') return false;
        }

        // Search term
        if (queueSearchTerm.trim()) {
          const q = queueSearchTerm.toLowerCase();
          const matchCompany = p.company.toLowerCase().includes(q);
          const matchContact = p.contactName.toLowerCase().includes(q);
          const matchPhone = (p.phone || '').toLowerCase().includes(q);
          const matchSector = (p.sector || '').toLowerCase().includes(q);
          return matchCompany || matchContact || matchPhone || matchSector;
        }

        return true;
      })
      .sort((a, b) => {
        // Prioritize overdue, then today, then nearest nextContactDate
        const aOverdue = a.nextContactDate && a.nextContactDate < todayStr ? 1 : 0;
        const bOverdue = b.nextContactDate && b.nextContactDate < todayStr ? 1 : 0;
        if (aOverdue !== bOverdue) return bOverdue - aOverdue;

        const aToday = a.nextContactDate === todayStr ? 1 : 0;
        const bToday = b.nextContactDate === todayStr ? 1 : 0;
        if (aToday !== bToday) return bToday - aToday;

        return (a.nextContactDate || '9999').localeCompare(b.nextContactDate || '9999');
      });
  }, [prospects, currentCampaign, queueBranchFilter, queueStatusFilter, queueUrgencyFilter, queueSearchTerm, todayStr]);

  // Objections filtered for current campaign
  const filteredObjections = useMemo(() => {
    if (!currentCampaign) return [];
    return currentCampaign.objections.filter((obj) => {
      if (objectionCategoryFilter !== 'all' && obj.category !== objectionCategoryFilter) {
        return false;
      }
      if (objectionSearch.trim()) {
        const q = objectionSearch.toLowerCase();
        const mTitle = obj.title.toLowerCase().includes(q);
        const mRepondre = obj.repondre.toLowerCase().includes(q);
        const mRebondir = obj.rebondir.toLowerCase().includes(q);
        return mTitle || mRepondre || mRebondir;
      }
      return true;
    });
  }, [currentCampaign, objectionCategoryFilter, objectionSearch]);

  // Aggregate all loaded interactions into a single flat list for real reporting
  const allReportingInteractions = useMemo(() => {
    const list: Interaction[] = [];
    Object.values(loadedInteractions).forEach((items) => {
      items.forEach((it) => {
        if (it.type === 'Appel') {
          list.push(it);
        }
      });
    });
    return list;
  }, [loadedInteractions]);

  // Filter reporting interactions by period & campaign
  const filteredReportingInteractions = useMemo(() => {
    const now = new Date();
    const currentWeekStart = new Date(now);
    currentWeekStart.setDate(now.getDate() - now.getDay());

    return allReportingInteractions.filter((it) => {
      // Campaign filter
      if (reportCampaignFilter !== 'all' && it.campaignId !== reportCampaignFilter) {
        return false;
      }

      // Period filter
      if (reportPeriod === 'today') {
        return it.date === todayStr;
      }
      if (reportPeriod === 'week') {
        const d = new Date(it.date);
        return d >= currentWeekStart;
      }
      if (reportPeriod === 'month') {
        return it.date.slice(0, 7) === todayStr.slice(0, 7);
      }
      return true;
    });
  }, [allReportingInteractions, reportPeriod, reportCampaignFilter, todayStr]);

  // Compute session metrics with explicit denominators
  const reportingStats = useMemo(() => {
    const totalCalls = filteredReportingInteractions.length;
    let conversations = 0;
    let appointments = 0;
    let qualified = 0;
    let reminders = 0;
    let barriers = 0;
    let unreachable = 0;
    let refusals = 0;

    filteredReportingInteractions.forEach((it) => {
      const res = it.callResult as CallResult | undefined;
      const resConfig = CALL_RESULTS.find((r) => r.id === res);

      if (resConfig?.isContacted) conversations++;
      if (resConfig?.isAppointment) appointments++;
      if (resConfig?.isQualified) qualified++;
      if (res === 'Rappel planifié') reminders++;
      if (res === 'Barrage secrétaire') barriers++;
      if (res === 'Injoignable / Messagerie') unreachable++;
      if (res === 'Refus catégorique') refusals++;
    });

    const conversationRate = totalCalls > 0 ? Math.round((conversations / totalCalls) * 100) : 0;
    const appointmentRate = conversations > 0 ? Math.round((appointments / conversations) * 100) : 0;
    const qualificationRate = conversations > 0 ? Math.round((qualified / conversations) * 100) : 0;

    return {
      totalCalls,
      conversations,
      appointments,
      qualified,
      reminders,
      barriers,
      unreachable,
      refusals,
      conversationRate,
      appointmentRate,
      qualificationRate,
    };
  }, [filteredReportingInteractions]);

  // Handle post-call logging
  const handleLogCall = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProspect) return;

    setIsSubmittingCall(true);
    setCallSubmitError(null);
    setCallSubmitSuccess(null);

    try {
      const result = await logPhoningCall({
        prospectId: selectedProspect.id,
        result: callResult,
        notes: callNotes.trim(),
        nextStep: callNextStep.trim(),
        nextContactDate: callNextContactDate || undefined,
        newProspectStatus: suggestedStatus,
        campaignId: currentCampaign?.id,
        campaignName: currentCampaign?.name,
        branchId: currentCampaign?.branchId || selectedProspect.branchId,
        objectionMetTitle: selectedObjectionMet || undefined,
        createReminderTask,
        reminderTaskDueDate: callNextContactDate,
        reminderTaskPriority: reminderPriority,
      });

      setCallSubmitSuccess(
        `Appel enregistré dans l’historique avec succès.${
          result.taskId ? ' Tâche de relance créée dans vos actions.' : ''
        }`
      );

      // Reload prospect interactions
      const freshItems = await getInteractions(selectedProspect.id);
      setProspectInteractions(freshItems || []);

      // Clean inputs
      setCallNotes('');
      setCallNextStep('');
      setSelectedObjectionMet('');
    } catch (err: unknown) {
      setCallSubmitError((err as Error).message || 'Erreur lors de l’enregistrement de l’appel.');
    } finally {
      setIsSubmittingCall(false);
    }
  };

  const copyPhoneNumber = (phone: string) => {
    if (!phone) return;
    navigator.clipboard.writeText(phone);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  // Export Reporting to CSV
  const handleExportReportCSV = () => {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const lines: string[] = [];
    lines.push(`RAPPORT PROSPECTION TÉLÉPHONIQUE - NEXUS OS`);
    lines.push(`Généré le : ${now.toLocaleString('fr-FR')}`);
    lines.push(`Période filtrée : ${reportPeriod}`);
    lines.push(`Campagne : ${reportCampaignFilter === 'all' ? 'Toutes' : reportCampaignFilter}`);
    lines.push(``);
    lines.push(`Date;Entreprise;Résultat;Campagne;Branche;Objection;Prochaine Action;Notes`);

    filteredReportingInteractions.forEach((it) => {
      const p = prospects.find((pr) => pr.id === it.prospectId);
      lines.push(
        [
          it.date,
          `"${(p?.company || 'Prospect').replace(/"/g, '""')}"`,
          `"${(it.callResult || 'Non précisé').replace(/"/g, '""')}"`,
          `"${(it.campaignName || '').replace(/"/g, '""')}"`,
          `"${(it.branchId || '').replace(/"/g, '""')}"`,
          `"${(it.objectionMet || '').replace(/"/g, '""')}"`,
          `"${(it.nextStep || '').replace(/"/g, '""')}"`,
          `"${(it.summary || '').replace(/"/g, '""')}"`,
        ].join(';')
      );
    });

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `nexus_prospection_rapport_${dateStr}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner: Workstation Role & Security Safeguards */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-neutral-400 font-mono uppercase tracking-wider">
                NEXUS OS · Ingénierie d’Affaires
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800 flex items-center gap-1">
                <PhoneCall className="w-3 h-3 text-cyan-400" />
                <span>Poste Interne Opérationnel</span>
              </span>
              {isOwner ? (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800">
                  Mode Direction / Manager
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-neutral-800 text-neutral-300 border border-neutral-700">
                  Mode Opérateur Prospection
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight mt-1">
              Prospection Téléphonique & Cadrage NEXUS
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Cockpit d’appels à haute valeur ajoutée. Cadrage méthodique des besoins avant toute proposition technique.
            </p>
          </div>

          {/* Campaign Selector in Banner */}
          <div className="flex items-center gap-3 bg-neutral-950 border border-neutral-800 p-2.5 rounded-xl">
            <Briefcase className="w-4 h-4 text-cyan-400 shrink-0" />
            <div>
              <span className="text-[10px] text-neutral-500 font-mono uppercase block">Campagne active</span>
              {phoningCampaigns.length === 0 ? (
                <button
                  type="button"
                  onClick={() => onNavigateSection?.('campaigns')}
                  className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 underline cursor-pointer text-left block"
                >
                  + Créer une campagne
                </button>
              ) : (
                <select
                  value={selectedCampaignId}
                  onChange={(e) => setSelectedCampaignId(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-neutral-100 focus:outline-none cursor-pointer"
                >
                  {phoningCampaigns.map((c) => (
                    <option key={c.id} value={c.id} className="bg-neutral-900 text-neutral-100">
                      {c.name} ({c.status})
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>

        {/* Workstation Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('station')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-2 cursor-pointer ${
                activeTab === 'station'
                  ? 'bg-white text-neutral-950 font-semibold shadow-xs'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Poste d'Appel Concentré</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-300">
                {filteredQueue.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('reporting')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-2 cursor-pointer ${
                activeTab === 'reporting'
                  ? 'bg-white text-neutral-950 font-semibold shadow-xs'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>Session & Reporting Réels</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-300">
                {reportingStats.totalCalls} appel(s)
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('campaigns_manager')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-2 cursor-pointer ${
                activeTab === 'campaigns_manager'
                  ? 'bg-white text-neutral-950 font-semibold shadow-xs'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Campagnes, Scripts & Objections</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-300">
                {phoningCampaigns.length}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-neutral-500 font-mono">
            <Lock className="w-3 h-3 text-emerald-400" />
            <span>Sécurité interne : aucun appel automatique, zéro tiers externe</span>
          </div>
        </div>
      </div>

      {/* TAB 1: POSTE D'APPEL CONCENTRÉ */}
      {activeTab === 'station' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: Queue of Contacts to Call (4 cols) */}
          <div className="lg:col-span-4 bg-neutral-900 border border-neutral-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-400" />
                <h3 className="font-semibold text-white text-sm">File de Prospection</h3>
              </div>
              <div className="flex items-center gap-2">
                {onNavigateSection && (
                  <button
                    type="button"
                    onClick={() => onNavigateSection('acquisition')}
                    title="Lancer le scraping web pour trouver de nouveaux prospects"
                    className="px-2 py-0.5 bg-cyan-950 hover:bg-cyan-900 border border-cyan-800 text-cyan-300 rounded text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                  >
                    <Zap className="w-3 h-3 text-cyan-400" />
                    <span>+ Scraper</span>
                  </button>
                )}
                <span className="text-[11px] font-mono text-neutral-400">
                  {filteredQueue.length}
                </span>
              </div>
            </div>

            {/* Quick Queue Filters */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={queueSearchTerm}
                  onChange={(e) => setQueueSearchTerm(e.target.value)}
                  placeholder="Entreprise, contact, tel..."
                  className="w-full pl-8 pr-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                <select
                  value={queueCampaignFilter}
                  onChange={(e) => setQueueCampaignFilter(e.target.value as any)}
                  className="px-2 py-1 bg-neutral-950 border border-neutral-800 rounded text-[11px] text-neutral-300 focus:outline-none truncate"
                  title="Filtrer par campagne"
                >
                  <option value="all">Tous ({prospects.length})</option>
                  {currentCampaign && (
                    <option value="current">Campagne active</option>
                  )}
                </select>

                <select
                  value={queueUrgencyFilter}
                  onChange={(e) => setQueueUrgencyFilter(e.target.value as any)}
                  className="px-2 py-1 bg-neutral-950 border border-neutral-800 rounded text-[11px] text-neutral-300 focus:outline-none"
                >
                  <option value="all">Toutes priorités</option>
                  <option value="overdue">En retard</option>
                  <option value="today">Aujourd'hui</option>
                  <option value="uncontacted">Non contactés</option>
                </select>

                <select
                  value={queueStatusFilter}
                  onChange={(e) => setQueueStatusFilter(e.target.value)}
                  className="px-2 py-1 bg-neutral-950 border border-neutral-800 rounded text-[11px] text-neutral-300 focus:outline-none"
                >
                  <option value="all">Tous statuts</option>
                  <option value="À qualifier">À qualifier</option>
                  <option value="À contacter">À contacter</option>
                  <option value="Échange">Échange</option>
                  <option value="Rendez-vous">RDV</option>
                  <option value="En attente">En attente</option>
                </select>
              </div>
            </div>

            {/* Contacts List */}
            <div className="space-y-2 max-h-[620px] overflow-y-auto pr-1">
              {filteredQueue.length === 0 ? (
                <div className="p-6 text-center text-xs text-neutral-400 space-y-3 bg-neutral-950/80 border border-neutral-800 rounded-xl">
                  <Zap className="w-8 h-8 mx-auto text-cyan-400 mb-1" />
                  <div>
                    <p className="text-white font-bold text-sm">
                      {queueCampaignFilter === 'current' && currentCampaign
                        ? `Aucun prospect dans "${currentCampaign.name}"`
                        : "File d'appels vide"}
                    </p>
                    <p className="text-[11px] text-neutral-400 mt-1 leading-relaxed">
                      {queueCampaignFilter === 'current' && currentCampaign
                        ? `Scrapez en direct des entreprises pour cette campagne (${currentCampaign.targetSector || 'Cible'} - ${currentCampaign.location || 'France'}).`
                        : "Aucun prospect prêt à être appelé dans cette vue. Lancez une campagne ou l'acquisition pour scraper de vraies entreprises."}
                    </p>
                  </div>
                  <div className="space-y-2 pt-1">
                    {onNavigateSection && (
                      <button
                        type="button"
                        onClick={() => onNavigateSection('campaigns')}
                        className="w-full py-2 bg-white hover:bg-neutral-100 text-neutral-950 font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Layers className="w-3.5 h-3.5 text-cyan-600" />
                        <span>Gérer les Campagnes & Scraper</span>
                      </button>
                    )}
                    {queueCampaignFilter === 'current' && (
                      <button
                        type="button"
                        onClick={() => setQueueCampaignFilter('all')}
                        className="w-full py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-[11px] transition-colors cursor-pointer"
                      >
                        Afficher tous les prospects du fichier ({prospects.length})
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                filteredQueue.map((p) => {
                  const isSelected = p.id === selectedProspectId;
                  const isOverdue = p.nextContactDate && p.nextContactDate < todayStr;
                  const isToday = p.nextContactDate === todayStr;
                  const branch = branches.find((b) => b.id === p.branchId);

                  return (
                    <div
                      key={p.id}
                      onClick={() => setSelectedProspectId(p.id)}
                      className={`p-3 rounded-lg border transition-all cursor-pointer space-y-1.5 ${
                        isSelected
                          ? 'bg-neutral-800/90 border-cyan-500/80 shadow-md ring-1 ring-cyan-500/40'
                          : 'bg-neutral-950/60 hover:bg-neutral-950 border-neutral-800/80 hover:border-neutral-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <div className="min-w-0">
                          <h4 className="font-semibold text-white text-xs truncate">{p.company}</h4>
                          <p className="text-[11px] text-neutral-400 truncate">{p.contactName}</p>
                        </div>

                        {branch && (
                          <span
                            className="text-[9px] font-mono px-1.5 py-0.2 rounded border font-semibold shrink-0"
                            style={{
                              borderColor: `${branch.color || '#0879E8'}55`,
                              color: branch.color || '#0879E8',
                            }}
                          >
                            {branch.code}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400 pt-1 border-t border-neutral-800/60">
                        <span className="text-cyan-300 font-medium">{p.phone || 'Sans tel.'}</span>

                        {isOverdue && (
                          <span className="text-red-400 font-bold flex items-center gap-0.5">
                            <AlertTriangle className="w-2.5 h-2.5" />
                            Retard : {p.nextContactDate}
                          </span>
                        )}
                        {isToday && (
                          <span className="text-amber-400 font-bold">
                            Aujourd'hui
                          </span>
                        )}
                        {!isOverdue && !isToday && p.nextContactDate && (
                          <span>Relance : {p.nextContactDate}</span>
                        )}
                        {!p.nextContactDate && <span className="text-neutral-600">Pas de date</span>}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* RIGHT / MAIN COLUMN: Concentrated Call Workstation (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            {!selectedProspect ? (
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-12 text-center space-y-3">
                <PhoneCall className="w-10 h-10 mx-auto text-neutral-600" />
                <h3 className="text-base font-semibold text-white">Sélectionnez un contact dans la file</h3>
                <p className="text-xs text-neutral-400 max-w-md mx-auto leading-relaxed">
                  Le poste d'appel concentré affichera immédiatement le contexte métier, les besoins identifiés, le guide de conversation par étapes, la bibliothèque d'objections et le formulaire post-appel.
                </p>
                <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg inline-flex items-center gap-2 text-xs text-neutral-400 font-mono">
                  <Shield className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Conformité NEXUS : Vous maîtrisez la numérotation depuis votre combiné.</span>
                </div>
              </div>
            ) : (
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-5">
                {/* Active Contact Identity & Objective Header */}
                <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-white tracking-tight">
                        {selectedProspect.company}
                      </h3>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-neutral-800 text-neutral-200 border border-neutral-700">
                        {selectedProspect.status}
                      </span>
                      {selectedProspect.branchId && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-950/80 text-blue-300 border border-blue-800">
                          {branches.find((b) => b.id === selectedProspect.branchId)?.name || 'Branche'}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-300 font-mono">
                      <span>Contact : <strong className="text-white">{selectedProspect.contactName}</strong></span>
                      {selectedProspect.email && <span>· {selectedProspect.email}</span>}
                      {selectedProspect.city && <span>· <strong className="text-neutral-200">{selectedProspect.city}</strong></span>}
                      {selectedProspect.sector && <span className="text-neutral-400">· {selectedProspect.sector}</span>}
                    </div>
                  </div>

                  {/* Actions & Phone Number */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Google Maps link */}
                    <a
                      href={
                        selectedProspect.mapsUrl ||
                        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                          `${selectedProspect.company} ${selectedProspect.city || ''}`
                        )}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
                      title="Vérifier sur Google Maps"
                    >
                      <MapPin className="w-3.5 h-3.5 text-red-400" />
                      <span className="hidden sm:inline">Google Maps</span>
                      <ExternalLink className="w-2.5 h-2.5 text-neutral-500" />
                    </a>

                    {/* Enrich with Google Maps & Web */}
                    <button
                      type="button"
                      onClick={() => setIsEnrichModalOpen(true)}
                      className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-cyan-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                      title="Enrichir via Google Maps et le web"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{selectedProspect.enrichedData ? 'Données Enrichies' : 'Enrichir (Maps/Web)'}</span>
                    </button>

                    {/* Phone Number with Manual Copy */}
                    <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 px-3 py-1.5 rounded-lg">
                      <div className="text-right">
                        <span className="text-[9px] uppercase tracking-wider text-neutral-500 block font-mono">Numéro</span>
                        <span className="text-xs font-bold font-mono text-cyan-300">
                          {selectedProspect.phone || 'Non renseigné'}
                        </span>
                      </div>

                      {selectedProspect.phone && (
                        <button
                          type="button"
                          onClick={() => copyPhoneNumber(selectedProspect.phone)}
                          className="p-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded transition-colors"
                          title="Copier le numéro"
                        >
                          {copiedPhone ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Enriched Data Card if available */}
                {selectedProspect.enrichedData && (
                  <div className="p-3 bg-neutral-950/80 border border-neutral-800 rounded-lg text-xs grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-mono uppercase text-neutral-400 block">Adresse physique vérifiée</span>
                      <p className="text-white font-medium text-[11px] truncate">{selectedProspect.enrichedData.fullAddress || selectedProspect.address || selectedProspect.city}</p>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-mono uppercase text-neutral-400 block">Avis & Note Google Maps</span>
                      <p className="text-amber-400 font-bold text-[11px] flex items-center gap-1">
                        <Star className="w-3 h-3 fill-amber-400" />
                        <span>{selectedProspect.enrichedData.googleRating ? `${selectedProspect.enrichedData.googleRating}/5` : 'Vérifié'}</span>
                        {selectedProspect.enrichedData.googleReviewCount && (
                          <span className="text-neutral-400 font-normal">({selectedProspect.enrichedData.googleReviewCount} avis)</span>
                        )}
                      </p>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-mono uppercase text-neutral-400 block">Maturité digitale & Web</span>
                      <p className="text-cyan-300 font-medium text-[11px]">{selectedProspect.enrichedData.digitalMaturity || 'Moyenne'} · {selectedProspect.enrichedData.websiteStatus || 'En ligne'}</p>
                    </div>
                  </div>
                )}

                {/* Detected Needs & Context Summary */}
                {selectedProspect.needsSummary && (
                  <div className="p-3 bg-neutral-950/60 border border-neutral-800/80 rounded-lg text-xs space-y-1">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 block">
                      Besoins & Contexte identifiés :
                    </span>
                    <p className="text-neutral-200 leading-relaxed">
                      {selectedProspect.needsSummary}
                    </p>
                  </div>
                )}

                {/* Sub-Tabs for Workstation: Guide / Objections / History / Call Log */}
                <div className="flex items-center border-b border-neutral-800 gap-1 pb-2">
                  <button
                    type="button"
                    onClick={() => setPanelTab('guide')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                      panelTab === 'guide'
                        ? 'bg-neutral-800 text-white font-semibold'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Guide de conversation par étapes</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPanelTab('objections')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                      panelTab === 'objections'
                        ? 'bg-neutral-800 text-white font-semibold'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                    <span>Bibliothèque d'objections</span>
                    <span className="text-[10px] font-mono px-1 rounded bg-neutral-950 text-neutral-400">
                      {currentCampaign?.objections.length || 0}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPanelTab('history')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                      panelTab === 'history'
                        ? 'bg-neutral-800 text-white font-semibold'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5 text-blue-400" />
                    <span>Historique des échanges</span>
                    <span className="text-[10px] font-mono px-1 rounded bg-neutral-950 text-neutral-400">
                      {prospectInteractions.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPanelTab('call_log')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                      panelTab === 'call_log'
                        ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800 font-semibold'
                        : 'text-emerald-400 hover:bg-neutral-800'
                    }`}
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Journaliser l'appel</span>
                  </button>
                </div>

                {/* SUBTAB CONTENT: 1. CONVERSATION GUIDE */}
                {panelTab === 'guide' && (
                  <div className="space-y-4">
                    {/* Stepper Buttons */}
                    {currentCampaign && currentCampaign.steps.length > 0 ? (
                      <>
                        <div className="flex items-center gap-2 overflow-x-auto pb-1">
                          {currentCampaign.steps.map((st, idx) => (
                            <button
                              key={st.id}
                              type="button"
                              onClick={() => setActiveStepIndex(idx)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                                activeStepIndex === idx
                                  ? 'bg-cyan-950 text-cyan-200 border border-cyan-800 shadow-xs'
                                  : 'bg-neutral-950 text-neutral-400 border border-neutral-800 hover:text-white'
                              }`}
                            >
                              <span className="w-4 h-4 rounded-full bg-neutral-800 text-neutral-300 flex items-center justify-center text-[10px] font-mono">
                                {idx + 1}
                              </span>
                              <span>{st.name}</span>
                            </button>
                          ))}
                        </div>

                        {/* Current Active Step Details */}
                        {(() => {
                          const step = currentCampaign.steps[activeStepIndex] || currentCampaign.steps[0];
                          return (
                            <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-5 space-y-4">
                              <div className="flex items-center justify-between border-b border-neutral-800/80 pb-3">
                                <div>
                                  <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400">
                                    Étape {activeStepIndex + 1} sur {currentCampaign.steps.length}
                                  </span>
                                  <h4 className="text-base font-bold text-white">{step.name}</h4>
                                </div>

                                <div className="text-right">
                                  <span className="text-[10px] text-neutral-500 uppercase font-mono block">Objectif précis</span>
                                  <span className="text-xs text-neutral-300 font-medium">{step.goal}</span>
                                </div>
                              </div>

                              {/* Possible Situational Questions */}
                              <div className="space-y-2">
                                <span className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
                                  <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
                                  <span>Questions ouvertes suggérées (Ne pas réciter mécaniquement) :</span>
                                </span>
                                <div className="space-y-2">
                                  {step.possibleQuestions.map((q, qIdx) => (
                                    <div
                                      key={qIdx}
                                      className="p-3 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-200 italic leading-relaxed"
                                    >
                                      « {q} »
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                {/* Usable Proofs */}
                                <div className="space-y-1.5">
                                  <span className="text-xs font-semibold text-neutral-300">
                                    Preuves tangibles NEXUS mobilisables :
                                  </span>
                                  <ul className="space-y-1 text-xs text-neutral-400">
                                    {step.usableProofs.map((prf, pIdx) => (
                                      <li key={pIdx} className="flex items-start gap-1.5">
                                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                                        <span>{prf}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>

                                {/* Conclusion Triggers / Readiness */}
                                <div className="space-y-1.5">
                                  <span className="text-xs font-semibold text-neutral-300">
                                    Signaux de passage à l'étape suivante :
                                  </span>
                                  <ul className="space-y-1 text-xs text-neutral-400">
                                    {step.conclusionTriggers.map((trg, tIdx) => (
                                      <li key={tIdx} className="flex items-start gap-1.5">
                                        <ChevronRight className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                                        <span>{trg}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </div>

                              {/* Attitude Tip */}
                              {step.tips && (
                                <div className="p-2.5 bg-neutral-900/60 border border-neutral-800 rounded-lg text-[11px] text-neutral-400 flex items-center gap-2">
                                  <Shield className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                  <span>Posture : {step.tips}</span>
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </>
                    ) : (
                      <p className="text-xs text-neutral-500">Aucune étape de conversation dans cette campagne.</p>
                    )}
                  </div>
                )}

                {/* SUBTAB CONTENT: 2. OBJECTION LIBRARY (Comprendre -> Répondre -> Rebondir) */}
                {panelTab === 'objections' && (
                  <div className="space-y-4">
                    {/* Filter bar for objections */}
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="relative flex-1 min-w-[200px]">
                        <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={objectionSearch}
                          onChange={(e) => setObjectionSearch(e.target.value)}
                          placeholder="Rechercher une objection (« Prix », « Temps »...)"
                          className="w-full pl-8 pr-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-amber-400"
                        />
                      </div>

                      <select
                        value={objectionCategoryFilter}
                        onChange={(e) => setObjectionCategoryFilter(e.target.value)}
                        className="px-2.5 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-300 focus:outline-none"
                      >
                        <option value="all">Toutes catégories</option>
                        <option value="Prix">Prix</option>
                        <option value="Temps">Temps</option>
                        <option value="Prestataire en place">Prestataire en place</option>
                        <option value="Envoyez un email">Envoyez un email</option>
                        <option value="Pas de besoin">Pas de besoin</option>
                      </select>
                    </div>

                    {/* Objection Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-1">
                      {filteredObjections.length === 0 ? (
                        <p className="text-xs text-neutral-500 col-span-2 py-6 text-center">
                          Aucune objection trouvée pour ces critères.
                        </p>
                      ) : (
                        filteredObjections.map((obj) => (
                          <div
                            key={obj.id}
                            className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 space-y-3 hover:border-neutral-700 transition-colors flex flex-col justify-between"
                          >
                            <div className="space-y-2">
                              <div className="flex items-start justify-between gap-2">
                                <h5 className="font-semibold text-white text-xs leading-snug">
                                  {obj.title}
                                </h5>
                                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-neutral-900 border border-neutral-800 text-amber-300 shrink-0">
                                  {obj.category}
                                </span>
                              </div>

                              {/* 1. Comprendre */}
                              <div className="text-[11px] space-y-0.5">
                                <strong className="text-amber-400/90 block font-mono text-[10px] uppercase">
                                  1. Comprendre (Décodage) :
                                </strong>
                                <p className="text-neutral-400">{obj.comprendre}</p>
                              </div>

                              {/* 2. Répondre */}
                              <div className="text-[11px] space-y-0.5 bg-neutral-900/80 p-2.5 rounded-lg border border-neutral-800/80">
                                <strong className="text-cyan-400 block font-mono text-[10px] uppercase">
                                  2. Répondre (Formulation concrète) :
                                </strong>
                                <p className="text-neutral-200 italic">« {obj.repondre} »</p>
                              </div>

                              {/* 3. Rebondir */}
                              <div className="text-[11px] space-y-0.5 bg-neutral-900/80 p-2.5 rounded-lg border border-neutral-800/80">
                                <strong className="text-emerald-400 block font-mono text-[10px] uppercase">
                                  3. Rebondir (Question ouverte) :
                                </strong>
                                <p className="text-neutral-200">« {obj.rebondir} »</p>
                              </div>
                            </div>

                            <div className="pt-2 border-t border-neutral-900 flex items-center justify-between">
                              <span className="text-[10px] text-neutral-500 truncate max-w-[180px]">
                                Action : {obj.prochaineAction}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedObjectionMet(obj.title);
                                  setPanelTab('call_log');
                                }}
                                className="px-2 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-[10px] font-medium rounded transition-colors"
                              >
                                Sélectionner pour le journal
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* SUBTAB CONTENT: 3. HISTORY OF EXCHANGES */}
                {panelTab === 'history' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs text-neutral-400">
                      <span>Historique réel des interactions enregistrées dans Firestore :</span>
                      <span className="font-mono">{prospectInteractions.length} élément(s)</span>
                    </div>

                    {loadingHistory ? (
                      <div className="p-8 text-center text-xs text-neutral-500">Chargement de l’historique...</div>
                    ) : prospectInteractions.length === 0 ? (
                      <div className="p-8 bg-neutral-950 border border-neutral-800 rounded-xl text-center text-xs text-neutral-500">
                        Aucun appel ni interaction antérieure pour ce prospect.
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-[450px] overflow-y-auto pr-1">
                        {prospectInteractions.map((it) => (
                          <div
                            key={it.id}
                            className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl space-y-1.5"
                          >
                            <div className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-cyan-300 font-semibold">{it.date}</span>
                                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-neutral-800 text-neutral-300">
                                  {it.type}
                                </span>
                                {it.callResult && (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-950 text-blue-300 border border-blue-800">
                                    {it.callResult}
                                  </span>
                                )}
                              </div>
                              {it.campaignName && (
                                <span className="text-[10px] text-neutral-500 font-mono">
                                  Campagne : {it.campaignName}
                                </span>
                              )}
                            </div>

                            <p className="text-xs text-neutral-200 whitespace-pre-wrap leading-relaxed">
                              {it.summary}
                            </p>

                            {it.nextStep && (
                              <p className="text-[11px] text-neutral-400 font-mono pt-1 border-t border-neutral-900">
                                Prochaine étape : <span className="text-neutral-300">{it.nextStep}</span>
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* SUBTAB CONTENT: 4. FAST POST-CALL FORM */}
                {panelTab === 'call_log' && (
                  <form onSubmit={handleLogCall} className="space-y-4 bg-neutral-950 border border-neutral-800 rounded-xl p-5">
                    <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                      <div>
                        <h4 className="text-sm font-bold text-white">Journalisation Rapide Post-Appel</h4>
                        <p className="text-xs text-neutral-400">
                          Enregistre l'interaction dans Firestore et met à jour le prospect.
                        </p>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded">
                        Zéro appel automatique
                      </span>
                    </div>

                    {callSubmitSuccess && (
                      <div className="p-3 bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs rounded-lg flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>{callSubmitSuccess}</span>
                      </div>
                    )}

                    {callSubmitError && (
                      <div className="p-3 bg-red-950/80 border border-red-800 text-red-300 text-xs rounded-lg flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span>{callSubmitError}</span>
                      </div>
                    )}

                    {/* Result buttons */}
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-neutral-300">
                        Résultat de l'appel <span className="text-red-400">*</span>
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {CALL_RESULTS.map((r) => {
                          const isSel = callResult === r.id;
                          return (
                            <button
                              key={r.id}
                              type="button"
                              onClick={() => setCallResult(r.id)}
                              className={`p-2 rounded-lg text-xs font-medium border text-left transition-all cursor-pointer flex flex-col justify-between min-h-[50px] ${
                                isSel
                                  ? `${r.color} ring-2 ring-white/20 font-bold shadow-xs`
                                  : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700'
                              }`}
                            >
                              <span>{r.label}</span>
                              {isSel && <Check className="w-3 h-3 self-end" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Objection met selection (optional) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-neutral-400 mb-1">
                          Objection rencontrée lors de l'appel (Facultatif)
                        </label>
                        <select
                          value={selectedObjectionMet}
                          onChange={(e) => setSelectedObjectionMet(e.target.value)}
                          className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-cyan-400"
                        >
                          <option value="">Aucune objection notable</option>
                          {currentCampaign?.objections.map((obj) => (
                            <option key={obj.id} value={obj.title}>
                              [{obj.category}] {obj.title}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-neutral-400 mb-1">
                          Nouveau statut prospect suggéré
                        </label>
                        <select
                          value={suggestedStatus}
                          onChange={(e) => setSuggestedStatus(e.target.value as ProspectStatus)}
                          className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-cyan-400"
                        >
                          <option value="À qualifier">À qualifier</option>
                          <option value="À contacter">À contacter</option>
                          <option value="Contacté">Contacté</option>
                          <option value="Échange">Échange</option>
                          <option value="Rendez-vous">Rendez-vous</option>
                          <option value="Proposition envoyée">Proposition envoyée</option>
                          <option value="Gagné">Gagné</option>
                          <option value="Perdu">Perdu</option>
                          <option value="En attente">En attente</option>
                        </select>
                      </div>
                    </div>

                    {/* Call notes */}
                    <div>
                      <label className="block text-xs font-medium text-neutral-300 mb-1">
                        Notes d'entretien & Verbatim prospect
                      </label>
                      <textarea
                        rows={3}
                        required
                        value={callNotes}
                        onChange={(e) => setCallNotes(e.target.value)}
                        placeholder="Points abordés, organisation actuelle, échéance souhaitée, freins évoqués..."
                        className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-cyan-400"
                      />
                    </div>

                    {/* Next step & Date */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-neutral-300 mb-1">
                          Prochaine action convenue
                        </label>
                        <input
                          type="text"
                          value={callNextStep}
                          onChange={(e) => setCallNextStep(e.target.value)}
                          placeholder="Ex: Confirmer le créneau de mardi 10h par email"
                          className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-cyan-400"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-neutral-300 mb-1">
                          Date du prochain contact / Échéance
                        </label>
                        <input
                          type="date"
                          value={callNextContactDate}
                          onChange={(e) => setCallNextContactDate(e.target.value)}
                          className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-cyan-400"
                        />
                      </div>
                    </div>

                    {/* Operational reminder task checkbox */}
                    <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <label className="flex items-center gap-2 cursor-pointer text-xs text-neutral-200 select-none">
                        <input
                          type="checkbox"
                          checked={createReminderTask}
                          onChange={(e) => setCreateReminderTask(e.target.checked)}
                          className="rounded border-neutral-700 text-cyan-500 focus:ring-cyan-500 w-4 h-4 cursor-pointer"
                        />
                        <span>Créer automatiquement une tâche de rappel dans « Actions & Tâches »</span>
                      </label>

                      {createReminderTask && (
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-neutral-400 text-[11px]">Priorité :</span>
                          <select
                            value={reminderPriority}
                            onChange={(e) => setReminderPriority(e.target.value as TaskPriority)}
                            className="px-2 py-1 bg-neutral-950 border border-neutral-800 rounded text-xs text-neutral-300"
                          >
                            <option value="Haute">Haute</option>
                            <option value="Moyenne">Moyenne</option>
                            <option value="Basse">Basse</option>
                          </select>
                        </div>
                      )}
                    </div>

                    <div className="pt-2 flex items-center justify-end gap-3">
                      <button
                        type="submit"
                        disabled={isSubmittingCall}
                        className="px-5 py-2.5 bg-white hover:bg-neutral-100 text-neutral-950 font-semibold rounded-lg text-xs transition-colors shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>{isSubmittingCall ? 'Enregistrement...' : 'Enregistrer le journal d’appel'}</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: SESSION & REPORTING RÉELS */}
      {activeTab === 'reporting' && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs text-neutral-400">
                <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                <span>Période :</span>
                <select
                  value={reportPeriod}
                  onChange={(e) => setReportPeriod(e.target.value as any)}
                  className="px-2.5 py-1 bg-neutral-950 border border-neutral-800 rounded text-xs text-neutral-200 focus:outline-none"
                >
                  <option value="all">Historique complet</option>
                  <option value="today">Aujourd'hui</option>
                  <option value="week">Cette semaine</option>
                  <option value="month">Ce mois-ci</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-neutral-400">
                <Briefcase className="w-3.5 h-3.5 text-cyan-400" />
                <span>Campagne :</span>
                <select
                  value={reportCampaignFilter}
                  onChange={(e) => setReportCampaignFilter(e.target.value)}
                  className="px-2.5 py-1 bg-neutral-950 border border-neutral-800 rounded text-xs text-neutral-200 focus:outline-none"
                >
                  <option value="all">Toutes les campagnes</option>
                  {phoningCampaigns.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="button"
              onClick={handleExportReportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs font-medium transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exporter en CSV</span>
            </button>
          </div>

          {/* Metric KPI Cards with Explicit Denominators */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Appels & Conversations */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between text-xs text-neutral-400">
                <span className="font-mono uppercase text-[10px]">Volume d'Appels</span>
                <PhoneCall className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-white">
                  {reportingStats.totalCalls}
                </span>
                <span className="text-xs text-neutral-400 font-mono">
                  tentative(s) totale(s)
                </span>
              </div>
              <div className="text-[11px] text-neutral-300">
                <span>{reportingStats.conversations} conversation(s) réelle(s) aboutie(s)</span>
              </div>
              <span className="text-[10px] text-neutral-500 font-mono block pt-1 border-t border-neutral-800">
                Taux de joignabilité : {reportingStats.totalCalls < 3 ? 'Données insuffisantes' : `${reportingStats.conversationRate}% (${reportingStats.conversations}/${reportingStats.totalCalls})`}
              </span>
            </div>

            {/* Card 2: Rendez-vous de cadrage */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between text-xs text-neutral-400">
                <span className="font-mono uppercase text-[10px]">Rendez-vous Conclus</span>
                <Calendar className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-emerald-300">
                  {reportingStats.appointments}
                </span>
                <span className="text-xs text-neutral-400 font-mono">
                  RDV de cadrage
                </span>
              </div>
              <div className="text-[11px] text-neutral-400">
                {reportingStats.conversations < 3 ? (
                  <span className="text-amber-400/90 italic">Données insuffisantes pour ratio fiable</span>
                ) : (
                  <span>
                    Transformation : <strong className="text-white font-mono">{reportingStats.appointmentRate}%</strong> ({reportingStats.appointments}/{reportingStats.conversations} conversations)
                  </span>
                )}
              </div>
              <span className="text-[10px] text-neutral-500 font-mono block pt-1 border-t border-neutral-800">
                Session de cadrage 45 min validée
              </span>
            </div>

            {/* Card 3: Contacts Qualifiés */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between text-xs text-neutral-400">
                <span className="font-mono uppercase text-[10px]">Contacts Qualifiés</span>
                <CheckCircle2 className="w-4 h-4 text-blue-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-white">
                  {reportingStats.qualified}
                </span>
                <span className="text-xs text-neutral-400 font-mono">
                  contacts d'intérêt
                </span>
              </div>
              <div className="text-[11px] text-neutral-400">
                {reportingStats.conversations < 3 ? (
                  <span className="text-amber-400/90 italic">Données insuffisantes</span>
                ) : (
                  <span>
                    Taux de qualification : <strong className="text-white font-mono">{reportingStats.qualificationRate}%</strong>
                  </span>
                )}
              </div>
              <span className="text-[10px] text-neutral-500 font-mono block pt-1 border-t border-neutral-800">
                Échanges constructifs + RDV
              </span>
            </div>

            {/* Card 4: Relances & Suivis */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between text-xs text-neutral-400">
                <span className="font-mono uppercase text-[10px]">Relances Prévues</span>
                <Clock className="w-4 h-4 text-amber-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-amber-300">
                  {reportingStats.reminders}
                </span>
                <span className="text-xs text-neutral-400 font-mono">
                  rappels planifiés
                </span>
              </div>
              <div className="text-[11px] text-neutral-400">
                <span>{reportingStats.barriers} barrage(s) · {reportingStats.unreachable} injoignable(s)</span>
              </div>
              <span className="text-[10px] text-neutral-500 font-mono block pt-1 border-t border-neutral-800">
                Refus catégoriques : {reportingStats.refusals}
              </span>
            </div>
          </div>

          {/* Detailed Call Log Table */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
              <h4 className="font-semibold text-white text-xs">
                Journal des Appels Enregistrés sur la Période
              </h4>
              <span className="text-[11px] font-mono text-neutral-400">
                {filteredReportingInteractions.length} interaction(s)
              </span>
            </div>

            {filteredReportingInteractions.length === 0 ? (
              <div className="p-8 text-center text-xs text-neutral-500">
                Aucun appel journalisé sur cette période. Utilisez le poste d'appel pour démarrer la prospection.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-800 bg-neutral-950/60 text-neutral-400 font-medium">
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Entreprise</th>
                      <th className="py-2.5 px-3">Résultat</th>
                      <th className="py-2.5 px-3">Campagne</th>
                      <th className="py-2.5 px-3">Objection</th>
                      <th className="py-2.5 px-3">Notes & Prochaine étape</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/70">
                    {filteredReportingInteractions.map((it) => {
                      const prospect = prospects.find((p) => p.id === it.prospectId);
                      const resConfig = CALL_RESULTS.find((r) => r.id === it.callResult);

                      return (
                        <tr key={it.id} className="hover:bg-neutral-800/40 transition-colors">
                          <td className="py-2.5 px-3 font-mono text-neutral-300 whitespace-nowrap">
                            {it.date}
                          </td>
                          <td className="py-2.5 px-3 font-medium text-white whitespace-nowrap">
                            {prospect?.company || 'Prospect inconnu'}
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-mono border font-medium ${
                                resConfig?.color || 'bg-neutral-800 text-neutral-300 border-neutral-700'
                              }`}
                            >
                              {it.callResult || 'Appel'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-neutral-400 text-[11px] whitespace-nowrap">
                            {it.campaignName || '—'}
                          </td>
                          <td className="py-2.5 px-3 text-neutral-300 text-[11px]">
                            {it.objectionMet || '—'}
                          </td>
                          <td className="py-2.5 px-3 text-neutral-300 text-[11px] max-w-sm">
                            <div className="truncate">{it.summary}</div>
                            {it.nextStep && (
                              <div className="text-[10px] text-cyan-300 truncate mt-0.5 font-mono">
                                Action : {it.nextStep}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: GESTIONNAIRE DE CAMPAGNES (MANAGER / DIRECTION) */}
      {activeTab === 'campaigns_manager' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-neutral-900 border border-neutral-800 p-4 rounded-xl">
            <div>
              <h3 className="font-semibold text-white text-sm">
                Référentiel des Campagnes, Guides & Objections
              </h3>
              <p className="text-xs text-neutral-400">
                Adapté aux services NEXUS (Consulting, Digital, Academy, QVT). Tout est configurable par la Direction.
              </p>
            </div>

            {isOwner && (
              <button
                type="button"
                onClick={() => {
                  setEditingCampaign(null);
                  setIsCampaignModalOpen(true);
                }}
                className="px-3.5 py-2 bg-white hover:bg-neutral-100 text-neutral-950 font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Créer une Campagne</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {phoningCampaigns.map((camp) => {
              const branch = branches.find((b) => b.id === camp.branchId);

              return (
                <div
                  key={camp.id}
                  className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-white text-sm">{camp.name}</h4>
                          <span
                            className={`text-[9px] font-mono px-2 py-0.5 rounded border font-semibold ${
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
                          <span className="text-[11px] font-mono text-neutral-400 block mt-0.5">
                            Branche : <strong className="text-neutral-200">{branch.name}</strong> ({branch.code})
                          </span>
                        )}
                      </div>

                      {isOwner && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCampaign(camp);
                            setIsCampaignModalOpen(true);
                          }}
                          className="p-1.5 text-neutral-400 hover:text-white rounded hover:bg-neutral-800 transition-colors"
                          title="Modifier la campagne"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <p className="text-xs text-neutral-300 leading-relaxed">
                      {camp.objective}
                    </p>

                    <div className="text-[11px] text-neutral-400 font-mono">
                      <span className="text-neutral-500">Cible :</span> {camp.targetAudience}
                    </div>

                    {/* Stats pills */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-neutral-800/80">
                      <div className="p-2 bg-neutral-950 rounded border border-neutral-800/60 text-xs">
                        <span className="text-neutral-500 block text-[10px] font-mono uppercase">Guide de conversation</span>
                        <strong className="text-cyan-300 font-mono">{camp.steps.length} étapes</strong>
                      </div>
                      <div className="p-2 bg-neutral-950 rounded border border-neutral-800/60 text-xs">
                        <span className="text-neutral-500 block text-[10px] font-mono uppercase">Objections structurées</span>
                        <strong className="text-amber-300 font-mono">{camp.objections.length} fiches</strong>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-neutral-800 flex items-center justify-between text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCampaignId(camp.id);
                        setActiveTab('station');
                      }}
                      className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium cursor-pointer"
                    >
                      <span>Lancer les appels</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    <span className="text-[10px] text-neutral-500 font-mono">
                      {camp.startDate ? `Du ${camp.startDate}` : 'Permanent'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL: CAMPAIGN EDIT / CREATE (MANAGER ONLY) */}
      {isCampaignModalOpen && (
        <Modal
          isOpen={isCampaignModalOpen}
          onClose={() => setIsCampaignModalOpen(false)}
          title={editingCampaign ? `Modifier la Campagne : ${editingCampaign.name}` : 'Créer une Campagne Interne'}
          subtitle="Gouvernance des scripts vivants et objections de prospection"
          maxWidth="max-w-2xl"
        >
          <CampaignEditorModal
            campaign={editingCampaign}
            branches={branches}
            offers={offers}
            onSave={async (camp) => {
              await savePhoningCampaign(camp);
              setIsCampaignModalOpen(false);
            }}
            onCancel={() => setIsCampaignModalOpen(false)}
          />
        </Modal>
      )}

      {/* MODAL: PROSPECT ENRICHMENT VIA GOOGLE MAPS & WEB */}
      <ProspectEnrichmentModal
        isOpen={isEnrichModalOpen}
        onClose={() => setIsEnrichModalOpen(false)}
        prospect={selectedProspect}
      />
    </div>
  );
};

/**
 * Dedicated sub-component for Campaign editing to keep clean component boundaries
 */
const CampaignEditorModal: React.FC<{
  campaign: InternalPhoningCampaign | null;
  branches: Array<{ id: string; name: string; code: string }>;
  offers: Array<{ id: string; name: string }>;
  onSave: (camp: InternalPhoningCampaign) => Promise<void>;
  onCancel: () => void;
}> = ({ campaign, branches, offers, onSave, onCancel }) => {
  const [name, setName] = useState(campaign?.name || '');
  const [objective, setObjective] = useState(campaign?.objective || '');
  const [branchId, setBranchId] = useState(campaign?.branchId || branches[0]?.id || '');
  const [offerId, setOfferId] = useState(campaign?.offerId || '');
  const [targetAudience, setTargetAudience] = useState(campaign?.targetAudience || '');
  const [status, setStatus] = useState<InternalPhoningCampaign['status']>(campaign?.status || 'Active');
  const [startDate, setStartDate] = useState(campaign?.startDate || '');
  const [endDate, setEndDate] = useState(campaign?.endDate || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError('Le nom de la campagne est requis.');
      return;
    }

    setSaving(true);
    try {
      const now = new Date().toISOString();
      const payload: InternalPhoningCampaign = {
        id: campaign?.id || `camp_${Date.now()}`,
        name: name.trim(),
        objective: objective.trim(),
        branchId,
        offerId: offerId || undefined,
        targetAudience: targetAudience.trim(),
        status,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        steps: campaign?.steps || [
          {
            id: `step_${Date.now()}_1`,
            stepNumber: 1,
            name: 'Accroche & Éveil',
            goal: 'Capter l’attention avec respect et valider l’écoute',
            possibleQuestions: ['Bonjour [Nom], avez-vous deux minutes pour échanger sur vos processus opérationnels ?'],
            usableProofs: ['Méthode NEXUS en 24 points'],
            conclusionTriggers: ['Écoute confirmée'],
            tips: 'Ton posé et professionnel',
          },
        ],
        objections: campaign?.objections || [
          {
            id: `obj_${Date.now()}_1`,
            title: '« Pas de temps actuellement »',
            category: 'Temps',
            comprendre: 'Surcharge ou barrage',
            repondre: 'Je comprends tout à fait, c’est justement pour faire gagner du temps que nous intervenons.',
            rebondir: 'Pouvons-nous convenir d’un moment plus calme ?',
            preuves: ['Audit rapide de 45 minutes'],
            erreursAEviter: ['Forcer le passage'],
            prochaineAction: 'Caler un rappel à date convenue',
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
      {error && <div className="p-3 bg-red-950/80 border border-red-800 text-red-300 rounded-lg">{error}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-neutral-400 mb-1">Nom de la campagne *</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Cadrage Stratégique PME"
            className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded text-xs text-neutral-100 focus:outline-none focus:border-cyan-400"
          />
        </div>

        <div>
          <label className="block text-neutral-400 mb-1">Branche NEXUS rattachée *</label>
          <select
            value={branchId}
            onChange={(e) => setBranchId(e.target.value)}
            className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded text-xs text-neutral-100 focus:outline-none focus:border-cyan-400"
          >
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.code})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-neutral-400 mb-1">Objectif principal de la campagne</label>
        <textarea
          rows={2}
          value={objective}
          onChange={(e) => setObjective(e.target.value)}
          placeholder="Ex: Détecter les blocages opérationnels et convenir d’un diagnostic initial de 45 minutes."
          className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded text-xs text-neutral-100 focus:outline-none focus:border-cyan-400"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-neutral-400 mb-1">Cible visée</label>
          <input
            type="text"
            value={targetAudience}
            onChange={(e) => setTargetAudience(e.target.value)}
            placeholder="Ex: Dirigeants de PME 20-250 salariés"
            className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded text-xs text-neutral-100 focus:outline-none focus:border-cyan-400"
          />
        </div>

        <div>
          <label className="block text-neutral-400 mb-1">Statut de la campagne</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded text-xs text-neutral-100 focus:outline-none focus:border-cyan-400"
          >
            <option value="Active">Active (Disponible en prospection)</option>
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
          className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded text-xs"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 bg-white hover:bg-neutral-100 text-neutral-950 font-semibold rounded text-xs shadow-xs disabled:opacity-50"
        >
          {saving ? 'Sauvegarde...' : 'Sauvegarder la campagne'}
        </button>
      </div>
    </form>
  );
};
