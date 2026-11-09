import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import {
  type Prospect,
  type ProspectStatus,
  type Interaction,
  type ActiveSection,
  PROSPECT_STATUSES,
  INTERACTION_TYPES,
  type InteractionType,
} from '../../types/nexus';
import { Modal } from '../ui/Modal';
import { EmptyState } from '../ui/EmptyState';
import { LoadingSkeleton } from '../ui/LoadingSkeleton';
import {
  Search,
  Plus,
  Download,
  Filter,
  ArrowUpDown,
  Archive,
  ArchiveRestore,
  Trash2,
  Calendar,
  Phone,
  PhoneCall,
  Zap,
  Sparkles,
  Mail,
  Building2,
  Clock,
  MessageSquare,
  ChevronRight,
  ExternalLink,
  MapPin,
  Star,
  ShieldCheck,
} from 'lucide-react';
import { ProspectEnrichmentModal } from './ProspectEnrichmentModal';

interface ProspectsViewProps {
  onNavigate?: (section: ActiveSection) => void;
}

export const ProspectsView: React.FC<ProspectsViewProps> = ({ onNavigate }) => {
  const {
    prospects,
    branches,
    loading,
    createProspect,
    updateProspect,
    toggleArchiveProspect,
    deleteProspect,
    addInteraction,
    getInteractions,
    deleteInteraction,
    exportToCSV,
    exportToJSON,
  } = useData();

  // Search, filter & sort state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [branchFilter, setBranchFilter] = useState<string>('all');
  const [archiveFilter, setArchiveFilter] = useState<'active' | 'archived' | 'all'>('active');
  const [sortBy, setSortBy] = useState<'company' | 'status' | 'nextContactDate' | 'createdAt'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingProspect, setEditingProspect] = useState<Prospect | null>(null);
  const [detailProspect, setDetailProspect] = useState<Prospect | null>(null);
  const [enrichingProspect, setEnrichingProspect] = useState<Prospect | null>(null);

  // Form fields
  const [formCompany, setFormCompany] = useState('');
  const [formContactName, setFormContactName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formSector, setFormSector] = useState('');
  const [formNeedsSummary, setFormNeedsSummary] = useState('');
  const [formStatus, setFormStatus] = useState<ProspectStatus>('À qualifier');
  const [formBranchId, setFormBranchId] = useState('');
  const [formNextContactDate, setFormNextContactDate] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Detail modal tabs: 'info' | 'interactions'
  const [detailTab, setDetailTab] = useState<'info' | 'interactions'>('info');
  const [interactionsList, setInteractionsList] = useState<Interaction[]>([]);
  const [loadingInteractions, setLoadingInteractions] = useState(false);

  // New interaction form state
  const [newInteractionDate, setNewInteractionDate] = useState(new Date().toISOString().split('T')[0]);
  const [newInteractionType, setNewInteractionType] = useState<InteractionType>('Appel');
  const [newInteractionSummary, setNewInteractionSummary] = useState('');
  const [newInteractionNextStep, setNewInteractionNextStep] = useState('');

  // Load interactions when detail prospect opens
  const openDetail = async (p: Prospect) => {
    setDetailProspect(p);
    setDetailTab('info');
    setLoadingInteractions(true);
    try {
      const items = await getInteractions(p.id);
      setInteractionsList(items);
    } catch {
      setInteractionsList([]);
    } finally {
      setLoadingInteractions(false);
    }
  };

  const reloadInteractions = async (prospectId: string) => {
    setLoadingInteractions(true);
    try {
      const items = await getInteractions(prospectId);
      setInteractionsList(items);
    } finally {
      setLoadingInteractions(false);
    }
  };

  const handleAddInteraction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!detailProspect) return;
    if (!newInteractionSummary.trim()) return;

    try {
      await addInteraction(detailProspect.id, {
        date: newInteractionDate,
        type: newInteractionType,
        summary: newInteractionSummary.trim(),
        nextStep: newInteractionNextStep.trim(),
      });
      setNewInteractionSummary('');
      setNewInteractionNextStep('');
      await reloadInteractions(detailProspect.id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteInteraction = async (interactionId: string) => {
    if (!detailProspect) return;
    await deleteInteraction(detailProspect.id, interactionId);
    await reloadInteractions(detailProspect.id);
  };

  const openCreateModal = () => {
    setFormCompany('');
    setFormContactName('');
    setFormEmail('');
    setFormPhone('');
    setFormSector('');
    setFormNeedsSummary('');
    setFormStatus('À qualifier');
    setFormBranchId('');
    setFormNextContactDate('');
    setFormNotes('');
    setFormError(null);
    setIsCreateModalOpen(true);
  };

  const openEditModal = (p: Prospect) => {
    setEditingProspect(p);
    setFormCompany(p.company);
    setFormContactName(p.contactName);
    setFormEmail(p.email || '');
    setFormPhone(p.phone || '');
    setFormSector(p.sector || '');
    setFormNeedsSummary(p.needsSummary || '');
    setFormStatus(p.status);
    setFormBranchId(p.branchId || '');
    setFormNextContactDate(p.nextContactDate || '');
    setFormNotes(p.notes || '');
    setFormError(null);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!formCompany.trim()) {
      setFormError("Le nom de l'entreprise est obligatoire.");
      return;
    }
    if (!formContactName.trim()) {
      setFormError('Le nom du contact est obligatoire.');
      return;
    }

    try {
      const prospectPayload = {
        company: formCompany.trim(),
        contactName: formContactName.trim(),
        email: formEmail.trim(),
        phone: formPhone.trim(),
        sector: formSector.trim(),
        needsSummary: formNeedsSummary.trim(),
        status: formStatus,
        branchId: formBranchId || '',
        nextContactDate: formNextContactDate || '',
        notes: formNotes.trim(),
      };

      if (editingProspect) {
        await updateProspect(editingProspect.id, prospectPayload);
        setEditingProspect(null);
      } else {
        await createProspect(prospectPayload);
        setIsCreateModalOpen(false);
      }
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Erreur lors de l’enregistrement');
    }
  };

  // Filter and sort computation
  const filteredProspects = useMemo(() => {
    return prospects
      .filter((p) => {
        // Archive filter
        if (archiveFilter === 'active' && p.isArchived) return false;
        if (archiveFilter === 'archived' && !p.isArchived) return false;

        // Status filter
        if (statusFilter !== 'all' && p.status !== statusFilter) return false;

        // Search term
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          const matchCompany = p.company.toLowerCase().includes(q);
          const matchContact = p.contactName.toLowerCase().includes(q);
          const matchSector = (p.sector || '').toLowerCase().includes(q);
          const matchNeeds = (p.needsSummary || '').toLowerCase().includes(q);
          return matchCompany || matchContact || matchSector || matchNeeds;
        }

        return true;
      })
      .sort((a, b) => {
        let valA = a[sortBy] || '';
        let valB = b[sortBy] || '';
        const order = sortOrder === 'asc' ? 1 : -1;
        return valA.localeCompare(valB) * order;
      });
  }, [prospects, archiveFilter, statusFilter, searchTerm, sortBy, sortOrder]);

  const toggleSort = (field: 'company' | 'status' | 'nextContactDate' | 'createdAt') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Controls & Filter Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-neutral-900 border border-neutral-800 p-4 rounded-xl">
        {/* Left: Search input */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher entreprise, contact, besoin..."
            className="w-full pl-9 pr-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-neutral-700"
          />
        </div>

        {/* Right: Filters & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status selector */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-300 focus:outline-none"
          >
            <option value="all">Tous les statuts</option>
            {PROSPECT_STATUSES.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>

          {/* Archive Toggle */}
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

          {/* Export buttons */}
          <div className="flex items-center gap-1 border-l border-neutral-800 pl-2">
            <button
              type="button"
              onClick={() => exportToCSV('prospects')}
              title="Exporter prospects en CSV"
              className="px-2.5 py-2 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 rounded-lg text-xs text-neutral-300 transition-colors"
            >
              CSV
            </button>
            <button
              type="button"
              onClick={() => exportToJSON('prospects')}
              title="Exporter prospects en JSON"
              className="px-2.5 py-2 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 rounded-lg text-xs text-neutral-300 transition-colors"
            >
              JSON
            </button>
          </div>

          {/* Navigate to Acquisition */}
          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate('acquisition')}
              title="Acquérir et scraper des prospects réels via le web"
              className="flex items-center gap-1.5 px-3 py-2 bg-cyan-950 hover:bg-cyan-900 border border-cyan-800 rounded-lg text-xs text-cyan-200 font-semibold transition-colors ml-1 cursor-pointer shadow-xs"
            >
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Scraper des prospects</span>
            </button>
          )}

          {/* Navigate to Phoning Station */}
          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate('phoning')}
              title="Ouvrir le poste de prospection téléphonique"
              className="flex items-center gap-1.5 px-3 py-2 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 rounded-lg text-xs text-neutral-300 transition-colors ml-1 cursor-pointer"
            >
              <PhoneCall className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Poste Phoning</span>
            </button>
          )}

          {/* Primary Create Button */}
          <button
            type="button"
            onClick={openCreateModal}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-neutral-100 text-neutral-950 font-medium text-xs rounded-lg transition-colors shadow-xs ml-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nouveau Prospect</span>
          </button>
        </div>
      </div>

      {/* Main Content / Table */}
      {loading ? (
        <LoadingSkeleton rows={6} />
      ) : filteredProspects.length === 0 ? (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-8 text-center space-y-4">
          <Building2 className="w-10 h-10 mx-auto text-neutral-600" />
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-base font-semibold text-white">
              {searchTerm || statusFilter !== 'all' ? 'Aucun prospect correspondant aux filtres' : 'Aucun prospect dans votre base'}
            </h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              {searchTerm || statusFilter !== 'all'
                ? 'Modifiez votre recherche ou réinitialisez les filtres pour afficher vos contacts.'
                : 'Alimentez immédiatement votre cockpit en scrapant de vraies entreprises et leurs dirigeants.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate('acquisition')}
                className="px-5 py-2.5 bg-white hover:bg-neutral-100 text-neutral-950 font-bold rounded-lg text-xs transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
                <span>Scraper des prospects réels</span>
              </button>
            )}
            <button
              type="button"
              onClick={openCreateModal}
              className="px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-medium rounded-lg text-xs transition-colors cursor-pointer"
            >
              Créer manuellement
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-neutral-800 bg-neutral-950/60 text-neutral-400 font-medium select-none">
                  <th
                    className="py-3 px-4 cursor-pointer hover:text-white"
                    onClick={() => toggleSort('company')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Entreprise & Contact</span>
                      <ArrowUpDown className="w-3 h-3 text-neutral-500" />
                    </div>
                  </th>
                  <th
                    className="py-3 px-4 cursor-pointer hover:text-white"
                    onClick={() => toggleSort('status')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Statut B2B</span>
                      <ArrowUpDown className="w-3 h-3 text-neutral-500" />
                    </div>
                  </th>
                  <th className="py-3 px-4">Secteur / Besoins analysés</th>
                  <th
                    className="py-3 px-4 cursor-pointer hover:text-white"
                    onClick={() => toggleSort('nextContactDate')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Prochain contact</span>
                      <ArrowUpDown className="w-3 h-3 text-neutral-500" />
                    </div>
                  </th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/80">
                {filteredProspects.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-neutral-800/40 transition-colors group cursor-pointer"
                    onClick={() => openDetail(p)}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">{p.company}</span>
                        {(p.verified || p.enrichedData) && (
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-0.5">
                            <ShieldCheck className="w-2.5 h-2.5 text-emerald-400" />
                            Maps Vérifié
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-neutral-400 flex items-center gap-2 mt-0.5">
                        <span className="text-neutral-300">{p.contactName}</span>
                        {p.city && <span>· <strong className="text-neutral-300">{p.city}</strong></span>}
                        {p.phone && <span className="font-mono text-cyan-300">· {p.phone}</span>}
                      </div>
                      {p.enrichedData?.fullAddress && (
                        <div className="text-[10px] text-neutral-500 font-mono mt-0.5 flex items-center gap-1">
                          <MapPin className="w-2.5 h-2.5 text-red-400" />
                          <span className="truncate max-w-xs">{p.enrichedData.fullAddress}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="inline-block px-2 py-0.5 text-[11px] font-medium rounded bg-neutral-800 text-neutral-200 border border-neutral-700/60">
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <div className="text-neutral-300 font-medium truncate">{p.sector || '—'}</div>
                      <div className="text-[11px] text-neutral-500 truncate mt-0.5">
                        {p.needsSummary || 'Aucun besoin consigné'}
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px] text-neutral-300">
                      {p.nextContactDate ? (
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3 h-3 text-neutral-500" />
                          <span>{p.nextContactDate}</span>
                        </span>
                      ) : (
                        <span className="text-neutral-600">—</span>
                      )}
                    </td>
                    <td
                      className="py-3 px-4 text-right space-x-1 whitespace-nowrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => setEnrichingProspect(p)}
                        className="px-2 py-1 text-[11px] text-cyan-300 hover:text-white bg-cyan-950/60 hover:bg-cyan-900 border border-cyan-800/80 rounded transition-colors inline-flex items-center gap-1 cursor-pointer"
                        title="Enrichir les données Google Maps et web"
                      >
                        <Sparkles className="w-3 h-3 text-cyan-400" />
                        <span>Enrichir</span>
                      </button>

                      {onNavigate && (
                        <button
                          type="button"
                          onClick={() => onNavigate('phoning')}
                          className="px-2 py-1 text-[11px] text-neutral-200 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded transition-colors inline-flex items-center gap-1 cursor-pointer"
                          title="Lancer au poste d'appel"
                        >
                          <PhoneCall className="w-3 h-3 text-cyan-400" />
                          <span>Appeler</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => openDetail(p)}
                        className="px-2 py-1 text-[11px] text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded transition-colors"
                      >
                        Consulter
                      </button>
                      <button
                        type="button"
                        onClick={() => openEditModal(p)}
                        className="px-2 py-1 text-[11px] text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded transition-colors"
                      >
                        Modifier
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleArchiveProspect(p.id, p.isArchived)}
                        title={p.isArchived ? 'Désarchiver' : 'Archiver'}
                        className="p-1 text-neutral-400 hover:text-neutral-200 rounded transition-colors inline-flex items-center justify-center align-middle"
                      >
                        {p.isArchived ? (
                          <ArchiveRestore className="w-3.5 h-3.5" />
                        ) : (
                          <Archive className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Supprimer définitivement le prospect ${p.company} ?`)) {
                            deleteProspect(p.id);
                          }
                        }}
                        title="Supprimer"
                        className="p-1 text-neutral-500 hover:text-red-400 rounded transition-colors inline-flex items-center justify-center align-middle"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Detail & Interactions */}
      {detailProspect && (
        <Modal
          isOpen={Boolean(detailProspect)}
          onClose={() => setDetailProspect(null)}
          title={detailProspect.company}
          subtitle={`Fiche prospect · ${detailProspect.contactName}`}
          maxWidth="max-w-3xl"
        >
          {/* Modal subtabs */}
          <div className="flex items-center gap-2 border-b border-neutral-800 pb-3 text-xs">
            <button
              type="button"
              onClick={() => setDetailTab('info')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                detailTab === 'info'
                  ? 'bg-neutral-800 text-white font-medium'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Fiche & Besoins
            </button>
            <button
              type="button"
              onClick={() => setDetailTab('interactions')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                detailTab === 'interactions'
                  ? 'bg-neutral-800 text-white font-medium'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <span>Interactions datées</span>
              <span className="px-1.5 py-0.2 rounded bg-neutral-900 font-mono text-[10px]">
                {interactionsList.length}
              </span>
            </button>
          </div>

          {detailTab === 'info' ? (
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg">
                  <div className="text-[11px] text-neutral-500">Contact</div>
                  <div className="font-medium text-neutral-200 mt-0.5">{detailProspect.contactName}</div>
                  {detailProspect.email && (
                    <div className="text-xs text-neutral-400 flex items-center gap-1.5 mt-1">
                      <Mail className="w-3 h-3 text-neutral-500" />
                      <a href={`mailto:${detailProspect.email}`} className="hover:underline">
                        {detailProspect.email}
                      </a>
                    </div>
                  )}
                  {detailProspect.phone && (
                    <div className="text-xs text-neutral-400 flex items-center gap-1.5 mt-0.5">
                      <Phone className="w-3 h-3 text-neutral-500" />
                      <span>{detailProspect.phone}</span>
                    </div>
                  )}
                </div>

                <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg">
                  <div className="text-[11px] text-neutral-500">Statut commercial</div>
                  <div className="font-semibold text-neutral-200 mt-0.5">{detailProspect.status}</div>
                  <div className="text-xs text-neutral-400 mt-1">
                    Secteur : <span className="text-neutral-300">{detailProspect.sector || 'Non renseigné'}</span>
                  </div>
                  {detailProspect.nextContactDate && (
                    <div className="text-xs text-neutral-400 mt-0.5">
                      Prochain échange : <span className="text-amber-400 font-mono">{detailProspect.nextContactDate}</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold text-neutral-300 mb-1">Besoins analysés & Enjeux</div>
                <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-300 leading-relaxed whitespace-pre-wrap">
                  {detailProspect.needsSummary || 'Aucune analyse des besoins formalisée.'}
                </div>
              </div>

              {detailProspect.notes && (
                <div>
                  <div className="text-xs font-semibold text-neutral-300 mb-1">Notes dirigeant</div>
                  <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-400 leading-relaxed whitespace-pre-wrap">
                    {detailProspect.notes}
                  </div>
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                {onNavigate && detailProspect.phone && (
                  <button
                    type="button"
                    onClick={() => {
                      setDetailProspect(null);
                      onNavigate('phoning');
                    }}
                    className="px-4 py-2 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-800 text-cyan-200 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <PhoneCall className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Poste de Prospection</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    const p = detailProspect;
                    setDetailProspect(null);
                    openEditModal(p);
                  }}
                  className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
                >
                  Modifier cette fiche
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6 pt-2">
              {/* Form to log a new interaction */}
              <form onSubmit={handleAddInteraction} className="p-4 bg-neutral-950 border border-neutral-800 rounded-lg space-y-3">
                <div className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5 text-white" />
                  <span>Consigner une nouvelle interaction datée</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-neutral-400 mb-1">Date de l'échange</label>
                    <input
                      type="date"
                      required
                      value={newInteractionDate}
                      onChange={(e) => setNewInteractionDate(e.target.value)}
                      className="w-full px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded text-xs text-neutral-200 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-neutral-400 mb-1">Type d'interaction</label>
                    <select
                      value={newInteractionType}
                      onChange={(e) => setNewInteractionType(e.target.value as InteractionType)}
                      className="w-full px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded text-xs text-neutral-200 focus:outline-none"
                    >
                      {INTERACTION_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-neutral-400 mb-1">Résumé de l'échange</label>
                  <textarea
                    rows={2}
                    required
                    value={newInteractionSummary}
                    onChange={(e) => setNewInteractionSummary(e.target.value)}
                    placeholder="Points abordés, validation des besoins, retours d'écoute..."
                    className="w-full px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded text-xs text-neutral-200 focus:outline-none placeholder-neutral-600"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-neutral-400 mb-1">Prochain pas convenu (optionnel)</label>
                  <input
                    type="text"
                    value={newInteractionNextStep}
                    onChange={(e) => setNewInteractionNextStep(e.target.value)}
                    placeholder="Ex: Envoi de la proposition de cadrage sous 48h"
                    className="w-full px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded text-xs text-neutral-200 focus:outline-none placeholder-neutral-600"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-white hover:bg-neutral-100 text-neutral-950 rounded text-xs font-medium transition-colors"
                  >
                    Enregistrer l'interaction
                  </button>
                </div>
              </form>

              {/* Interactions timeline list */}
              <div className="space-y-3">
                <div className="text-xs font-semibold text-neutral-300">Historique chronologique</div>
                {loadingInteractions ? (
                  <LoadingSkeleton rows={3} />
                ) : interactionsList.length === 0 ? (
                  <p className="text-xs text-neutral-500 py-4 text-center">
                    Aucune interaction consignée pour le moment.
                  </p>
                ) : (
                  interactionsList.map((inter) => (
                    <div
                      key={inter.id}
                      className="p-3 bg-neutral-950/70 border border-neutral-800/80 rounded-lg space-y-1 relative group"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-neutral-200">{inter.type}</span>
                          <span>·</span>
                          <span className="font-mono text-neutral-400">{inter.date}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteInteraction(inter.id)}
                          className="opacity-0 group-hover:opacity-100 text-neutral-500 hover:text-red-400 p-1 transition-opacity"
                          title="Supprimer cette interaction"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                      <p className="text-xs text-neutral-300 leading-relaxed pt-1">{inter.summary}</p>
                      {inter.nextStep && (
                        <div className="mt-2 text-[11px] text-amber-300/90 flex items-baseline gap-1 bg-amber-950/20 border border-amber-900/30 p-2 rounded">
                          <span className="font-medium text-amber-400 shrink-0">Prochain pas :</span>
                          <span>{inter.nextStep}</span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </Modal>
      )}

      {/* Modal Create / Edit Prospect */}
      {(isCreateModalOpen || editingProspect) && (
        <Modal
          isOpen={isCreateModalOpen || Boolean(editingProspect)}
          onClose={() => {
            setIsCreateModalOpen(false);
            setEditingProspect(null);
          }}
          title={editingProspect ? 'Modifier le Prospect' : 'Nouveau Prospect'}
          subtitle="Formulaire de qualification et cadrage B2B"
        >
          <form onSubmit={handleSubmitForm} className="space-y-4">
            {formError && (
              <div className="p-3 bg-red-950/60 border border-red-900 text-red-300 text-xs rounded-lg">
                {formError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Entreprise <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formCompany}
                  onChange={(e) => setFormCompany(e.target.value)}
                  placeholder="Ex: Manufacture Jura"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-neutral-700"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Contact principal <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formContactName}
                  onChange={(e) => setFormContactName(e.target.value)}
                  placeholder="Ex: Thierry Bonnet"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-neutral-700"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">Email</label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="tbonnet@entreprise.fr"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-neutral-700"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">Téléphone</label>
                <input
                  type="tel"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="+33 6 00 00 00 00"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-neutral-700"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">Secteur d'activité</label>
                <input
                  type="text"
                  value={formSector}
                  onChange={(e) => setFormSector(e.target.value)}
                  placeholder="Ex: Industrie métallurgique, Logistique..."
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-neutral-700"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Statut B2B <span className="text-red-400">*</span>
                </label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as ProspectStatus)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-neutral-700"
                >
                  {PROSPECT_STATUSES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Besoins analysés & Enjeux métier
              </label>
              <textarea
                rows={3}
                value={formNeedsSummary}
                onChange={(e) => setFormNeedsSummary(e.target.value)}
                placeholder="Explication des blocages actuels, des processus à rationaliser et des objectifs attendus..."
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-neutral-700"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Branche NEXUS rattachée (optionnel)
                </label>
                <select
                  value={formBranchId}
                  onChange={(e) => setFormBranchId(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-neutral-700"
                >
                  <option value="">Aucune / Transversale</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Date de prochain contact
                </label>
                <input
                  type="date"
                  value={formNextContactDate}
                  onChange={(e) => setFormNextContactDate(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-neutral-700"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Notes additionnelles
              </label>
              <input
                type="text"
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                placeholder="Remarques confidentielles..."
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-neutral-700"
              />
            </div>

            <div className="pt-4 flex items-center justify-end gap-3 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setEditingProspect(null);
                }}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-xs font-medium transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-white hover:bg-neutral-100 text-neutral-950 rounded-lg text-xs font-medium transition-colors shadow-xs cursor-pointer"
              >
                {editingProspect ? 'Mettre à jour' : 'Enregistrer le prospect'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Google Maps & Web Enrichment Modal */}
      <ProspectEnrichmentModal
        isOpen={Boolean(enrichingProspect)}
        onClose={() => setEnrichingProspect(null)}
        prospect={enrichingProspect}
      />
    </div>
  );
};
