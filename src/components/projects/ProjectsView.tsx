import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import {
  type Project,
  type ProjectStatus,
  PROJECT_STATUSES,
} from '../../types/nexus';
import { Modal } from '../ui/Modal';
import { EmptyState } from '../ui/EmptyState';
import { LoadingSkeleton } from '../ui/LoadingSkeleton';
import {
  Search,
  Plus,
  Layers,
  Archive,
  ArchiveRestore,
  Trash2,
  Calendar,
  Building2,
  Briefcase,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowUpDown,
} from 'lucide-react';

export const ProjectsView: React.FC = () => {
  const {
    projects,
    offers,
    prospects,
    branches,
    tasks,
    loading,
    createProject,
    updateProject,
    toggleArchiveProject,
    deleteProject,
    exportToCSV,
    exportToJSON,
  } = useData();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [branchFilter, setBranchFilter] = useState<string>('all');
  const [archiveFilter, setArchiveFilter] = useState<'active' | 'archived' | 'all'>('active');
  const [sortBy, setSortBy] = useState<'title' | 'status' | 'targetDate'>('targetDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [detailProject, setDetailProject] = useState<Project | null>(null);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formOfferId, setFormOfferId] = useState('');
  const [formProspectId, setFormProspectId] = useState('');
  const [formBranchId, setFormBranchId] = useState('');
  const [formBusinessObjective, setFormBusinessObjective] = useState('');
  const [formScope, setFormScope] = useState('');
  const [formStatus, setFormStatus] = useState<ProjectStatus>('À cadrer');
  const [formStartDate, setFormStartDate] = useState('');
  const [formTargetDate, setFormTargetDate] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const openCreateModal = () => {
    setFormTitle('');
    setFormOfferId('');
    setFormProspectId('');
    setFormBranchId('');
    setFormBusinessObjective('');
    setFormScope('');
    setFormStatus('À cadrer');
    setFormStartDate(new Date().toISOString().split('T')[0]);
    setFormTargetDate('');
    setFormNotes('');
    setFormError(null);
    setIsCreateModalOpen(true);
  };

  const openEditModal = (pr: Project) => {
    setEditingProject(pr);
    setFormTitle(pr.title);
    setFormOfferId(pr.offerId || '');
    setFormProspectId(pr.prospectId || '');
    setFormBranchId(pr.branchId || '');
    setFormBusinessObjective(pr.businessObjective || '');
    setFormScope(pr.scope || '');
    setFormStatus(pr.status);
    setFormStartDate(pr.startDate || '');
    setFormTargetDate(pr.targetDate || '');
    setFormNotes(pr.notes || '');
    setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!formTitle.trim()) {
      setFormError('Le titre du projet est obligatoire.');
      return;
    }

    const selectedOffer = offers.find((o) => o.id === formOfferId);
    const selectedProspect = prospects.find((p) => p.id === formProspectId);

    try {
      const projectPayload: Partial<Project> = {
        title: formTitle.trim(),
        businessObjective: formBusinessObjective.trim(),
        scope: formScope.trim(),
        status: formStatus,
        branchId: formBranchId || '',
        startDate: formStartDate || '',
        targetDate: formTargetDate || '',
        notes: formNotes.trim(),
      };
      if (formOfferId && selectedOffer) {
        projectPayload.offerId = formOfferId;
        projectPayload.offerName = selectedOffer.name;
      }
      if (formProspectId && selectedProspect) {
        projectPayload.prospectId = formProspectId;
        projectPayload.clientName = selectedProspect.company;
      }

      if (editingProject) {
        await updateProject(editingProject.id, projectPayload);
        setEditingProject(null);
      } else {
        await createProject(projectPayload as Parameters<typeof createProject>[0]);
        setIsCreateModalOpen(false);
      }
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Erreur lors de l’enregistrement');
    }
  };

  const filteredProjects = useMemo(() => {
    return projects
      .filter((pr) => {
        if (archiveFilter === 'active' && pr.isArchived) return false;
        if (archiveFilter === 'archived' && !pr.isArchived) return false;
        if (statusFilter !== 'all' && pr.status !== statusFilter) return false;
        if (branchFilter !== 'all') {
          if (branchFilter === 'unassigned') {
            if (pr.branchId) return false;
          } else if (pr.branchId !== branchFilter) {
            return false;
          }
        }
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          const matchTitle = pr.title.toLowerCase().includes(q);
          const matchClient = (pr.clientName || '').toLowerCase().includes(q);
          const matchOffer = (pr.offerName || '').toLowerCase().includes(q);
          const matchObjective = (pr.businessObjective || '').toLowerCase().includes(q);
          return matchTitle || matchClient || matchOffer || matchObjective;
        }
        return true;
      })
      .sort((a, b) => {
        const valA = a[sortBy] || '';
        const valB = b[sortBy] || '';
        const order = sortOrder === 'asc' ? 1 : -1;
        return valA.localeCompare(valB) * order;
      });
  }, [projects, archiveFilter, statusFilter, branchFilter, searchTerm, sortBy, sortOrder]);

  const toggleSort = (field: 'title' | 'status' | 'targetDate') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Controls Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-neutral-900 border border-neutral-800 p-4 rounded-xl">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher projet, client, offre reliée..."
            className="w-full pl-9 pr-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-neutral-700"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-300 focus:outline-none"
          >
            <option value="all">Tous les statuts de projet</option>
            {PROJECT_STATUSES.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>

          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-300 focus:outline-none"
          >
            <option value="all">Toutes les branches</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.code})
              </option>
            ))}
            <option value="unassigned">Transversale / Non assignée</option>
          </select>

          <div className="flex items-center bg-neutral-950 border border-neutral-800 rounded-lg p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setArchiveFilter('active')}
              className={`px-2.5 py-1.5 rounded transition-colors ${
                archiveFilter === 'active'
                  ? 'bg-neutral-800 text-white font-medium'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Actifs
            </button>
            <button
              type="button"
              onClick={() => setArchiveFilter('archived')}
              className={`px-2.5 py-1.5 rounded transition-colors ${
                archiveFilter === 'archived'
                  ? 'bg-neutral-800 text-white font-medium'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Archivés
            </button>
          </div>

          <div className="flex items-center gap-1 border-l border-neutral-800 pl-2">
            <button
              type="button"
              onClick={() => exportToCSV('projects')}
              title="Exporter projets en CSV"
              className="px-2.5 py-2 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 rounded-lg text-xs text-neutral-300 transition-colors"
            >
              CSV
            </button>
            <button
              type="button"
              onClick={() => exportToJSON('projects')}
              title="Exporter projets en JSON"
              className="px-2.5 py-2 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 rounded-lg text-xs text-neutral-300 transition-colors"
            >
              JSON
            </button>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-neutral-100 text-neutral-950 font-medium text-xs rounded-lg transition-colors shadow-xs ml-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nouveau Projet</span>
          </button>
        </div>
      </div>

      {/* Main Table */}
      {loading ? (
        <LoadingSkeleton rows={5} />
      ) : filteredProjects.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="Aucun projet correspondant"
          description={
            searchTerm || statusFilter !== 'all'
              ? 'Aucun projet ne correspond à vos filtres.'
              : 'Créez un projet de digitalisation ou d’orchestration pour structurer vos livrables et vos tâches.'
          }
          actionLabel="Créer un projet"
          onAction={openCreateModal}
        />
      ) : (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-neutral-800 bg-neutral-950/60 text-neutral-400 font-medium select-none">
                  <th
                    className="py-3 px-4 cursor-pointer hover:text-white"
                    onClick={() => toggleSort('title')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Titre du projet</span>
                      <ArrowUpDown className="w-3 h-3 text-neutral-500" />
                    </div>
                  </th>
                  <th
                    className="py-3 px-4 cursor-pointer hover:text-white"
                    onClick={() => toggleSort('status')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Statut</span>
                      <ArrowUpDown className="w-3 h-3 text-neutral-500" />
                    </div>
                  </th>
                  <th className="py-3 px-4">Branche</th>
                  <th className="py-3 px-4">Offre & Client reliés</th>
                  <th
                    className="py-3 px-4 cursor-pointer hover:text-white"
                    onClick={() => toggleSort('targetDate')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Échéance cible</span>
                      <ArrowUpDown className="w-3 h-3 text-neutral-500" />
                    </div>
                  </th>
                  <th className="py-3 px-4">Tâches</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/80">
                {filteredProjects.map((pr) => {
                  const projectTasks = tasks.filter((t) => t.projectId === pr.id && !t.isArchived);
                  const completedTasks = projectTasks.filter((t) => t.status === 'Terminé').length;

                  return (
                    <tr
                      key={pr.id}
                      className="hover:bg-neutral-800/40 transition-colors group cursor-pointer"
                      onClick={() => setDetailProject(pr)}
                    >
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white">{pr.title}</div>
                        <div className="text-[11px] text-neutral-400 truncate max-w-xs mt-0.5">
                          {pr.businessObjective || 'Aucun objectif explicite'}
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 text-[11px] font-medium rounded border ${
                            pr.status === 'Bloqué'
                              ? 'bg-red-950/80 text-red-300 border-red-800'
                              : pr.status === 'Livré'
                              ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                              : 'bg-neutral-800 text-neutral-200 border-neutral-700/60'
                          }`}
                        >
                          {pr.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {(() => {
                          const b = branches.find((br) => br.id === pr.branchId);
                          return b ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-medium border border-neutral-800 bg-neutral-950 text-neutral-200">
                              <span
                                className="w-1.5 h-1.5 rounded-full shrink-0"
                                style={{ backgroundColor: b.color || '#0879E8' }}
                              />
                              <span>{b.code}</span>
                            </span>
                          ) : (
                            <span className="text-neutral-600 text-xs">—</span>
                          );
                        })()}
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-neutral-300 font-medium truncate">
                          {pr.clientName || 'Projet Interne'}
                        </div>
                        <div className="text-[11px] text-neutral-500 truncate mt-0.5">
                          {pr.offerName ? `Offre : ${pr.offerName}` : 'Aucune offre liée'}
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px] text-neutral-300">
                        {pr.targetDate || '—'}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-neutral-400 font-mono text-[11px]">
                        {projectTasks.length > 0 ? (
                          <span>
                            {completedTasks}/{projectTasks.length} terminées
                          </span>
                        ) : (
                          <span className="text-neutral-600">0 action</span>
                        )}
                      </td>
                      <td
                        className="py-3 px-4 text-right space-x-1 whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => setDetailProject(pr)}
                          className="px-2 py-1 text-[11px] text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded transition-colors"
                        >
                          Détails
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditModal(pr)}
                          className="px-2 py-1 text-[11px] text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded transition-colors"
                        >
                          Modifier
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleArchiveProject(pr.id, pr.isArchived)}
                          title={pr.isArchived ? 'Désarchiver' : 'Archiver'}
                          className="p-1 text-neutral-400 hover:text-neutral-200 rounded transition-colors inline-flex items-center justify-center align-middle"
                        >
                          {pr.isArchived ? (
                            <ArchiveRestore className="w-3.5 h-3.5" />
                          ) : (
                            <Archive className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Supprimer définitivement le projet ${pr.title} ?`)) {
                              deleteProject(pr.id);
                            }
                          }}
                          title="Supprimer"
                          className="p-1 text-neutral-500 hover:text-red-400 rounded transition-colors inline-flex items-center justify-center align-middle"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Detail Project */}
      {detailProject && (
        <Modal
          isOpen={Boolean(detailProject)}
          onClose={() => setDetailProject(null)}
          title={detailProject.title}
          subtitle={`Projet · Statut : ${detailProject.status}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4 pt-1">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg text-xs space-y-1">
                <span className="text-neutral-500">Client / Bénéficiaire</span>
                <p className="font-semibold text-neutral-200 text-sm">
                  {detailProject.clientName || 'Projet Interne NEXUS'}
                </p>
                {detailProject.offerName && (
                  <p className="text-neutral-400 text-[11px] pt-1">
                    Offre reliée : <span className="text-neutral-300">{detailProject.offerName}</span>
                  </p>
                )}
              </div>

              <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg text-xs space-y-1">
                <span className="text-neutral-500">Branche NEXUS</span>
                {(() => {
                  const b = branches.find((br) => br.id === detailProject.branchId);
                  return b ? (
                    <div className="flex items-center gap-1.5 pt-1">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: b.color || '#0879E8' }} />
                      <span className="font-semibold text-neutral-200">{b.name}</span>
                      <span className="font-mono text-[10px] text-neutral-400">({b.code})</span>
                    </div>
                  ) : (
                    <p className="text-neutral-400 italic text-[11px] pt-1">Transversale / Non assignée</p>
                  );
                })()}
              </div>

              <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg text-xs space-y-1">
                <span className="text-neutral-500">Calendrier</span>
                <p className="text-neutral-300 font-mono text-[11px]">
                  Début : {detailProject.startDate || 'Non défini'}
                </p>
                <p className="text-neutral-300 font-mono text-[11px]">
                  Cible : {detailProject.targetDate || 'Non définie'}
                </p>
              </div>
            </div>

            <div>
              <span className="text-xs font-semibold text-neutral-300 block mb-1">
                Objectif business
              </span>
              <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-300 leading-relaxed whitespace-pre-wrap">
                {detailProject.businessObjective || 'Aucun objectif renseigné.'}
              </div>
            </div>

            <div>
              <span className="text-xs font-semibold text-neutral-300 block mb-1">
                Périmètre & Spécifications
              </span>
              <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-300 leading-relaxed whitespace-pre-wrap">
                {detailProject.scope || 'Aucun périmètre spécifié.'}
              </div>
            </div>

            {detailProject.notes && (
              <div>
                <span className="text-xs font-semibold text-neutral-300 block mb-1">
                  Notes de suivi
                </span>
                <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-400 leading-relaxed whitespace-pre-wrap">
                  {detailProject.notes}
                </div>
              </div>
            )}

            <div className="pt-2 flex justify-end gap-2 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => {
                  const pr = detailProject;
                  setDetailProject(null);
                  openEditModal(pr);
                }}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-xs font-medium transition-colors"
              >
                Modifier le projet
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal Create / Edit Project */}
      {(isCreateModalOpen || editingProject) && (
        <Modal
          isOpen={isCreateModalOpen || Boolean(editingProject)}
          onClose={() => {
            setIsCreateModalOpen(false);
            setEditingProject(null);
          }}
          title={editingProject ? 'Modifier le Projet' : 'Nouveau Projet'}
          subtitle="Cadrage d’un projet de digitalisation ou d’ingénierie d’affaires"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            {formError && (
              <div className="p-3 bg-red-950/60 border border-red-900 text-red-300 text-xs rounded-lg">
                {formError}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Titre du projet <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="Ex: Cartographie des flux & Cadrage - Manufacture Jura"
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-neutral-700"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Branche NEXUS (optionnel)
                </label>
                <select
                  value={formBranchId}
                  onChange={(e) => setFormBranchId(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-neutral-700"
                >
                  <option value="">Transversale / Non assignée</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Offre reliée
                </label>
                <select
                  value={formOfferId}
                  onChange={(e) => setFormOfferId(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-neutral-700"
                >
                  <option value="">Sélectionner une offre (optionnel)</option>
                  {offers.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name} ({o.code || 'REF'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Prospect / Client relié
                </label>
                <select
                  value={formProspectId}
                  onChange={(e) => setFormProspectId(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-neutral-700"
                >
                  <option value="">Sélectionner un prospect / client (optionnel)</option>
                  {prospects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.company} ({p.contactName})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Statut du projet <span className="text-red-400">*</span>
                </label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as ProjectStatus)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-neutral-700"
                >
                  {PROJECT_STATUSES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Date de démarrage
                </label>
                <input
                  type="date"
                  value={formStartDate}
                  onChange={(e) => setFormStartDate(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-neutral-700"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Échéance cible
                </label>
                <input
                  type="date"
                  value={formTargetDate}
                  onChange={(e) => setFormTargetDate(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-neutral-700"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Objectif business (Raison d'être du projet)
              </label>
              <textarea
                rows={2}
                value={formBusinessObjective}
                onChange={(e) => setFormBusinessObjective(e.target.value)}
                placeholder="Ex: Réduire les erreurs de saisie d'atelier de 80% avant le déploiement du nouvel ordonnancement..."
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-neutral-700"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Périmètre & Livrables
              </label>
              <textarea
                rows={2}
                value={formScope}
                onChange={(e) => setFormScope(e.target.value)}
                placeholder="Ex: Phase 1 : Cartographie. Phase 2 : Modélisation. Phase 3 : Validation dirigeant..."
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-neutral-700"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Notes de suivi
              </label>
              <input
                type="text"
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                placeholder="Ex: Réunion de cadrage chaque lundi matin..."
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-neutral-700"
              />
            </div>

            <div className="pt-4 flex items-center justify-end gap-3 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setEditingProject(null);
                }}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-xs font-medium transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-white hover:bg-neutral-100 text-neutral-950 rounded-lg text-xs font-medium transition-colors shadow-xs"
              >
                {editingProject ? 'Mettre à jour' : 'Créer le projet'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
