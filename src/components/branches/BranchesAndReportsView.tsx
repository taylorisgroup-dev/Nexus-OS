import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { Modal } from '../ui/Modal';
import type {
  Branch,
  BranchMaturity,
  Prospect,
  Project,
  Task,
  Offer,
  ActiveSection,
} from '../../types/nexus';
import {
  GitBranch,
  Building2,
  Layers,
  CheckSquare,
  Users,
  Briefcase,
  Calendar,
  Filter,
  Download,
  Plus,
  Edit2,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Shield,
  HelpCircle,
  FileSpreadsheet,
  FileCode,
  PhoneCall,
  Lock,
  ChevronRight,
  X,
} from 'lucide-react';
import { NexusLogo } from '../brand/NexusLogo';

interface BranchesAndReportsViewProps {
  onNavigate?: (section: ActiveSection) => void;
}

export const BranchesAndReportsView: React.FC<BranchesAndReportsViewProps> = ({
  onNavigate,
}) => {
  const {
    branches,
    createBranch,
    updateBranch,
    prospects,
    offers,
    projects,
    tasks,
    decisions,
    toggleTaskStatus,
  } = useData();

  // Active view tab
  const [activeTab, setActiveTab] = useState<'branches' | 'reports' | 'actions' | 'phoning_pilot'>(
    'branches'
  );

  // Filters for reporting
  const [selectedBranchFilter, setSelectedBranchFilter] = useState<string>('all');
  const [selectedPeriodFilter, setSelectedPeriodFilter] = useState<'all' | 'month' | 'quarter' | 'year'>(
    'all'
  );

  // Modal for creating/editing a branch
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formMaturity, setFormMaturity] = useState<BranchMaturity>('Cadrage');
  const [formResponsible, setFormResponsible] = useState('');
  const [formPriorities, setFormPriorities] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Drill-down modal for clicked metrics
  const [drillDownModal, setDrillDownModal] = useState<{
    title: string;
    description: string;
    items: { id: string; title: string; subtitle?: string; status?: string; date?: string; type: string }[];
  } | null>(null);

  // Filter prospects, offers, projects, tasks by period & branch
  const filteredData = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const matchesBranch = (itemBranchId?: string) => {
      if (selectedBranchFilter === 'all') return true;
      if (selectedBranchFilter === 'unassigned') return !itemBranchId;
      return itemBranchId === selectedBranchFilter;
    };

    const matchesPeriod = (dateStr?: string) => {
      if (selectedPeriodFilter === 'all') return true;
      if (!dateStr) return false;
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return false;

      if (selectedPeriodFilter === 'month') {
        return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
      }
      if (selectedPeriodFilter === 'quarter') {
        const itemQuarter = Math.floor(d.getMonth() / 3);
        const currentQuarter = Math.floor(currentMonth / 3);
        return d.getFullYear() === currentYear && itemQuarter === currentQuarter;
      }
      if (selectedPeriodFilter === 'year') {
        return d.getFullYear() === currentYear;
      }
      return true;
    };

    const activeProspects = prospects.filter(
      (p) => !p.isArchived && matchesBranch(p.branchId) && matchesPeriod(p.createdAt)
    );
    const activeOffers = offers.filter(
      (o) => !o.isArchived && matchesBranch(o.branchId) && matchesPeriod(o.createdAt)
    );
    const activeProjects = projects.filter(
      (pr) => !pr.isArchived && matchesBranch(pr.branchId) && matchesPeriod(pr.createdAt)
    );
    const activeTasks = tasks.filter(
      (t) => !t.isArchived && matchesBranch(t.branchId) && (matchesPeriod(t.dueDate) || matchesPeriod(t.createdAt))
    );

    return {
      prospects: activeProspects,
      offers: activeOffers,
      projects: activeProjects,
      tasks: activeTasks,
    };
  }, [prospects, offers, projects, tasks, selectedBranchFilter, selectedPeriodFilter]);

  // Branch entity counts for registry
  const branchStats = useMemo(() => {
    const stats: Record<
      string,
      { prospectsCount: number; offersCount: number; projectsCount: number; tasksCount: number }
    > = {};

    branches.forEach((b) => {
      stats[b.id] = { prospectsCount: 0, offersCount: 0, projectsCount: 0, tasksCount: 0 };
    });

    prospects.forEach((p) => {
      if (!p.isArchived && p.branchId && stats[p.branchId]) stats[p.branchId].prospectsCount++;
    });
    offers.forEach((o) => {
      if (!o.isArchived && o.branchId && stats[o.branchId]) stats[o.branchId].offersCount++;
    });
    projects.forEach((pr) => {
      if (!pr.isArchived && pr.branchId && stats[pr.branchId]) stats[pr.branchId].projectsCount++;
    });
    tasks.forEach((t) => {
      if (!t.isArchived && t.branchId && stats[t.branchId]) stats[t.branchId].tasksCount++;
    });

    return stats;
  }, [branches, prospects, offers, projects, tasks]);

  // Open modal for branch editing
  const openEditBranch = (b: Branch) => {
    setEditingBranch(b);
    setFormName(b.name);
    setFormCode(b.code);
    setFormDescription(b.description);
    setFormMaturity(b.maturity);
    setFormResponsible(b.responsible || '');
    setFormPriorities(b.priorities.join('\n'));
    setFormError(null);
    setIsBranchModalOpen(true);
  };

  const openCreateBranch = () => {
    setEditingBranch(null);
    setFormName('');
    setFormCode('');
    setFormDescription('');
    setFormMaturity('Cadrage'); // Non actif par défaut
    setFormResponsible('');
    setFormPriorities('');
    setFormError(null);
    setIsBranchModalOpen(true);
  };

  const handleSaveBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!formName.trim()) {
      setFormError('Le nom de la branche est requis.');
      return;
    }
    const cleanCode = formCode.trim().toUpperCase() || formName.trim().slice(0, 4).toUpperCase();
    const prioritiesList = formPriorities
      .split('\n')
      .map((p) => p.trim())
      .filter(Boolean);

    try {
      if (editingBranch) {
        await updateBranch(editingBranch.id, {
          name: formName.trim(),
          code: cleanCode,
          description: formDescription.trim(),
          maturity: formMaturity,
          responsible: formResponsible.trim(),
          priorities: prioritiesList,
        });
      } else {
        await createBranch({
          name: formName.trim(),
          code: cleanCode,
          description: formDescription.trim(),
          maturity: formMaturity,
          responsible: formResponsible.trim(),
          priorities: prioritiesList,
          color: '#0879E8',
        });
      }
      setIsBranchModalOpen(false);
    } catch (err: unknown) {
      setFormError((err as Error).message || 'Erreur lors de la sauvegarde de la branche.');
    }
  };

  // CSV Export for filtered reports
  const handleExportCSV = () => {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const branchName =
      selectedBranchFilter === 'all'
        ? 'Toutes_Branches'
        : branches.find((b) => b.id === selectedBranchFilter)?.name || 'Inconnue';

    const lines: string[] = [];
    lines.push(`RAPPORT CONSOLIDÉ PAR BRANCHE - NEXUS OS`);
    lines.push(`Date de génération : ${now.toLocaleString('fr-FR')}`);
    lines.push(`Branche filtrée : ${branchName}`);
    lines.push(`Période filtrée : ${selectedPeriodFilter}`);
    lines.push(``);

    lines.push(`SECTION 1 - PROSPECTS`);
    lines.push(`ID;Entreprise;Contact;Statut;Branche;Date Création`);
    filteredData.prospects.forEach((p) => {
      const bName = branches.find((b) => b.id === p.branchId)?.name || 'Non assignée';
      lines.push(`"${p.id}";"${p.company}";"${p.contactName}";"${p.status}";"${bName}";"${p.createdAt}"`);
    });
    lines.push(``);

    lines.push(`SECTION 2 - PROJETS`);
    lines.push(`ID;Titre;Client;Statut;Branche;Date Cible`);
    filteredData.projects.forEach((pr) => {
      const bName = branches.find((b) => b.id === pr.branchId)?.name || 'Non assignée';
      lines.push(`"${pr.id}";"${pr.title}";"${pr.clientName || ''}";"${pr.status}";"${bName}";"${pr.targetDate || ''}"`);
    });
    lines.push(``);

    lines.push(`SECTION 3 - ACTIONS & TÂCHES`);
    lines.push(`ID;Titre;Priorité;Statut;Branche;Échéance`);
    filteredData.tasks.forEach((t) => {
      const bName = branches.find((b) => b.id === t.branchId)?.name || 'Non assignée';
      lines.push(`"${t.id}";"${t.title}";"${t.priority}";"${t.status}";"${bName}";"${t.dueDate}"`);
    });

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `nexus_rapport_${branchName}_${selectedPeriodFilter}_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // JSON Export for filtered reports
  const handleExportJSON = () => {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const branchName =
      selectedBranchFilter === 'all'
        ? 'Toutes_Branches'
        : branches.find((b) => b.id === selectedBranchFilter)?.name || 'Inconnue';

    const payload = {
      meta: {
        application: 'NEXUS OS',
        reportType: 'Consolidé par Branche & Période',
        generatedAt: now.toISOString(),
        branchFilter: selectedBranchFilter,
        branchName,
        periodFilter: selectedPeriodFilter,
        rules: 'Mesures exactes avec dénominateurs réels, sans extrapolation ni données inventées.',
      },
      definitions: {
        prospectsWonRatio: 'Nombre de prospects gagnés divisé par le nombre total de prospects qualifiés sur la période sélectionnée.',
        projectsDeliveryRatio: 'Nombre de projets au statut Livré divisé par le total des projets initiés sur la période.',
        overdueTasksCount: 'Tâches actives non archivées avec statut différent de Terminé et date d’échéance strictement inférieure à aujourd’hui.',
      },
      counts: {
        prospectsTotal: filteredData.prospects.length,
        projectsTotal: filteredData.projects.length,
        tasksTotal: filteredData.tasks.length,
        offersTotal: filteredData.offers.length,
      },
      data: filteredData,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `nexus_rapport_${branchName}_${selectedPeriodFilter}_${dateStr}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Compute calculated metrics with explicit denominators
  const todayStr = new Date().toISOString().split('T')[0];
  const totalProspectsCount = filteredData.prospects.length;
  const wonProspects = filteredData.prospects.filter((p) => p.status === 'Gagné');
  const proposalsSentProspects = filteredData.prospects.filter((p) => p.status === 'Proposition envoyée');

  const totalProjectsCount = filteredData.projects.length;
  const activeProjects = filteredData.projects.filter((pr) => pr.status === 'En cours');
  const deliveredProjects = filteredData.projects.filter((pr) => pr.status === 'Livré');
  const blockedProjects = filteredData.projects.filter((pr) => pr.status === 'Bloqué');

  const totalTasksCount = filteredData.tasks.length;
  const completedTasks = filteredData.tasks.filter((t) => t.status === 'Terminé');
  const overdueTasks = filteredData.tasks.filter((t) => t.status !== 'Terminé' && t.dueDate && t.dueDate < todayStr);
  const pendingTasks = filteredData.tasks.filter((t) => t.status !== 'Terminé');

  // Cross-cutting next actions queue
  const nextActionsQueue = useMemo(() => {
    return tasks
      .filter((t) => !t.isArchived && t.status !== 'Terminé')
      .sort((a, b) => {
        // Overdue first, then by dueDate
        const aOverdue = a.dueDate && a.dueDate < todayStr ? 1 : 0;
        const bOverdue = b.dueDate && b.dueDate < todayStr ? 1 : 0;
        if (aOverdue !== bOverdue) return bOverdue - aOverdue;
        return (a.dueDate || '9999').localeCompare(b.dueDate || '9999');
      });
  }, [tasks, todayStr]);

  const getMaturityBadgeClass = (maturity: BranchMaturity) => {
    switch (maturity) {
      case 'Actif':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-800';
      case 'En cours':
        return 'bg-blue-950/80 text-blue-300 border-blue-800';
      case 'Cadrage':
        return 'bg-amber-950/80 text-amber-300 border-amber-800';
      case 'Idée':
        return 'bg-neutral-800 text-neutral-300 border-neutral-700';
      case 'En pause':
        return 'bg-red-950/60 text-red-400 border-red-800';
      default:
        return 'bg-neutral-800 text-neutral-300 border-neutral-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Cockpit Vision & Safeguards */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-neutral-400 font-mono uppercase tracking-wider">
                NEXUS Premium Solutions · Pilotage Transversal
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-neutral-800 text-neutral-300 border border-neutral-700">
                Gouvernance
              </span>
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight mt-0.5">
              Branches & Rapports Consolidés
            </h2>
            <p className="text-xs text-neutral-400 mt-1 max-w-3xl leading-relaxed">
              Cockpit de pilotage stratégique de l'intégralité de NEXUS Premium Solutions. Les données sont
              mesurées avec exactitude, sans données inventées ni agrégation trompeuse.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={openCreateBranch}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-neutral-100 text-neutral-950 font-medium text-xs rounded-lg transition-colors cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nouvelle Branche</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            type="button"
            onClick={() => setActiveTab('branches')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'branches'
                ? 'bg-neutral-800 text-white border border-neutral-700 shadow-xs'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
            }`}
          >
            <GitBranch className="w-3.5 h-3.5 text-blue-400" />
            <span>Registre des Branches ({branches.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('reports')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'reports'
                ? 'bg-neutral-800 text-white border border-neutral-700 shadow-xs'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-cyan-400" />
            <span>Tableau de Bord & Rapports Consolidés</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('actions')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'actions'
                ? 'bg-neutral-800 text-white border border-neutral-700 shadow-xs'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
            <span>File de Prochaines Actions Transversale ({nextActionsQueue.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('phoning_pilot')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'phoning_pilot'
                ? 'bg-red-950/80 text-red-200 border border-red-800 shadow-xs'
                : 'text-neutral-400 hover:text-red-300 hover:bg-neutral-800/50'
            }`}
          >
            <PhoneCall className="w-3.5 h-3.5 text-red-400" />
            <span>Produit Phoning : NEXUS Customer & Sales Pilot</span>
            <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-red-900/60 text-red-300">
              En Cadrage
            </span>
          </button>
        </div>
      </div>

      {/* TAB 1: REGISTRE DES BRANCHES */}
      {activeTab === 'branches' && (
        <div className="space-y-6">
          {/* Strict Governance Notice */}
          <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl flex items-start gap-2.5 text-xs text-neutral-400">
            <Shield className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <strong className="text-neutral-200 block">Règle de gouvernance d’objectivité :</strong>
              <p className="text-[11px] leading-relaxed">
                Aucune branche n'est déclarée <em>« Actif »</em> par défaut sans éléments tangibles de
                fonctionnement (projets engagés, offres prêtes, livrables validés). Les statuts reflètent fidèlement
                l'état réel de structuration.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {branches.map((b) => {
              const stats = branchStats[b.id] || {
                prospectsCount: 0,
                offersCount: 0,
                projectsCount: 0,
                tasksCount: 0,
              };
              const isDigital = b.code === 'DIGI' || b.name.toLowerCase().includes('digital');

              return (
                <div
                  key={b.id}
                  className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 flex flex-col justify-between space-y-4 hover:border-neutral-700 transition-colors"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: b.color || '#0879E8' }}
                        />
                        <span className="font-mono text-[10px] text-neutral-400 px-1.5 py-0.5 rounded bg-neutral-950 border border-neutral-800 font-semibold">
                          {b.code}
                        </span>
                        <h3 className="font-bold text-white text-base tracking-tight">{b.name}</h3>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded border font-semibold ${getMaturityBadgeClass(
                            b.maturity
                          )}`}
                        >
                          {b.maturity}
                        </span>
                        <button
                          type="button"
                          onClick={() => openEditBranch(b)}
                          className="p-1 text-neutral-400 hover:text-white rounded hover:bg-neutral-800 transition-colors"
                          title="Modifier la branche"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-neutral-300 leading-relaxed min-h-[38px]">
                      {b.description}
                    </p>

                    <div className="text-[11px] text-neutral-400 flex items-center gap-1.5 font-mono">
                      <span className="text-neutral-500">Responsable :</span>
                      <span className="text-neutral-200 font-medium">
                        {b.responsible || 'Non désigné (À affecter)'}
                      </span>
                    </div>

                    {/* Priorities */}
                    {b.priorities && b.priorities.length > 0 && (
                      <div className="pt-2 border-t border-neutral-800/80 space-y-1.5">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 block">
                          Priorités stratégiques configurées :
                        </span>
                        <ul className="space-y-1 text-[11px] text-neutral-300">
                          {b.priorities.map((pr, idx) => (
                            <li key={idx} className="flex items-start gap-1.5">
                              <span className="text-neutral-500 shrink-0">•</span>
                              <span className="leading-tight">{pr}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Specific Phoning Notice for Digital */}
                    {isDigital && (
                      <div className="p-2.5 bg-red-950/40 border border-red-900/60 rounded-lg text-[10px] space-y-1">
                        <div className="flex items-center gap-1 text-red-300 font-semibold">
                          <PhoneCall className="w-3 h-3 text-red-400" />
                          <span>Produit Phoning associé : NEXUS Customer & Sales Pilot</span>
                        </div>
                        <p className="text-neutral-400 leading-tight">
                          Poste de travail d'appels autonome projeté par client (en cadrage, non lancé).
                        </p>
                        <button
                          type="button"
                          onClick={() => setActiveTab('phoning_pilot')}
                          className="text-red-400 hover:text-red-300 underline font-mono text-[10px] inline-flex items-center gap-0.5 mt-0.5"
                        >
                          Consulter la fiche produit <ArrowRight className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Footer entity counts & Quick filter */}
                  <div className="pt-3 border-t border-neutral-800 flex items-center justify-between text-[11px] text-neutral-400 font-mono">
                    <div className="flex items-center gap-3">
                      <span title="Prospects associés">{stats.prospectsCount} prosp.</span>
                      <span title="Projets associés">{stats.projectsCount} proj.</span>
                      <span title="Actions associées">{stats.tasksCount} act.</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedBranchFilter(b.id);
                        setActiveTab('reports');
                      }}
                      className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 text-xs font-sans font-medium"
                    >
                      <span>Filtrer</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: TABLEAU DE BORD & RAPPORTS CONSOLIDÉS */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          {/* Controls Bar: Filters & Exports */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs text-neutral-400">
                <Filter className="w-3.5 h-3.5 text-cyan-400" />
                <span className="font-medium text-neutral-200">Branche :</span>
                <select
                  value={selectedBranchFilter}
                  onChange={(e) => setSelectedBranchFilter(e.target.value)}
                  className="px-2.5 py-1 bg-neutral-950 border border-neutral-800 rounded text-xs text-neutral-100 font-mono focus:outline-none focus:border-cyan-400"
                >
                  <option value="all">Toutes les branches ({branches.length})</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.code})
                    </option>
                  ))}
                  <option value="unassigned">Transversale / Non assignée</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-neutral-400">
                <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                <span className="font-medium text-neutral-200">Période :</span>
                <select
                  value={selectedPeriodFilter}
                  onChange={(e) => setSelectedPeriodFilter(e.target.value as any)}
                  className="px-2.5 py-1 bg-neutral-950 border border-neutral-800 rounded text-xs text-neutral-100 font-mono focus:outline-none focus:border-cyan-400"
                >
                  <option value="all">Historique complet</option>
                  <option value="month">Ce mois-ci</option>
                  <option value="quarter">Ce trimestre</option>
                  <option value="year">Année en cours</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs font-medium transition-colors"
                title="Exporter les données filtrées en format CSV"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
              <button
                type="button"
                onClick={handleExportJSON}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs font-medium transition-colors"
                title="Exporter les données et métadonnées en format JSON"
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>Export JSON</span>
              </button>
            </div>
          </div>

          {/* Consolidated KPI Grid (with visible denominators and 'données insuffisantes') */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* KPI 1: Prospects & Conversion */}
            <div
              onClick={() =>
                setDrillDownModal({
                  title: 'Détail des Prospects Filtrés',
                  description: `Liste des ${totalProspectsCount} prospect(s) correspondant au filtre actif.`,
                  items: filteredData.prospects.map((p) => ({
                    id: p.id,
                    title: p.company,
                    subtitle: `Contact : ${p.contactName} (${p.email || p.phone || 'Sans contact direct'})`,
                    status: p.status,
                    date: p.createdAt ? new Date(p.createdAt).toLocaleDateString('fr-FR') : '',
                    type: 'prospect',
                  })),
                })
              }
              className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 space-y-2 cursor-pointer hover:border-neutral-700 transition-colors"
            >
              <div className="flex items-center justify-between text-xs text-neutral-400">
                <span className="font-mono uppercase text-[10px]">Opportunités B2B</span>
                <Users className="w-4 h-4 text-blue-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-white">{wonProspects.length}</span>
                <span className="text-xs text-neutral-400 font-mono">
                  gagné(s) / {totalProspectsCount} total
                </span>
              </div>
              <div className="text-[11px] text-neutral-400">
                {totalProspectsCount < 3 ? (
                  <span className="text-amber-400/90 italic">Données insuffisantes pour ratio fiable</span>
                ) : (
                  <span>
                    Taux d’affaires conclues :{' '}
                    <strong className="text-neutral-200 font-mono">
                      {Math.round((wonProspects.length / totalProspectsCount) * 100)}%
                    </strong>
                  </span>
                )}
              </div>
              <span className="text-[10px] text-neutral-500 block pt-1 border-t border-neutral-800/80">
                Cliquer pour ouvrir les fiches sources
              </span>
            </div>

            {/* KPI 2: Projets en exécution */}
            <div
              onClick={() =>
                setDrillDownModal({
                  title: 'Détail des Projets Filtrés',
                  description: `Liste des ${totalProjectsCount} projet(s) correspondant au filtre actif.`,
                  items: filteredData.projects.map((pr) => ({
                    id: pr.id,
                    title: pr.title,
                    subtitle: `Client : ${pr.clientName || 'Interne / Sans client'} · Objectif : ${pr.businessObjective}`,
                    status: pr.status,
                    date: pr.targetDate || '',
                    type: 'projet',
                  })),
                })
              }
              className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 space-y-2 cursor-pointer hover:border-neutral-700 transition-colors"
            >
              <div className="flex items-center justify-between text-xs text-neutral-400">
                <span className="font-mono uppercase text-[10px]">Exécution Projets</span>
                <Layers className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-cyan-300">
                  {activeProjects.length}
                </span>
                <span className="text-xs text-neutral-400 font-mono">
                  en cours / {totalProjectsCount} total
                </span>
              </div>
              <div className="text-[11px] text-neutral-400">
                {blockedProjects.length > 0 ? (
                  <span className="text-red-400 font-semibold">
                    {blockedProjects.length} projet(s) bloqué(s)
                  </span>
                ) : (
                  <span className="text-neutral-300">{deliveredProjects.length} projet(s) livré(s)</span>
                )}
              </div>
              <span className="text-[10px] text-neutral-500 block pt-1 border-t border-neutral-800/80">
                Cliquer pour ouvrir les fiches sources
              </span>
            </div>

            {/* KPI 3: Actions & Tâches dues */}
            <div
              onClick={() =>
                setDrillDownModal({
                  title: 'Détail des Actions & Tâches Filtrées',
                  description: `Liste des ${totalTasksCount} tâche(s) enregistrée(s).`,
                  items: filteredData.tasks.map((t) => ({
                    id: t.id,
                    title: t.title,
                    subtitle: `Échéance : ${t.dueDate || 'Non définie'} · Priorité : ${t.priority}`,
                    status: t.status,
                    date: t.dueDate,
                    type: 'action',
                  })),
                })
              }
              className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 space-y-2 cursor-pointer hover:border-neutral-700 transition-colors"
            >
              <div className="flex items-center justify-between text-xs text-neutral-400">
                <span className="font-mono uppercase text-[10px]">Actions Opérationnelles</span>
                <CheckSquare className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-white">
                  {completedTasks.length}
                </span>
                <span className="text-xs text-neutral-400 font-mono">
                  terminée(s) / {totalTasksCount} total
                </span>
              </div>
              <div className="text-[11px]">
                {overdueTasks.length > 0 ? (
                  <span className="text-red-400 font-semibold font-mono">
                    {overdueTasks.length} action(s) en retard
                  </span>
                ) : totalTasksCount === 0 ? (
                  <span className="text-neutral-500 italic">Aucune action sur la période</span>
                ) : (
                  <span className="text-emerald-400 font-mono">Aucun retard opérationnel</span>
                )}
              </div>
              <span className="text-[10px] text-neutral-500 block pt-1 border-t border-neutral-800/80">
                Cliquer pour ouvrir les fiches sources
              </span>
            </div>

            {/* KPI 4: Décisions & Offres */}
            <div
              onClick={() =>
                setDrillDownModal({
                  title: 'Détail des Décisions Actées',
                  description: `Registre de gouvernance (${decisions.length} décision(s)).`,
                  items: decisions.map((d) => ({
                    id: d.id,
                    title: d.title,
                    subtitle: `Contexte : ${d.context}`,
                    status: d.status,
                    date: d.date,
                    type: 'décision',
                  })),
                })
              }
              className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 space-y-2 cursor-pointer hover:border-neutral-700 transition-colors"
            >
              <div className="flex items-center justify-between text-xs text-neutral-400">
                <span className="font-mono uppercase text-[10px]">Gouvernance Actée</span>
                <Briefcase className="w-4 h-4 text-amber-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-white">
                  {decisions.filter((d) => d.status === 'Actée').length}
                </span>
                <span className="text-xs text-neutral-400 font-mono">
                  actée(s) / {decisions.length} total
                </span>
              </div>
              <div className="text-[11px] text-neutral-400">
                {decisions.length === 0 ? (
                  <span className="text-neutral-500 italic">Données insuffisantes</span>
                ) : (
                  <span>
                    Offres associées : <strong className="text-neutral-200 font-mono">{filteredData.offers.length}</strong>
                  </span>
                )}
              </div>
              <span className="text-[10px] text-neutral-500 block pt-1 border-t border-neutral-800/80">
                Cliquer pour ouvrir les fiches sources
              </span>
            </div>
          </div>

          {/* Breakdown Table by Entity & Status */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div>
                <h3 className="text-sm font-semibold text-white tracking-tight">
                  Ventilation Détaillée par Statut
                </h3>
                <p className="text-xs text-neutral-400">
                  Répartition des enregistrements réels selon le filtre sélectionné.
                </p>
              </div>
              <span className="text-[11px] font-mono text-neutral-400">
                Période : {selectedPeriodFilter === 'all' ? 'Historique' : selectedPeriodFilter}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
              {/* Prospects Breakdown */}
              <div className="space-y-2">
                <span className="font-semibold text-neutral-300 block border-b border-neutral-800 pb-1">
                  Prospects ({filteredData.prospects.length})
                </span>
                {filteredData.prospects.length === 0 ? (
                  <span className="text-neutral-500 italic text-[11px]">Données insuffisantes</span>
                ) : (
                  <ul className="space-y-1.5 font-mono text-[11px]">
                    <li className="flex justify-between text-neutral-300">
                      <span>Proposition envoyée :</span>
                      <span>{proposalsSentProspects.length}</span>
                    </li>
                    <li className="flex justify-between text-emerald-400 font-semibold">
                      <span>Gagné :</span>
                      <span>{wonProspects.length}</span>
                    </li>
                    <li className="flex justify-between text-neutral-400">
                      <span>En échange / RDV :</span>
                      <span>
                        {
                          filteredData.prospects.filter(
                            (p) => p.status === 'Échange' || p.status === 'Rendez-vous'
                          ).length
                        }
                      </span>
                    </li>
                    <li className="flex justify-between text-neutral-500">
                      <span>À qualifier / contacter :</span>
                      <span>
                        {
                          filteredData.prospects.filter(
                            (p) => p.status === 'À qualifier' || p.status === 'À contacter'
                          ).length
                        }
                      </span>
                    </li>
                  </ul>
                )}
              </div>

              {/* Projects Breakdown */}
              <div className="space-y-2">
                <span className="font-semibold text-neutral-300 block border-b border-neutral-800 pb-1">
                  Projets ({filteredData.projects.length})
                </span>
                {filteredData.projects.length === 0 ? (
                  <span className="text-neutral-500 italic text-[11px]">Données insuffisantes</span>
                ) : (
                  <ul className="space-y-1.5 font-mono text-[11px]">
                    <li className="flex justify-between text-cyan-300 font-semibold">
                      <span>En cours :</span>
                      <span>{activeProjects.length}</span>
                    </li>
                    <li className="flex justify-between text-emerald-400">
                      <span>Livré :</span>
                      <span>{deliveredProjects.length}</span>
                    </li>
                    <li className="flex justify-between text-amber-300">
                      <span>À cadrer / À valider :</span>
                      <span>
                        {
                          filteredData.projects.filter(
                            (pr) => pr.status === 'À cadrer' || pr.status === 'À valider'
                          ).length
                        }
                      </span>
                    </li>
                    <li className="flex justify-between text-red-400">
                      <span>Bloqué :</span>
                      <span>{blockedProjects.length}</span>
                    </li>
                  </ul>
                )}
              </div>

              {/* Tasks Breakdown */}
              <div className="space-y-2">
                <span className="font-semibold text-neutral-300 block border-b border-neutral-800 pb-1">
                  Actions ({filteredData.tasks.length})
                </span>
                {filteredData.tasks.length === 0 ? (
                  <span className="text-neutral-500 italic text-[11px]">Données insuffisantes</span>
                ) : (
                  <ul className="space-y-1.5 font-mono text-[11px]">
                    <li className="flex justify-between text-emerald-400">
                      <span>Terminées :</span>
                      <span>{completedTasks.length}</span>
                    </li>
                    <li className="flex justify-between text-neutral-300">
                      <span>En cours :</span>
                      <span>{filteredData.tasks.filter((t) => t.status === 'En cours').length}</span>
                    </li>
                    <li className="flex justify-between text-neutral-400">
                      <span>À faire :</span>
                      <span>{filteredData.tasks.filter((t) => t.status === 'À faire').length}</span>
                    </li>
                    <li className="flex justify-between text-red-400 font-semibold">
                      <span>En retard sur échéance :</span>
                      <span>{overdueTasks.length}</span>
                    </li>
                  </ul>
                )}
              </div>
            </div>
          </div>

          {/* Transparent Measure Definitions Table */}
          <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 text-xs text-neutral-400 space-y-2">
            <div className="flex items-center gap-1.5 text-neutral-300 font-semibold text-xs">
              <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
              <span>Définitions & Règles de Calcul des Métriques Consolidées</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] leading-relaxed pt-1">
              <div>
                <strong className="text-neutral-200">Dénominateurs & Exhaustivité :</strong> Chaque ratio
                affiche explicitement le numérateur et le dénominateur total sur la période (ex: gagnés / total
                prospects). Si l’échantillon est inférieur à 3 entités, la mention « Données insuffisantes »
                s’affiche pour interdire toute extrapolation hâtive.
              </div>
              <div>
                <strong className="text-neutral-200">Non-Agrégation d’Unités Incompatibles :</strong> Les
                efforts en heures, montants financiers et comptages d'actions ne sont jamais fusionnés dans un
                score arbitraire. Chaque grandeur reste distincte et vérifiable dans ses fiches d'origine.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: FILE DE PROCHAINES ACTIONS TRANSVERSALE */}
      {activeTab === 'actions' && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-4">
          <div className="border-b border-neutral-800 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-white tracking-tight">
                File de Prochaines Actions Transversale
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Actions opérationnelles actives ordonnées par priorité et date d’échéance avec rattachement
                explicite.
              </p>
            </div>
            <span className="text-xs font-mono text-neutral-400">
              {nextActionsQueue.length} action(s) en attente
            </span>
          </div>

          {nextActionsQueue.length === 0 ? (
            <div className="p-8 text-center text-xs text-neutral-500 space-y-1">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto" />
              <p className="text-neutral-300 font-medium">Toutes les actions opérationnelles sont finalisées.</p>
              <p>Aucune tâche en retard ni action pendante dans la file transversale.</p>
            </div>
          ) : (
            <div className="divide-y divide-neutral-800/80">
              {nextActionsQueue.map((t) => {
                const isOverdue = t.dueDate && t.dueDate < todayStr;
                const branchObj = branches.find((b) => b.id === t.branchId);

                return (
                  <div
                    key={t.id}
                    className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-neutral-800/20 px-2 rounded-lg transition-colors"
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => toggleTaskStatus(t.id, t.status)}
                          className="w-4 h-4 rounded border border-neutral-600 hover:border-emerald-400 flex items-center justify-center transition-colors cursor-pointer"
                          title="Marquer comme terminée"
                        >
                          {t.status === 'Terminé' && <CheckSquare className="w-3 h-3 text-emerald-400" />}
                        </button>
                        <span className="text-xs font-semibold text-neutral-100">{t.title}</span>

                        {isOverdue && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-red-950 text-red-300 border border-red-800 font-semibold">
                            Échéance dépassée
                          </span>
                        )}

                        <span
                          className={`text-[9px] font-mono px-1.5 py-0.2 rounded border ${
                            t.priority === 'Haute'
                              ? 'bg-red-950/40 text-red-300 border-red-900'
                              : t.priority === 'Moyenne'
                              ? 'bg-amber-950/40 text-amber-300 border-amber-900'
                              : 'bg-neutral-800 text-neutral-300 border-neutral-700'
                          }`}
                        >
                          {t.priority}
                        </span>
                      </div>

                      {t.description && (
                        <p className="text-[11px] text-neutral-400 line-clamp-1 pl-6">
                          {t.description}
                        </p>
                      )}

                      {/* Associated entities tags */}
                      <div className="flex flex-wrap items-center gap-3 text-[10px] font-mono text-neutral-400 pl-6 pt-0.5">
                        <span className="flex items-center gap-1 text-neutral-300">
                          <Clock className="w-3 h-3 text-cyan-400" />
                          <span>Échéance : {t.dueDate || 'Non fixée'}</span>
                        </span>

                        {branchObj && (
                          <span className="flex items-center gap-1 text-neutral-300">
                            <span
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ backgroundColor: branchObj.color || '#0879E8' }}
                            />
                            <span>Branche : {branchObj.name}</span>
                          </span>
                        )}

                        {t.projectTitle && (
                          <span className="text-cyan-400">Projet : {t.projectTitle}</span>
                        )}

                        {t.prospectName && (
                          <span className="text-blue-400">Prospect : {t.prospectName}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => toggleTaskStatus(t.id, t.status)}
                        className="px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-[11px] text-neutral-200 transition-colors font-medium cursor-pointer"
                      >
                        {t.status === 'Terminé' ? 'Rouvrir' : 'Finaliser'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: FEUILLE DE ROUTE PRODUIT PHONING (NEXUS Customer & Sales Pilot) */}
      {activeTab === 'phoning_pilot' && (
        <div className="space-y-6">
          {/* Isolation & Strict Boundary Banner */}
          <div className="p-4 bg-red-950/40 border border-red-800 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-red-200 font-semibold text-xs">
              <Lock className="w-4 h-4 text-red-400 shrink-0" />
              <span>
                CLOISONNEMENT STRICT : Produit Client Autonome Isolé — Non Intégré aux Données Internes
              </span>
            </div>
            <p className="text-red-300/90 text-xs leading-relaxed">
              <strong>NEXUS Customer & Sales Pilot</strong> est une plateforme logicielle commerciale distincte
              déployée chez nos clients. Ses données de prospection, ses enregistrements et ses fichiers de contacts
              <strong> ne remontent jamais</strong> dans NEXUS OS. Seuls l'état d'avancement de la R&D logicielle
              et des indicateurs agrégés expressément convenus pourront figurer ici ultérieurement.
            </p>
          </div>

          {/* Product Sheet */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-neutral-800 pb-5">
              <div className="space-y-2">
                <div className="flex items-center gap-2 font-mono text-[11px]">
                  <span className="px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-800 font-semibold">
                    PRODUIT EN CADRAGE
                  </span>
                  <span className="px-2 py-0.5 rounded bg-neutral-950 text-neutral-400 border border-neutral-800">
                    Branche : Digital
                  </span>
                  <span className="px-2 py-0.5 rounded bg-neutral-950 text-neutral-400 border border-neutral-800">
                    Statut : Non lancé
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white tracking-tight">
                  NEXUS Customer & Sales Pilot
                </h3>
                <p className="text-xs text-neutral-300 max-w-2xl leading-relaxed">
                  Poste de travail des équipes au téléphone qui réunit avant, pendant et après appel : contexte du contact,
                  campagne en cours, script vivant, objections (comprendre, répondre, rebondir), résultats de qualification,
                  rappels planifiés, historique et indicateurs de performance manager.
                </p>
              </div>

              <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl text-xs space-y-1 font-mono text-right text-neutral-400 shrink-0">
                <span className="text-[10px] uppercase text-neutral-500 block">Prochaine étape critique</span>
                <strong className="text-cyan-300 block text-xs">
                  Spécification pilote sans téléphonie
                </strong>
                <span className="text-[10px] text-neutral-500">Validation ergonomique du poste d'appel</span>
              </div>
            </div>

            {/* Product Roadmap Phases / Lots */}
            <div className="space-y-4">
              <h4 className="text-xs font-mono uppercase tracking-wider text-neutral-400 font-semibold">
                Feuille de Route des Fonctionnalités par Lots :
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Lot V1 */}
                <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl space-y-3">
                  <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                    <span className="text-xs font-semibold text-white">
                      Lot V1 : Socle du Poste d'Appel (À spécifier)
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800">
                      En attente pilote
                    </span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-neutral-300">
                    <li className="flex items-start gap-2">
                      <span className="text-cyan-400 font-bold shrink-0">1.</span>
                      <span>Import CSV contrôlé avec validation des en-têtes et déduplication</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-cyan-400 font-bold shrink-0">2.</span>
                      <span>Gestion des contacts et segmentation par campagnes commerciales</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-cyan-400 font-bold shrink-0">3.</span>
                      <span>Champs personnalisés métiers selon la cible prospect</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-cyan-400 font-bold shrink-0">4.</span>
                      <span>Guides de conversation interactifs (scripts vivants par étape)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-cyan-400 font-bold shrink-0">5.</span>
                      <span>Bibliothèque d’objections structurée : Comprendre / Répondre / Rebondir</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-cyan-400 font-bold shrink-0">6.</span>
                      <span>Saisie manuelle structurée des résultats d'appel et planification des rappels</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-cyan-400 font-bold shrink-0">7.</span>
                      <span>Tableau de bord de campagne et indicateurs de productivité manager</span>
                    </li>
                  </ul>
                </div>

                {/* Versions Futures */}
                <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl space-y-3">
                  <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                    <span className="text-xs font-semibold text-white">
                      Versions Suivantes : Assistances Avancées (Projetées)
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-800 text-neutral-400 border border-neutral-700">
                      Futur
                    </span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-neutral-400">
                    <li className="flex items-start gap-2">
                      <span className="text-neutral-500 font-bold shrink-0">•</span>
                      <span>Assistant IA d'aide au téléopérateur soumis à validation humaine stricte</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-neutral-500 font-bold shrink-0">•</span>
                      <span>Couplage téléphonie (CTI / WebRTC) pour numérotation progressive</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-neutral-500 font-bold shrink-0">•</span>
                      <span>Transcription automatique et analyse de sentiments post-appel</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-neutral-500 font-bold shrink-0">•</span>
                      <span>Connecteurs CRM clients sécurisés sur protocole étanche</span>
                    </li>
                  </ul>
                  <p className="text-[10px] text-neutral-500 italic pt-2 border-t border-neutral-900">
                    Note formelle : Ces technologies ne sont ni actives ni déployées aujourd’hui. Aucune fausse
                    activité n’est simulée dans l'interface.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EDIT / CREATE BRANCH */}
      {isBranchModalOpen && (
        <Modal
          isOpen={isBranchModalOpen}
          onClose={() => setIsBranchModalOpen(false)}
          title={editingBranch ? `Modifier la Branche : ${editingBranch.name}` : 'Créer une Nouvelle Branche'}
          subtitle="Gouvernance et maturité opérationnelle de NEXUS Premium Solutions"
          maxWidth="max-w-xl"
        >
          <form onSubmit={handleSaveBranch} className="space-y-4 text-xs text-neutral-300">
            {formError && (
              <div className="p-3 bg-red-950/80 border border-red-800 text-red-300 rounded-lg">
                {formError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">
                  Nom de la branche <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ex: Consulting, Digital, Academy..."
                  className="w-full px-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded text-xs text-neutral-200 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">Code court (Trigramme / 4 lettres)</label>
                <input
                  type="text"
                  maxLength={6}
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                  placeholder="Ex: CONS, DIGI, ACAD..."
                  className="w-full px-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded text-xs text-neutral-200 font-mono focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-neutral-400 mb-1">Description & Périmètre de la branche</label>
              <textarea
                rows={2}
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Mission, activités couvertes et positionnement stratégique..."
                className="w-full px-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded text-xs text-neutral-200 focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">
                  Statut de maturité configuré <span className="text-red-400">*</span>
                </label>
                <select
                  value={formMaturity}
                  onChange={(e) => setFormMaturity(e.target.value as BranchMaturity)}
                  className="w-full px-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded text-xs text-neutral-200 focus:outline-none focus:border-cyan-400"
                >
                  <option value="Idée">Idée (Exploration initiale)</option>
                  <option value="Cadrage">Cadrage (Spécifications en cours)</option>
                  <option value="En cours">En cours (Développement / Amorçage)</option>
                  <option value="Actif">Actif (Opérationnel justifié)</option>
                  <option value="En pause">En pause (Suspendu)</option>
                </select>
                <p className="text-[10px] text-neutral-500 mt-1">
                  Ne choisir « Actif » que si des opérations réelles sont en production.
                </p>
              </div>

              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">Responsable / Pilote (Facultatif)</label>
                <input
                  type="text"
                  value={formResponsible}
                  onChange={(e) => setFormResponsible(e.target.value)}
                  placeholder="Ex: Marc Vaudreuil, Direction..."
                  className="w-full px-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded text-xs text-neutral-200 focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-neutral-400 mb-1">
                Priorités stratégiques (Une par ligne)
              </label>
              <textarea
                rows={3}
                value={formPriorities}
                onChange={(e) => setFormPriorities(e.target.value)}
                placeholder="Ex: Cadrer la méthodologie&#10;Préparer les gabarits de présentation"
                className="w-full px-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded text-xs text-neutral-200 focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-3 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => setIsBranchModalOpen(false)}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-xs font-medium transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-white hover:bg-neutral-100 text-neutral-950 rounded-lg text-xs font-medium transition-colors shadow-xs"
              >
                {editingBranch ? 'Enregistrer les modifications' : 'Créer la branche'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* DRILL-DOWN MODAL FOR CLICKED METRICS */}
      {drillDownModal && (
        <Modal
          isOpen={Boolean(drillDownModal)}
          onClose={() => setDrillDownModal(null)}
          title={drillDownModal.title}
          subtitle={drillDownModal.description}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4 text-xs">
            {drillDownModal.items.length === 0 ? (
              <p className="text-neutral-500 italic py-4 text-center">
                Aucun enregistrement source ne correspond à ce filtre.
              </p>
            ) : (
              <div className="max-h-96 overflow-y-auto divide-y divide-neutral-800">
                {drillDownModal.items.map((item) => (
                  <div key={item.id} className="py-2.5 flex items-start justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="font-semibold text-white">{item.title}</div>
                      {item.subtitle && <p className="text-[11px] text-neutral-400">{item.subtitle}</p>}
                    </div>

                    <div className="text-right shrink-0 space-y-1">
                      {item.status && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-neutral-800 text-neutral-300 border border-neutral-700">
                          {item.status}
                        </span>
                      )}
                      {item.date && (
                        <span className="text-[10px] text-neutral-500 font-mono block">{item.date}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-2 flex justify-end border-t border-neutral-800">
              <button
                type="button"
                onClick={() => setDrillDownModal(null)}
                className="px-4 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs font-medium"
              >
                Fermer
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
