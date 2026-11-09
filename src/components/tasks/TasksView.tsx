import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import {
  type Task,
  type TaskStatus,
  type TaskPriority,
  TASK_STATUSES,
  TASK_PRIORITIES,
} from '../../types/nexus';
import { Modal } from '../ui/Modal';
import { EmptyState } from '../ui/EmptyState';
import { LoadingSkeleton } from '../ui/LoadingSkeleton';
import {
  Search,
  Plus,
  CheckSquare,
  Check,
  Archive,
  ArchiveRestore,
  Trash2,
  Calendar,
  AlertCircle,
  Clock,
  Building2,
  Layers,
  ArrowUpDown,
  GitBranch,
} from 'lucide-react';

export const TasksView: React.FC = () => {
  const {
    tasks,
    projects,
    prospects,
    branches,
    loading,
    createTask,
    updateTask,
    toggleTaskStatus,
    toggleArchiveTask,
    deleteTask,
    exportToCSV,
    exportToJSON,
  } = useData();

  const todayStr = new Date().toISOString().split('T')[0];

  const [searchTerm, setSearchTerm] = useState('');
  const [quickFilter, setQuickFilter] = useState<'all' | 'today' | 'overdue' | 'in_progress' | 'completed'>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [branchFilter, setBranchFilter] = useState<string>('all');
  const [archiveFilter, setArchiveFilter] = useState<'active' | 'archived' | 'all'>('active');
  const [sortBy, setSortBy] = useState<'dueDate' | 'priority' | 'title'>('dueDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formDueDate, setFormDueDate] = useState('');
  const [formPriority, setFormPriority] = useState<TaskPriority>('Moyenne');
  const [formStatus, setFormStatus] = useState<TaskStatus>('À faire');
  const [formBranchId, setFormBranchId] = useState('');
  const [formProjectId, setFormProjectId] = useState('');
  const [formProspectId, setFormProspectId] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const openCreateModal = () => {
    setFormTitle('');
    setFormDescription('');
    setFormDueDate(todayStr);
    setFormPriority('Moyenne');
    setFormStatus('À faire');
    setFormBranchId('');
    setFormProjectId('');
    setFormProspectId('');
    setFormError(null);
    setIsCreateModalOpen(true);
  };

  const openEditModal = (t: Task) => {
    setEditingTask(t);
    setFormTitle(t.title);
    setFormDescription(t.description || '');
    setFormDueDate(t.dueDate || '');
    setFormPriority(t.priority);
    setFormStatus(t.status);
    setFormBranchId(t.branchId || '');
    setFormProjectId(t.projectId || '');
    setFormProspectId(t.prospectId || '');
    setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!formTitle.trim()) {
      setFormError("Le titre de l'action est obligatoire.");
      return;
    }

    const selectedProj = projects.find((p) => p.id === formProjectId);
    const selectedProspect = prospects.find((p) => p.id === formProspectId);

    try {
      const taskPayload: Partial<Task> = {
        title: formTitle.trim(),
        description: formDescription.trim(),
        dueDate: formDueDate || '',
        priority: formPriority,
        status: formStatus,
        branchId: formBranchId || '',
      };
      if (formProjectId && selectedProj) {
        taskPayload.projectId = formProjectId;
        taskPayload.projectTitle = selectedProj.title;
      }
      if (formProspectId && selectedProspect) {
        taskPayload.prospectId = formProspectId;
        taskPayload.prospectName = selectedProspect.company;
      }

      if (editingTask) {
        await updateTask(editingTask.id, taskPayload);
        setEditingTask(null);
      } else {
        await createTask(taskPayload as Parameters<typeof createTask>[0]);
        setIsCreateModalOpen(false);
      }
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Erreur lors de l’enregistrement');
    }
  };

  const filteredTasks = useMemo(() => {
    return tasks
      .filter((t) => {
        if (archiveFilter === 'active' && t.isArchived) return false;
        if (archiveFilter === 'archived' && !t.isArchived) return false;

        // Branch filter
        if (branchFilter !== 'all') {
          if (branchFilter === 'unassigned') {
            if (t.branchId) return false;
          } else if (t.branchId !== branchFilter) {
            return false;
          }
        }

        // Quick filter
        if (quickFilter === 'today') {
          if (t.status === 'Terminé' || !t.dueDate || t.dueDate > todayStr) return false;
        } else if (quickFilter === 'overdue') {
          if (t.status === 'Terminé' || !t.dueDate || t.dueDate >= todayStr) return false;
        } else if (quickFilter === 'in_progress') {
          if (t.status !== 'En cours') return false;
        } else if (quickFilter === 'completed') {
          if (t.status !== 'Terminé') return false;
        }

        // Priority filter
        if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;

        // Search term
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          const matchTitle = t.title.toLowerCase().includes(q);
          const matchDesc = (t.description || '').toLowerCase().includes(q);
          const matchProj = (t.projectTitle || '').toLowerCase().includes(q);
          const matchProspect = (t.prospectName || '').toLowerCase().includes(q);
          return matchTitle || matchDesc || matchProj || matchProspect;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'priority') {
          const weight: Record<TaskPriority, number> = { Haute: 3, Moyenne: 2, Basse: 1 };
          const pA = weight[a.priority] || 0;
          const pB = weight[b.priority] || 0;
          return sortOrder === 'asc' ? pA - pB : pB - pA;
        }
        const valA = a[sortBy] || '';
        const valB = b[sortBy] || '';
        const order = sortOrder === 'asc' ? 1 : -1;
        return valA.localeCompare(valB) * order;
      });
  }, [tasks, archiveFilter, branchFilter, quickFilter, priorityFilter, searchTerm, sortBy, sortOrder, todayStr]);

  const toggleSort = (field: 'dueDate' | 'priority' | 'title') => {
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
            placeholder="Rechercher une action, projet, client..."
            className="w-full pl-9 pr-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-neutral-700"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Filter tabs */}
          <div className="flex items-center bg-neutral-950 border border-neutral-800 rounded-lg p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setQuickFilter('all')}
              className={`px-2.5 py-1.5 rounded transition-colors ${
                quickFilter === 'all'
                  ? 'bg-neutral-800 text-white font-medium'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Toutes
            </button>
            <button
              type="button"
              onClick={() => setQuickFilter('today')}
              className={`px-2.5 py-1.5 rounded transition-colors ${
                quickFilter === 'today'
                  ? 'bg-amber-950 text-amber-300 font-medium'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Aujourd'hui
            </button>
            <button
              type="button"
              onClick={() => setQuickFilter('overdue')}
              className={`px-2.5 py-1.5 rounded transition-colors ${
                quickFilter === 'overdue'
                  ? 'bg-red-950 text-red-300 font-medium'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              En retard
            </button>
            <button
              type="button"
              onClick={() => setQuickFilter('in_progress')}
              className={`px-2.5 py-1.5 rounded transition-colors ${
                quickFilter === 'in_progress'
                  ? 'bg-neutral-800 text-white font-medium'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              En cours
            </button>
            <button
              type="button"
              onClick={() => setQuickFilter('completed')}
              className={`px-2.5 py-1.5 rounded transition-colors ${
                quickFilter === 'completed'
                  ? 'bg-neutral-800 text-white font-medium'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Terminées
            </button>
          </div>

          {/* Priority filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-300 focus:outline-none"
          >
            <option value="all">Toutes priorités</option>
            {TASK_PRIORITIES.map((pr) => (
              <option key={pr} value={pr}>
                Priorité {pr}
              </option>
            ))}
          </select>

          {/* Branch filter */}
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

          <div className="flex items-center gap-1 border-l border-neutral-800 pl-2">
            <button
              type="button"
              onClick={() => exportToCSV('tasks')}
              title="Exporter actions en CSV"
              className="px-2.5 py-2 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 rounded-lg text-xs text-neutral-300 transition-colors"
            >
              CSV
            </button>
            <button
              type="button"
              onClick={() => exportToJSON('tasks')}
              title="Exporter actions en JSON"
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
            <span>Nouvelle Action</span>
          </button>
        </div>
      </div>

      {/* Tasks Table */}
      {loading ? (
        <LoadingSkeleton rows={5} />
      ) : filteredTasks.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="Aucune action trouvée"
          description={
            searchTerm || quickFilter !== 'all' || priorityFilter !== 'all'
              ? 'Aucune action ne correspond à ces critères.'
              : 'Enregistrez votre première action opérationnelle pour rythmer votre journée de dirigeant.'
          }
          actionLabel="Créer une action"
          onAction={openCreateModal}
        />
      ) : (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-neutral-800 bg-neutral-950/60 text-neutral-400 font-medium select-none">
                  <th className="py-3 px-4 w-10">État</th>
                  <th
                    className="py-3 px-4 cursor-pointer hover:text-white"
                    onClick={() => toggleSort('title')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Action & Description</span>
                      <ArrowUpDown className="w-3 h-3 text-neutral-500" />
                    </div>
                  </th>
                  <th className="py-3 px-4">Branche</th>
                  <th
                    className="py-3 px-4 cursor-pointer hover:text-white"
                    onClick={() => toggleSort('priority')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Priorité</span>
                      <ArrowUpDown className="w-3 h-3 text-neutral-500" />
                    </div>
                  </th>
                  <th className="py-3 px-4">Contexte relié (Projet / Prospect)</th>
                  <th
                    className="py-3 px-4 cursor-pointer hover:text-white"
                    onClick={() => toggleSort('dueDate')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Échéance</span>
                      <ArrowUpDown className="w-3 h-3 text-neutral-500" />
                    </div>
                  </th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/80">
                {filteredTasks.map((t) => {
                  const isOverdue = t.status !== 'Terminé' && t.dueDate && t.dueDate < todayStr;
                  const isToday = t.status !== 'Terminé' && t.dueDate === todayStr;

                  return (
                    <tr
                      key={t.id}
                      className={`hover:bg-neutral-800/40 transition-colors ${
                        t.status === 'Terminé' ? 'opacity-60' : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => toggleTaskStatus(t.id, t.status)}
                          className={`w-4 h-4 rounded border flex items-center justify-center transition-colors cursor-pointer ${
                            t.status === 'Terminé'
                              ? 'bg-emerald-600 border-emerald-500 text-white'
                              : 'border-neutral-600 hover:border-emerald-400 text-transparent'
                          }`}
                          title={t.status === 'Terminé' ? 'Marquer à faire' : 'Marquer terminé'}
                        >
                          <Check className="w-3 h-3" />
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        <div
                          className={`font-semibold ${
                            t.status === 'Terminé' ? 'line-through text-neutral-400' : 'text-white'
                          }`}
                        >
                          {t.title}
                        </div>
                        {t.description && (
                          <div className="text-[11px] text-neutral-500 truncate max-w-sm mt-0.5">
                            {t.description}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {(() => {
                          const b = branches.find((br) => br.id === t.branchId);
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
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 text-[11px] font-medium rounded border ${
                            t.priority === 'Haute'
                              ? 'bg-red-950/80 text-red-300 border-red-800'
                              : t.priority === 'Moyenne'
                              ? 'bg-amber-950/80 text-amber-300 border-amber-800'
                              : 'bg-neutral-800 text-neutral-300 border-neutral-700/60'
                          }`}
                        >
                          {t.priority}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {t.projectTitle ? (
                          <div className="flex items-center gap-1.5 text-neutral-300 truncate max-w-[200px]">
                            <Layers className="w-3 h-3 text-neutral-500 shrink-0" />
                            <span className="truncate">{t.projectTitle}</span>
                          </div>
                        ) : t.prospectName ? (
                          <div className="flex items-center gap-1.5 text-neutral-300 truncate max-w-[200px]">
                            <Building2 className="w-3 h-3 text-neutral-500 shrink-0" />
                            <span className="truncate">{t.prospectName}</span>
                          </div>
                        ) : (
                          <span className="text-neutral-600">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px]">
                        {t.dueDate ? (
                          <span
                            className={
                              isOverdue
                                ? 'text-red-400 font-semibold'
                                : isToday
                                ? 'text-amber-400 font-semibold'
                                : 'text-neutral-300'
                            }
                          >
                            {t.dueDate}
                            {isOverdue && ' (En retard)'}
                            {isToday && ' (Aujourd’hui)'}
                          </span>
                        ) : (
                          <span className="text-neutral-600">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right space-x-1 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => openEditModal(t)}
                          className="px-2 py-1 text-[11px] text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded transition-colors"
                        >
                          Modifier
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleArchiveTask(t.id, t.isArchived)}
                          title={t.isArchived ? 'Désarchiver' : 'Archiver'}
                          className="p-1 text-neutral-400 hover:text-neutral-200 rounded transition-colors inline-flex items-center justify-center align-middle"
                        >
                          {t.isArchived ? (
                            <ArchiveRestore className="w-3.5 h-3.5" />
                          ) : (
                            <Archive className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Supprimer définitivement l'action ${t.title} ?`)) {
                              deleteTask(t.id);
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

      {/* Modal Create / Edit Task */}
      {(isCreateModalOpen || editingTask) && (
        <Modal
          isOpen={isCreateModalOpen || Boolean(editingTask)}
          onClose={() => {
            setIsCreateModalOpen(false);
            setEditingTask(null);
          }}
          title={editingTask ? "Modifier l'Action" : 'Nouvelle Action'}
          subtitle="Planification et suivi opérationnel"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            {formError && (
              <div className="p-3 bg-red-950/60 border border-red-900 text-red-300 text-xs rounded-lg">
                {formError}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Titre de l'action <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="Ex: Valider les termes de la proposition avec Marc Vaudreuil"
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-neutral-700"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Échéance
                </label>
                <input
                  type="date"
                  value={formDueDate}
                  onChange={(e) => setFormDueDate(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-neutral-700"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Priorité
                </label>
                <select
                  value={formPriority}
                  onChange={(e) => setFormPriority(e.target.value as TaskPriority)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-neutral-700"
                >
                  {TASK_PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Statut
                </label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as TaskStatus)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-neutral-700"
                >
                  {TASK_STATUSES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Branche NEXUS (Facultatif)
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
                  Projet relié
                </label>
                <select
                  value={formProjectId}
                  onChange={(e) => setFormProjectId(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-neutral-700"
                >
                  <option value="">Aucun projet lié</option>
                  {projects.map((pr) => (
                    <option key={pr.id} value={pr.id}>
                      {pr.title}
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
                  <option value="">Aucun prospect lié</option>
                  {prospects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.company} ({p.contactName})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Détails & Instructions
              </label>
              <textarea
                rows={3}
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Précisions sur les modalités de réalisation..."
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-neutral-700"
              />
            </div>

            <div className="pt-4 flex items-center justify-end gap-3 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setEditingTask(null);
                }}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-xs font-medium transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-white hover:bg-neutral-100 text-neutral-950 rounded-lg text-xs font-medium transition-colors shadow-xs"
              >
                {editingTask ? 'Mettre à jour' : "Créer l'action"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
