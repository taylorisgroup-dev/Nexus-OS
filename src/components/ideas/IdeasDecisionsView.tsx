import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import {
  type Idea,
  type IdeaStatus,
  IDEA_STATUSES,
  type Decision,
  type DecisionStatus,
  DECISION_STATUSES,
} from '../../types/nexus';
import { Modal } from '../ui/Modal';
import { EmptyState } from '../ui/EmptyState';
import { LoadingSkeleton } from '../ui/LoadingSkeleton';
import {
  Lightbulb,
  CheckCircle2,
  Plus,
  Search,
  Archive,
  ArchiveRestore,
  Trash2,
  Calendar,
  Sparkles,
  Scale,
  Compass,
} from 'lucide-react';

export const IdeasDecisionsView: React.FC = () => {
  const {
    ideas,
    decisions,
    loading,
    createIdea,
    updateIdea,
    toggleArchiveIdea,
    deleteIdea,
    createDecision,
    updateDecision,
    toggleArchiveDecision,
    deleteDecision,
  } = useData();

  const [activeTab, setActiveTab] = useState<'ideas' | 'decisions'>('ideas');
  const [searchTerm, setSearchTerm] = useState('');
  const [archiveFilter, setArchiveFilter] = useState<'active' | 'archived' | 'all'>('active');

  // Modals
  const [isIdeaModalOpen, setIsIdeaModalOpen] = useState(false);
  const [editingIdea, setEditingIdea] = useState<Idea | null>(null);

  const [isDecisionModalOpen, setIsDecisionModalOpen] = useState(false);
  const [editingDecision, setEditingDecision] = useState<Decision | null>(null);

  // Form States for Ideas
  const [ideaTitle, setIdeaTitle] = useState('');
  const [ideaTheme, setIdeaTheme] = useState('');
  const [ideaDesc, setIdeaDesc] = useState('');
  const [ideaImpact, setIdeaImpact] = useState('');
  const [ideaStatus, setIdeaStatus] = useState<IdeaStatus>('Nouvelle');
  const [ideaError, setIdeaError] = useState<string | null>(null);

  // Form States for Decisions
  const [decTitle, setDecTitle] = useState('');
  const [decDate, setDecDate] = useState(new Date().toISOString().split('T')[0]);
  const [decContext, setDecContext] = useState('');
  const [decDecision, setDecDecision] = useState('');
  const [decJustification, setDecJustification] = useState('');
  const [decStatus, setDecStatus] = useState<DecisionStatus>('Actée');
  const [decError, setDecError] = useState<string | null>(null);

  // Open Handlers
  const openCreateIdea = () => {
    setIdeaTitle('');
    setIdeaTheme('');
    setIdeaDesc('');
    setIdeaImpact('');
    setIdeaStatus('Nouvelle');
    setIdeaError(null);
    setIsIdeaModalOpen(true);
  };

  const openEditIdea = (i: Idea) => {
    setEditingIdea(i);
    setIdeaTitle(i.title);
    setIdeaTheme(i.theme || '');
    setIdeaDesc(i.description || '');
    setIdeaImpact(i.potentialImpact || '');
    setIdeaStatus(i.status);
    setIdeaError(null);
  };

  const openCreateDecision = () => {
    setDecTitle('');
    setDecDate(new Date().toISOString().split('T')[0]);
    setDecContext('');
    setDecDecision('');
    setDecJustification('');
    setDecStatus('Actée');
    setDecError(null);
    setIsDecisionModalOpen(true);
  };

  const openEditDecision = (d: Decision) => {
    setEditingDecision(d);
    setDecTitle(d.title);
    setDecDate(d.date);
    setDecContext(d.context || '');
    setDecDecision(d.decision || '');
    setDecJustification(d.businessJustification || '');
    setDecStatus(d.status);
    setDecError(null);
  };

  // Submit Handlers
  const handleIdeaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIdeaError(null);
    if (!ideaTitle.trim()) {
      setIdeaError("Le titre de l'idée est obligatoire.");
      return;
    }
    try {
      if (editingIdea) {
        await updateIdea(editingIdea.id, {
          title: ideaTitle.trim(),
          theme: ideaTheme.trim(),
          description: ideaDesc.trim(),
          potentialImpact: ideaImpact.trim(),
          status: ideaStatus,
        });
        setEditingIdea(null);
      } else {
        await createIdea({
          title: ideaTitle.trim(),
          theme: ideaTheme.trim(),
          description: ideaDesc.trim(),
          potentialImpact: ideaImpact.trim(),
          status: ideaStatus,
        });
        setIsIdeaModalOpen(false);
      }
    } catch (err: unknown) {
      setIdeaError(err instanceof Error ? err.message : 'Erreur d’enregistrement');
    }
  };

  const handleDecisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDecError(null);
    if (!decTitle.trim()) {
      setDecError('Le titre de la décision est obligatoire.');
      return;
    }
    if (!decDecision.trim()) {
      setDecError('Le contenu de la décision prise est obligatoire.');
      return;
    }
    try {
      if (editingDecision) {
        await updateDecision(editingDecision.id, {
          title: decTitle.trim(),
          date: decDate,
          context: decContext.trim(),
          decision: decDecision.trim(),
          businessJustification: decJustification.trim(),
          status: decStatus,
        });
        setEditingDecision(null);
      } else {
        await createDecision({
          title: decTitle.trim(),
          date: decDate,
          context: decContext.trim(),
          decision: decDecision.trim(),
          businessJustification: decJustification.trim(),
          status: decStatus,
        });
        setIsDecisionModalOpen(false);
      }
    } catch (err: unknown) {
      setDecError(err instanceof Error ? err.message : 'Erreur d’enregistrement');
    }
  };

  // Filtered lists
  const filteredIdeas = useMemo(() => {
    return ideas.filter((i) => {
      if (archiveFilter === 'active' && i.isArchived) return false;
      if (archiveFilter === 'archived' && !i.isArchived) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        return (
          i.title.toLowerCase().includes(q) ||
          (i.theme || '').toLowerCase().includes(q) ||
          (i.description || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [ideas, archiveFilter, searchTerm]);

  const filteredDecisions = useMemo(() => {
    return decisions.filter((d) => {
      if (archiveFilter === 'active' && d.isArchived) return false;
      if (archiveFilter === 'archived' && !d.isArchived) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        return (
          d.title.toLowerCase().includes(q) ||
          (d.context || '').toLowerCase().includes(q) ||
          (d.decision || '').toLowerCase().includes(q) ||
          (d.businessJustification || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [decisions, archiveFilter, searchTerm]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Tab Switcher & Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-neutral-900 border border-neutral-800 p-4 rounded-xl">
        {/* Main Category Tabs */}
        <div className="flex items-center gap-1 p-1 bg-neutral-950 border border-neutral-800 rounded-lg">
          <button
            type="button"
            onClick={() => setActiveTab('ideas')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'ideas'
                ? 'bg-neutral-800 text-white shadow-xs'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Lightbulb className="w-3.5 h-3.5" />
            <span>Idées & Opportunités</span>
            <span className="font-mono text-[10px] text-neutral-400">({ideas.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('decisions')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'decisions'
                ? 'bg-neutral-800 text-white shadow-xs'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>Journal des Décisions</span>
            <span className="font-mono text-[10px] text-neutral-400">({decisions.length})</span>
          </button>
        </div>

        {/* Right Search, Archive & Add */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[180px]">
            <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher..."
              className="w-full pl-8 pr-2.5 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center bg-neutral-950 border border-neutral-800 rounded-lg p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setArchiveFilter('active')}
              className={`px-2 py-1 rounded transition-colors ${
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
              className={`px-2 py-1 rounded transition-colors ${
                archiveFilter === 'archived'
                  ? 'bg-neutral-800 text-white font-medium'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Archivés
            </button>
          </div>

          <button
            type="button"
            onClick={activeTab === 'ideas' ? openCreateIdea : openCreateDecision}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-neutral-100 text-neutral-950 font-medium text-xs rounded-lg transition-colors shadow-xs ml-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{activeTab === 'ideas' ? 'Nouvelle Idée' : 'Nouvelle Décision'}</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Ideas Grid */}
      {activeTab === 'ideas' && (
        <>
          {loading ? (
            <LoadingSkeleton rows={4} />
          ) : filteredIdeas.length === 0 ? (
            <EmptyState
              icon={Lightbulb}
              title="Aucune idée répertoriée"
              description="Capturez des opportunités business, réflexions d'ingénierie ou concepts sans alourdir votre pipeline opérationnel."
              actionLabel="Consigner une idée"
              onAction={openCreateIdea}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredIdeas.map((item) => (
                <div
                  key={item.id}
                  className="bg-neutral-900 border border-neutral-800 hover:border-neutral-700/80 rounded-xl p-5 flex flex-col justify-between transition-colors space-y-3"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-medium text-neutral-400 text-[11px]">
                        {item.theme || 'Général'}
                      </span>
                      <span
                        className={`px-2 py-0.5 text-[10px] font-medium rounded border ${
                          item.status === 'Retenue'
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                            : item.status === 'Rejetée'
                            ? 'bg-neutral-950 text-neutral-500 border-neutral-800'
                            : 'bg-neutral-800 text-neutral-300 border-neutral-700'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>

                    <h3 className="text-sm font-semibold tracking-tight text-white">{item.title}</h3>

                    {item.description && (
                      <p className="text-xs text-neutral-300 mt-2 leading-relaxed whitespace-pre-wrap">
                        {item.description}
                      </p>
                    )}

                    {item.potentialImpact && (
                      <div className="mt-3 pt-2.5 border-t border-neutral-800/80 text-[11px] text-amber-300/80">
                        <span className="font-medium text-amber-400">Impact attendu : </span>
                        <span>{item.potentialImpact}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-neutral-500 font-mono">
                      {item.isArchived ? 'Archivée' : 'Active'}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEditIdea(item)}
                        className="px-2 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded text-xs transition-colors"
                      >
                        Modifier
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleArchiveIdea(item.id, item.isArchived)}
                        title={item.isArchived ? 'Désarchiver' : 'Archiver'}
                        className="p-1 text-neutral-400 hover:text-white rounded transition-colors"
                      >
                        {item.isArchived ? (
                          <ArchiveRestore className="w-3.5 h-3.5" />
                        ) : (
                          <Archive className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Supprimer l'idée ${item.title} ?`)) {
                            deleteIdea(item.id);
                          }
                        }}
                        title="Supprimer"
                        className="p-1 text-neutral-500 hover:text-red-400 rounded transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Tab 2: Decisions Journal */}
      {activeTab === 'decisions' && (
        <>
          {loading ? (
            <LoadingSkeleton rows={4} />
          ) : filteredDecisions.length === 0 ? (
            <EmptyState
              icon={Scale}
              title="Aucune décision consignée"
              description="Formalisez les choix directoriaux avec contexte et justification métier pour ancrer le principe « L’entreprise d’abord. La technologie ensuite. »"
              actionLabel="Enregistrer une décision"
              onAction={openCreateDecision}
            />
          ) : (
            <div className="space-y-4">
              {filteredDecisions.map((dec) => (
                <div
                  key={dec.id}
                  className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-800 pb-3">
                    <div>
                      <div className="flex items-center gap-2 text-[11px] text-neutral-400">
                        <Calendar className="w-3 h-3 text-neutral-500" />
                        <span className="font-mono">{dec.date}</span>
                        <span>·</span>
                        <span className="px-2 py-0.2 rounded bg-neutral-800 text-neutral-200 font-medium">
                          {dec.status}
                        </span>
                      </div>
                      <h3 className="text-sm font-semibold tracking-tight text-white mt-1">
                        {dec.title}
                      </h3>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 self-start sm:self-auto">
                      <button
                        type="button"
                        onClick={() => openEditDecision(dec)}
                        className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded text-xs transition-colors"
                      >
                        Modifier
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleArchiveDecision(dec.id, dec.isArchived)}
                        title={dec.isArchived ? 'Désarchiver' : 'Archiver'}
                        className="p-1.5 text-neutral-400 hover:text-white rounded transition-colors"
                      >
                        {dec.isArchived ? (
                          <ArchiveRestore className="w-3.5 h-3.5" />
                        ) : (
                          <Archive className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Supprimer la décision ${dec.title} ?`)) {
                            deleteDecision(dec.id);
                          }
                        }}
                        title="Supprimer"
                        className="p-1.5 text-neutral-500 hover:text-red-400 rounded transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="p-3 bg-neutral-950 border border-neutral-800/80 rounded-lg space-y-1">
                      <span className="text-[11px] font-medium text-neutral-400 block">
                        Contexte & Analyse du besoin :
                      </span>
                      <p className="text-neutral-300 leading-relaxed whitespace-pre-wrap">
                        {dec.context || 'Non renseigné'}
                      </p>
                    </div>

                    <div className="p-3 bg-neutral-950 border border-neutral-800/80 rounded-lg space-y-1">
                      <span className="text-[11px] font-medium text-neutral-400 block">
                        Décision actée :
                      </span>
                      <p className="text-neutral-200 font-medium leading-relaxed whitespace-pre-wrap">
                        {dec.decision}
                      </p>
                    </div>
                  </div>

                  {dec.businessJustification && (
                    <div className="p-3 bg-neutral-950/40 border border-neutral-800/60 rounded-lg text-xs">
                      <span className="text-[11px] font-medium text-amber-400 block">
                        Justification métier (« L’entreprise d’abord. La technologie ensuite. ») :
                      </span>
                      <p className="text-neutral-300 leading-relaxed mt-0.5 whitespace-pre-wrap">
                        {dec.businessJustification}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Modal Idea Form */}
      {(isIdeaModalOpen || editingIdea) && (
        <Modal
          isOpen={isIdeaModalOpen || Boolean(editingIdea)}
          onClose={() => {
            setIsIdeaModalOpen(false);
            setEditingIdea(null);
          }}
          title={editingIdea ? "Modifier l'Idée" : 'Nouvelle Idée'}
          subtitle="Registre des opportunités & concepts business"
        >
          <form onSubmit={handleIdeaSubmit} className="space-y-4">
            {ideaError && (
              <div className="p-3 bg-red-950/60 border border-red-900 text-red-300 text-xs rounded-lg">
                {ideaError}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Titre de l'idée <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={ideaTitle}
                onChange={(e) => setIdeaTitle(e.target.value)}
                placeholder="Ex: Méthodologie d’audit anti-doublons logiciels pour PME"
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-neutral-700"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Thématique
                </label>
                <input
                  type="text"
                  value={ideaTheme}
                  onChange={(e) => setIdeaTheme(e.target.value)}
                  placeholder="Ex: Ingénierie d'affaires, Orchestration, Partenariats..."
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-neutral-700"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Statut de l'idée
                </label>
                <select
                  value={ideaStatus}
                  onChange={(e) => setIdeaStatus(e.target.value as IdeaStatus)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-neutral-700"
                >
                  {IDEA_STATUSES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Description du concept
              </label>
              <textarea
                rows={3}
                value={ideaDesc}
                onChange={(e) => setIdeaDesc(e.target.value)}
                placeholder="Explication du fonctionnement, cas d'usage envisagé..."
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-neutral-700"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Impact potentiel estimé
              </label>
              <input
                type="text"
                value={ideaImpact}
                onChange={(e) => setIdeaImpact(e.target.value)}
                placeholder="Ex: Gain de clarté immédiat, économie de 2h/semaine..."
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-neutral-700"
              />
            </div>

            <div className="pt-4 flex items-center justify-end gap-3 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => {
                  setIsIdeaModalOpen(false);
                  setEditingIdea(null);
                }}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-xs font-medium transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-white hover:bg-neutral-100 text-neutral-950 rounded-lg text-xs font-medium transition-colors shadow-xs"
              >
                {editingIdea ? 'Mettre à jour' : "Enregistrer l'idée"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal Decision Form */}
      {(isDecisionModalOpen || editingDecision) && (
        <Modal
          isOpen={isDecisionModalOpen || Boolean(editingDecision)}
          onClose={() => {
            setIsDecisionModalOpen(false);
            setEditingDecision(null);
          }}
          title={editingDecision ? 'Modifier la Décision' : 'Nouvelle Décision Actée'}
          subtitle="Journal de gouvernance stratégique du dirigeant"
        >
          <form onSubmit={handleDecisionSubmit} className="space-y-4">
            {decError && (
              <div className="p-3 bg-red-950/60 border border-red-900 text-red-300 text-xs rounded-lg">
                {decError}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Titre de la décision <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={decTitle}
                onChange={(e) => setDecTitle(e.target.value)}
                placeholder="Ex: Refus des automatisations prématurées non cadrées"
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-neutral-700"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Date de décision <span className="text-red-400">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={decDate}
                  onChange={(e) => setDecDate(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-neutral-700"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Statut de la décision
                </label>
                <select
                  value={decStatus}
                  onChange={(e) => setDecStatus(e.target.value as DecisionStatus)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-neutral-700"
                >
                  {DECISION_STATUSES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Contexte & Besoins analysés
              </label>
              <textarea
                rows={2}
                value={decContext}
                onChange={(e) => setDecContext(e.target.value)}
                placeholder="Pourquoi cette décision a-t-elle dû être prise ? Quels étaient les éléments observés ?"
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-neutral-700"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Décision actée <span className="text-red-400">*</span>
              </label>
              <textarea
                rows={2}
                required
                value={decDecision}
                onChange={(e) => setDecDecision(e.target.value)}
                placeholder="Choix définitif retenu, règle adoptée ou orientation stratégique..."
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-neutral-700"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Justification métier (« L’entreprise d’abord. La technologie ensuite. »)
              </label>
              <textarea
                rows={2}
                value={decJustification}
                onChange={(e) => setDecJustification(e.target.value)}
                placeholder="En quoi ce choix préserve-t-il la priorité des intérêts business de l'entreprise ?"
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-neutral-700"
              />
            </div>

            <div className="pt-4 flex items-center justify-end gap-3 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => {
                  setIsDecisionModalOpen(false);
                  setEditingDecision(null);
                }}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-xs font-medium transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-white hover:bg-neutral-100 text-neutral-950 rounded-lg text-xs font-medium transition-colors shadow-xs"
              >
                {editingDecision ? 'Mettre à jour' : 'Acter la décision'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
