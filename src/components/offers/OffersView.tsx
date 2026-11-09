import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import {
  type Offer,
  type OfferStatus,
  OFFER_STATUSES,
} from '../../types/nexus';
import { Modal } from '../ui/Modal';
import { EmptyState } from '../ui/EmptyState';
import { LoadingSkeleton } from '../ui/LoadingSkeleton';
import {
  Search,
  Plus,
  Briefcase,
  Archive,
  ArchiveRestore,
  Trash2,
  CheckCircle,
  Clock,
  Layers,
  FileText,
  PhoneCall,
  Lock,
} from 'lucide-react';

export const OffersView: React.FC = () => {
  const {
    offers,
    branches,
    loading,
    createOffer,
    updateOffer,
    toggleArchiveOffer,
    deleteOffer,
    exportToCSV,
    exportToJSON,
  } = useData();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [branchFilter, setBranchFilter] = useState<string>('all');
  const [archiveFilter, setArchiveFilter] = useState<'active' | 'archived' | 'all'>('active');

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [isPhoningModalOpen, setIsPhoningModalOpen] = useState(false);

  // Form State
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formTargetAudience, setFormTargetAudience] = useState('');
  const [formBusinessValue, setFormBusinessValue] = useState('');
  const [formDeliverables, setFormDeliverables] = useState('');
  const [formStatus, setFormStatus] = useState<OfferStatus>('Cadrage');
  const [formBranchId, setFormBranchId] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const openCreateModal = () => {
    setFormName('');
    setFormCode('');
    setFormTargetAudience('');
    setFormBusinessValue('');
    setFormDeliverables('');
    setFormStatus('Cadrage');
    setFormBranchId('');
    setFormError(null);
    setIsCreateModalOpen(true);
  };

  const openEditModal = (o: Offer) => {
    setEditingOffer(o);
    setFormName(o.name);
    setFormCode(o.code || '');
    setFormTargetAudience(o.targetAudience || '');
    setFormBusinessValue(o.businessValue || '');
    setFormDeliverables(o.deliverables || '');
    setFormStatus(o.status);
    setFormBranchId(o.branchId || '');
    setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!formName.trim()) {
      setFormError("Le nom de l'offre est obligatoire.");
      return;
    }

    try {
      if (editingOffer) {
        await updateOffer(editingOffer.id, {
          name: formName.trim(),
          code: formCode.trim(),
          targetAudience: formTargetAudience.trim(),
          businessValue: formBusinessValue.trim(),
          deliverables: formDeliverables.trim(),
          status: formStatus,
          branchId: formBranchId || '',
        });
        setEditingOffer(null);
      } else {
        await createOffer({
          name: formName.trim(),
          code: formCode.trim(),
          targetAudience: formTargetAudience.trim(),
          businessValue: formBusinessValue.trim(),
          deliverables: formDeliverables.trim(),
          status: formStatus,
          branchId: formBranchId || '',
        });
        setIsCreateModalOpen(false);
      }
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Erreur lors de l’enregistrement');
    }
  };

  const filteredOffers = useMemo(() => {
    return offers.filter((o) => {
      if (archiveFilter === 'active' && o.isArchived) return false;
      if (archiveFilter === 'archived' && !o.isArchived) return false;
      if (statusFilter !== 'all' && o.status !== statusFilter) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchName = o.name.toLowerCase().includes(q);
        const matchCode = (o.code || '').toLowerCase().includes(q);
        const matchTarget = (o.targetAudience || '').toLowerCase().includes(q);
        const matchValue = (o.businessValue || '').toLowerCase().includes(q);
        return matchName || matchCode || matchTarget || matchValue;
      }
      return true;
    });
  }, [offers, archiveFilter, statusFilter, searchTerm]);

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
            placeholder="Rechercher une offre, code, cible..."
            className="w-full pl-9 pr-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-neutral-700"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-300 focus:outline-none"
          >
            <option value="all">Tous les statuts d'offre</option>
            {OFFER_STATUSES.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
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
              Actives
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
              Archivées
            </button>
          </div>

          <div className="flex items-center gap-1 border-l border-neutral-800 pl-2">
            <button
              type="button"
              onClick={() => exportToCSV('offers')}
              title="Exporter offres en CSV"
              className="px-2.5 py-2 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 rounded-lg text-xs text-neutral-300 transition-colors"
            >
              CSV
            </button>
            <button
              type="button"
              onClick={() => exportToJSON('offers')}
              title="Exporter offres en JSON"
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
            <span>Nouvelle Offre</span>
          </button>
        </div>
      </div>

      {/* Spotlight: Produit Autonome en Cadrage - NEXUS Customer & Sales Pilot */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-red-950/80 border border-red-800/80 flex items-center justify-center text-red-400 shrink-0">
            <PhoneCall className="w-4 h-4" />
          </div>
          <div className="space-y-0.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-white">NEXUS Customer & Sales Pilot</span>
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-red-950 text-red-300 border border-red-800 font-semibold">
                Produit Autonome en Cadrage (Non lancé)
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-neutral-950 text-neutral-400 border border-neutral-800">
                Branche Digital
              </span>
            </div>
            <p className="text-[11px] text-neutral-400">
              Poste de travail d'appels commerciaux projeté (données clients isolées, étanchéité totale avec NEXUS OS).
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsPhoningModalOpen(true)}
          className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs rounded-lg font-medium transition-colors shrink-0 cursor-pointer"
        >
          Consulter la feuille de route
        </button>
      </div>

      {/* Grid of Offers */}
      {loading ? (
        <LoadingSkeleton rows={4} />
      ) : filteredOffers.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="Aucune offre répertoriée"
          description={
            searchTerm || statusFilter !== 'all'
              ? 'Aucune offre ne correspond aux critères de filtre.'
              : 'Définissez vos offres de digitalisation et d’ingénierie d’affaires pour cadrer vos interventions.'
          }
          actionLabel="Créer une offre"
          onAction={openCreateModal}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOffers.map((o) => (
            <div
              key={o.id}
              className="bg-neutral-900 border border-neutral-800 hover:border-neutral-700/80 rounded-xl p-5 flex flex-col justify-between transition-colors space-y-4"
            >
              <div>
                {/* Header: Code & Status */}
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-mono text-neutral-400 bg-neutral-950 px-2 py-0.5 rounded border border-neutral-800">
                    {o.code || 'REF-NEXUS'}
                  </span>
                  <span className="font-medium text-[11px] text-neutral-300 px-2 py-0.5 rounded bg-neutral-800 border border-neutral-700/60">
                    {o.status}
                  </span>
                </div>

                <h3 className="text-sm font-semibold tracking-tight text-white">{o.name}</h3>

                {o.targetAudience && (
                  <p className="text-xs text-neutral-400 mt-1">
                    Cible : <span className="text-neutral-300">{o.targetAudience}</span>
                  </p>
                )}

                <div className="mt-3 pt-3 border-t border-neutral-800/80 space-y-2 text-xs">
                  <div>
                    <span className="text-neutral-500 font-medium text-[11px] block">Valeur & Bénéfices métier :</span>
                    <p className="text-neutral-300 text-xs mt-0.5 leading-relaxed line-clamp-3">
                      {o.businessValue || 'Non renseigné'}
                    </p>
                  </div>

                  {o.deliverables && (
                    <div className="pt-2">
                      <span className="text-neutral-500 font-medium text-[11px] block">Livrables clés :</span>
                      <p className="text-neutral-400 text-xs mt-0.5 leading-relaxed line-clamp-2">
                        {o.deliverables}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-3 border-t border-neutral-800/80 flex items-center justify-between text-xs">
                <span className="text-[11px] text-neutral-500 font-mono">
                  {o.isArchived ? 'Archivée' : 'Active'}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => openEditModal(o)}
                    className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded text-xs transition-colors"
                  >
                    Modifier
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleArchiveOffer(o.id, o.isArchived)}
                    title={o.isArchived ? 'Désarchiver' : 'Archiver'}
                    className="p-1.5 text-neutral-400 hover:text-white rounded transition-colors"
                  >
                    {o.isArchived ? (
                      <ArchiveRestore className="w-3.5 h-3.5" />
                    ) : (
                      <Archive className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Supprimer définitivement l'offre ${o.name} ?`)) {
                        deleteOffer(o.id);
                      }
                    }}
                    title="Supprimer"
                    className="p-1.5 text-neutral-500 hover:text-red-400 rounded transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Create / Edit Offer */}
      {(isCreateModalOpen || editingOffer) && (
        <Modal
          isOpen={isCreateModalOpen || Boolean(editingOffer)}
          onClose={() => {
            setIsCreateModalOpen(false);
            setEditingOffer(null);
          }}
          title={editingOffer ? "Modifier l'Offre" : 'Nouvelle Offre'}
          subtitle="Catalogue des solutions et modules de digitalisation"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            {formError && (
              <div className="p-3 bg-red-950/60 border border-red-900 text-red-300 text-xs rounded-lg">
                {formError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Nom de l'offre <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ex: Diagnostic Besoins & Architecture Business"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-neutral-700"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Code / Référence
                </label>
                <input
                  type="text"
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value)}
                  placeholder="OFF-01"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-neutral-700"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Cible d'entreprises
                </label>
                <input
                  type="text"
                  value={formTargetAudience}
                  onChange={(e) => setFormTargetAudience(e.target.value)}
                  placeholder="Ex: PME industrielles, sociétés de services..."
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-neutral-700"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Statut de l'offre <span className="text-red-400">*</span>
                </label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as OfferStatus)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-neutral-700"
                >
                  {OFFER_STATUSES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

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
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Valeur & Bénéfices métier (Pourquoi le client achète)
              </label>
              <textarea
                rows={3}
                value={formBusinessValue}
                onChange={(e) => setFormBusinessValue(e.target.value)}
                placeholder="Ex: Suppression des ressaisies manuelles, réduction des temps de cycle, clarté sur les processus..."
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-neutral-700"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Livrables concrets
              </label>
              <textarea
                rows={2}
                value={formDeliverables}
                onChange={(e) => setFormDeliverables(e.target.value)}
                placeholder="Ex: Cartographie des flux, spécifications d'orchestration, cockpit opérationnel..."
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-neutral-700"
              />
            </div>

            <div className="pt-4 flex items-center justify-end gap-3 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setEditingOffer(null);
                }}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-xs font-medium transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-white hover:bg-neutral-100 text-neutral-950 rounded-lg text-xs font-medium transition-colors shadow-xs"
              >
                {editingOffer ? 'Mettre à jour' : "Créer l'offre"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal: Fiche Produit Phoning - NEXUS Customer & Sales Pilot */}
      {isPhoningModalOpen && (
        <Modal
          isOpen={isPhoningModalOpen}
          onClose={() => setIsPhoningModalOpen(false)}
          title="Fiche Produit : NEXUS Customer & Sales Pilot"
          subtitle="Plateforme commerciale autonome projetée par client — En cadrage / Non lancée"
          maxWidth="max-w-2xl"
        >
          <div className="space-y-5 text-xs text-neutral-300">
            <div className="p-3.5 bg-red-950/40 border border-red-800 rounded-xl space-y-1.5 text-red-200">
              <div className="flex items-center gap-2 font-semibold">
                <Lock className="w-4 h-4 text-red-400 shrink-0" />
                <span>Cloisonnement & Étanchéité Stricte</span>
              </div>
              <p className="text-[11px] text-red-300 leading-relaxed">
                Ce produit est destiné à être déployé de manière isolée pour chaque client.
                Ses contacts, ses campagnes et ses données d’appels <strong>ne remontent jamais</strong> dans
                NEXUS OS.
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-white text-xs">Résumé de la Solution</h4>
              <p className="text-neutral-300 leading-relaxed">
                Poste de travail des équipes au téléphone qui réunit avant, pendant et après appel : contexte contact,
                campagne, script vivant, objections (comprendre, répondre, rebondir), résultats, rappels, historique
                et indicateurs de campagne/manager.
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-white text-xs">Fonctionnalités V1 (Prévues pour la suite)</h4>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-neutral-300 font-mono">
                <li className="p-2 bg-neutral-950 border border-neutral-800 rounded">1. Import CSV contrôlé</li>
                <li className="p-2 bg-neutral-950 border border-neutral-800 rounded">2. Fiches contacts & campagnes</li>
                <li className="p-2 bg-neutral-950 border border-neutral-800 rounded">3. Champs personnalisés métiers</li>
                <li className="p-2 bg-neutral-950 border border-neutral-800 rounded">4. Scripts vivants interactifs</li>
                <li className="p-2 bg-neutral-950 border border-neutral-800 rounded">5. Bibliothèque d’objections</li>
                <li className="p-2 bg-neutral-950 border border-neutral-800 rounded">6. Saisie manuelle des appels</li>
                <li className="p-2 bg-neutral-950 border border-neutral-800 rounded">7. Résultats & rappels</li>
                <li className="p-2 bg-neutral-950 border border-neutral-800 rounded">8. Reporting manager</li>
              </ul>
            </div>

            <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg space-y-1 text-[11px]">
              <span className="font-mono text-cyan-400 font-semibold block">Prochaine Étape Concrète :</span>
              <p className="text-neutral-300">Spécification détaillée d’un pilote sans téléphonie intégrée.</p>
            </div>

            <div className="pt-3 flex justify-end border-t border-neutral-800">
              <button
                type="button"
                onClick={() => setIsPhoningModalOpen(false)}
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
