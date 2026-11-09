import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { Modal } from '../ui/Modal';
import {
  Layers,
  Search,
  Filter,
  Plus,
  Edit2,
  Clock,
  Euro,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Check,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import type {
  WebComponent,
  ComponentCategory,
  FrontSubFamily,
  BackSubFamily,
} from '../../types/configurator';
import { DEFAULT_WEB_COMPONENTS } from '../../lib/configuratorDefaults';

const FRONT_SUBFAMILIES: FrontSubFamily[] = [
  'Pages & Design responsive',
  'Composants UI',
  'Navigation',
  'Formulaires',
  'Recherche',
  'Catalogue, Panier & Checkout',
  'Espace client',
  'Administration Front',
  'SEO',
  'Accessibilité',
  'Analytique & Consentement',
];

const BACK_SUBFAMILIES: BackSubFamily[] = [
  'CMS & Données',
  'API',
  'Authentification',
  'Rôles & Permissions',
  'Stockage Média',
  'Recherche Back',
  'Gestion des Commandes',
  'Paiement Prestataire',
  'Notifications',
  'Intégrations',
  'Journalisation & Audit',
  'Sauvegardes',
  'Environnements & Déploiement',
];

export const ComponentsCatalogManager: React.FC = () => {
  const { componentsCatalog, updateComponentsCatalog } = useData();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'All' | ComponentCategory>('All');
  const [selectedSubFamily, setSelectedSubFamily] = useState<string>('All');

  // Modal editing / creating
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingComponent, setEditingComponent] = useState<WebComponent | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Form State
  const emptyComponent: WebComponent = {
    id: '',
    name: '',
    category: 'Front-end',
    subFamily: 'Pages & Design responsive',
    internalExplanation: '',
    clientExplanation: '',
    inclusionCriteria: '',
    dependencies: [],
    incompatibilities: [],
    effortMinHours: 5,
    effortMaxHours: 10,
    oneTimeCostDefault: 0,
    recurringMonthlyCostDefault: 0,
    risks: '',
    securityRequirements: '',
    acceptanceTests: '',
    technicalOptions: [],
    status: 'Actif',
  };

  const [formData, setFormData] = useState<WebComponent>(emptyComponent);
  const [depsInput, setDepsInput] = useState('');
  const [incompInput, setIncompInput] = useState('');
  const [optionsInput, setOptionsInput] = useState('');

  const filteredComponents = useMemo(() => {
    return componentsCatalog.filter((c) => {
      if (selectedCategory !== 'All' && c.category !== selectedCategory) return false;
      if (selectedSubFamily !== 'All' && c.subFamily !== selectedSubFamily) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        return (
          c.name.toLowerCase().includes(q) ||
          c.id.toLowerCase().includes(q) ||
          c.subFamily.toLowerCase().includes(q) ||
          c.internalExplanation.toLowerCase().includes(q) ||
          c.clientExplanation.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [componentsCatalog, selectedCategory, selectedSubFamily, searchTerm]);

  const handleOpenCreate = () => {
    setEditingComponent(null);
    setFormData({
      ...emptyComponent,
      id: `comp_${Date.now().toString(36)}`,
    });
    setDepsInput('');
    setIncompInput('');
    setOptionsInput('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (comp: WebComponent) => {
    setEditingComponent(comp);
    setFormData({ ...comp });
    setDepsInput(comp.dependencies.join(', '));
    setIncompInput(comp.incompatibilities.join(', '));
    setOptionsInput(comp.technicalOptions.join(', '));
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.id.trim()) return;

    const parsedDeps = depsInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const parsedIncomp = incompInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const parsedOpts = optionsInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const updatedComp: WebComponent = {
      ...formData,
      dependencies: parsedDeps,
      incompatibilities: parsedIncomp,
      technicalOptions: parsedOpts,
    };

    let updatedList: WebComponent[];
    if (editingComponent) {
      updatedList = componentsCatalog.map((c) => (c.id === editingComponent.id ? updatedComp : c));
    } else {
      updatedList = [updatedComp, ...componentsCatalog];
    }

    try {
      await updateComponentsCatalog(updatedList);
      setFeedbackMsg(
        editingComponent
          ? `Composant « ${updatedComp.name} » mis à jour.`
          : `Composant « ${updatedComp.name} » ajouté au catalogue.`
      );
      setTimeout(() => setFeedbackMsg(null), 2500);
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleResetToDefaults = async () => {
    if (
      window.confirm(
        'Réinitialiser le catalogue aux 24 composants officiels pré-définis de NEXUS Digital ? Toutes vos modifications locales seront écrasées.'
      )
    ) {
      await updateComponentsCatalog(DEFAULT_WEB_COMPONENTS);
      setFeedbackMsg('Catalogue réinitialisé aux composants standards NEXUS Digital.');
      setTimeout(() => setFeedbackMsg(null), 2500);
    }
  };

  const frontCount = componentsCatalog.filter((c) => c.category === 'Front-end').length;
  const backCount = componentsCatalog.filter((c) => c.category === 'Back-end').length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] text-neutral-400 font-mono uppercase tracking-wider block">
            NEXUS Digital · Référentiel Technique & Architecture
          </span>
          <h3 className="text-base font-semibold text-white tracking-tight mt-0.5">
            Catalogue Technique Administrable ({componentsCatalog.length} composants)
          </h3>
          <p className="text-xs text-neutral-400 mt-1 max-w-2xl leading-relaxed">
            Référentiel des briques logicielles front-end et back-end. Aucun service tiers (IA, paiement, CRM, etc.)
            n’est inclus par défaut : chaque composant est conditionné par un critère logique explicable.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleResetToDefaults}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 rounded-lg text-xs text-neutral-400 hover:text-white transition-colors cursor-pointer"
            title="Restaurer le catalogue par défaut"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Réinitialiser</span>
          </button>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-neutral-100 text-neutral-950 font-medium text-xs rounded-lg transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nouveau composant</span>
          </button>
        </div>
      </div>

      {feedbackMsg && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs rounded-lg flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-neutral-900 border border-neutral-800 p-3.5 rounded-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher par nom, ID, sous-famille ou mot-clé..."
            className="w-full pl-8 pr-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Category Tabs */}
          <div className="flex items-center bg-neutral-950 border border-neutral-800 rounded-lg p-0.5 text-xs">
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('All');
                setSelectedSubFamily('All');
              }}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                selectedCategory === 'All' ? 'bg-neutral-800 text-white font-medium' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Tous ({componentsCatalog.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('Front-end');
                setSelectedSubFamily('All');
              }}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                selectedCategory === 'Front-end'
                  ? 'bg-neutral-800 text-cyan-300 font-medium'
                  : 'text-neutral-400 hover:text-cyan-300'
              }`}
            >
              Front-end ({frontCount})
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('Back-end');
                setSelectedSubFamily('All');
              }}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                selectedCategory === 'Back-end'
                  ? 'bg-neutral-800 text-amber-300 font-medium'
                  : 'text-neutral-400 hover:text-amber-300'
              }`}
            >
              Back-end ({backCount})
            </button>
          </div>

          {/* SubFamily Filter */}
          <select
            value={selectedSubFamily}
            onChange={(e) => setSelectedSubFamily(e.target.value)}
            className="px-2.5 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-300 focus:outline-none"
          >
            <option value="All">Toutes les sous-familles</option>
            {selectedCategory !== 'Back-end' &&
              FRONT_SUBFAMILIES.map((sub) => (
                <option key={sub} value={sub}>
                  [Front] {sub}
                </option>
              ))}
            {selectedCategory !== 'Front-end' &&
              BACK_SUBFAMILIES.map((sub) => (
                <option key={sub} value={sub}>
                  [Back] {sub}
                </option>
              ))}
          </select>
        </div>
      </div>

      {/* Components Grid / List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredComponents.map((comp) => (
          <div
            key={comp.id}
            className="bg-neutral-900 border border-neutral-800 hover:border-neutral-700 rounded-xl p-4.5 space-y-3 transition-colors flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded border ${
                        comp.category === 'Front-end'
                          ? 'bg-cyan-950/60 text-cyan-400 border-cyan-900/60'
                          : 'bg-amber-950/60 text-amber-400 border-amber-900/60'
                      }`}
                    >
                      {comp.category}
                    </span>
                    <span className="text-[10px] text-neutral-500 font-mono">
                      {comp.subFamily}
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-white tracking-tight pt-1">
                    {comp.name}
                  </h4>
                  <span className="text-[10px] text-neutral-500 font-mono block">ID : {comp.id}</span>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenEdit(comp)}
                  className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded transition-colors cursor-pointer"
                  title="Modifier ce composant"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Descriptions */}
              <div className="space-y-1.5 text-xs text-neutral-300">
                <div className="p-2 bg-neutral-950 border border-neutral-800/80 rounded text-[11px]">
                  <strong className="text-neutral-400 block mb-0.5 font-sans">Bénéfice client :</strong>
                  <p className="text-neutral-300 leading-relaxed">{comp.clientExplanation}</p>
                </div>

                <div className="p-2 bg-neutral-950/60 border border-neutral-900 rounded text-[11px]">
                  <strong className="text-neutral-500 block mb-0.5 font-sans">Spécification technique interne :</strong>
                  <p className="text-neutral-400 leading-relaxed font-mono text-[10px]">
                    {comp.internalExplanation}
                  </p>
                </div>
              </div>

              {/* Inclusion Rule */}
              <div className="text-[11px] text-neutral-400 space-y-1 pt-1">
                <div>
                  <span className="text-neutral-500 font-medium">Déclencheur logique : </span>
                  <span className="text-neutral-300">{comp.inclusionCriteria}</span>
                </div>
                {comp.dependencies.length > 0 && (
                  <div>
                    <span className="text-neutral-500 font-medium">Dépendances : </span>
                    <span className="text-cyan-400/80 font-mono text-[10px]">
                      {comp.dependencies.join(', ')}
                    </span>
                  </div>
                )}
                {comp.incompatibilities.length > 0 && (
                  <div>
                    <span className="text-amber-500 font-medium">Incompatibilités : </span>
                    <span className="text-red-400 font-mono text-[10px]">
                      {comp.incompatibilities.join(', ')}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Metrics Bar */}
            <div className="pt-3 border-t border-neutral-800/80 flex items-center justify-between text-xs text-neutral-400">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 font-mono text-[11px] text-neutral-200">
                  <Clock className="w-3.5 h-3.5 text-neutral-400" />
                  {comp.effortMinHours}h - {comp.effortMaxHours}h
                </span>

                {(comp.oneTimeCostDefault > 0 || comp.recurringMonthlyCostDefault > 0) && (
                  <span className="flex items-center gap-1 font-mono text-[11px] text-amber-400">
                    <Euro className="w-3.5 h-3.5" />
                    {comp.oneTimeCostDefault > 0 ? `${comp.oneTimeCostDefault}€` : ''}
                    {comp.recurringMonthlyCostDefault > 0
                      ? ` + ${comp.recurringMonthlyCostDefault}€/m`
                      : ''}
                  </span>
                )}
              </div>

              <span
                className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                  comp.status === 'Actif'
                    ? 'bg-emerald-950 text-emerald-400'
                    : 'bg-neutral-800 text-neutral-400'
                }`}
              >
                {comp.status}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Edit / Create Component */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingComponent ? `Modifier : ${editingComponent.name}` : 'Nouveau composant technique'}
          subtitle="Définition complète pour le moteur de règles et le chiffrage"
          maxWidth="max-w-3xl"
        >
          <form onSubmit={handleSave} className="space-y-4 text-xs text-neutral-300">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">
                  ID unique <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  disabled={Boolean(editingComponent)}
                  value={formData.id}
                  onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                  placeholder="fe_mon_composant"
                  className="w-full px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded font-mono text-xs text-neutral-200 focus:outline-none focus:border-neutral-700 disabled:opacity-50"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] text-neutral-400 mb-1">
                  Nom du composant <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Formulaires interactifs & validation anti-spam"
                  className="w-full px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded text-xs text-neutral-200 focus:outline-none focus:border-neutral-700"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">Catégorie</label>
                <select
                  value={formData.category}
                  onChange={(e) => {
                    const cat = e.target.value as ComponentCategory;
                    setFormData({
                      ...formData,
                      category: cat,
                      subFamily:
                        cat === 'Front-end'
                          ? 'Pages & Design responsive'
                          : 'CMS & Données',
                    });
                  }}
                  className="w-full px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded text-xs text-neutral-200 focus:outline-none"
                >
                  <option value="Front-end">Front-end</option>
                  <option value="Back-end">Back-end</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">Sous-famille</label>
                <select
                  value={formData.subFamily}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      subFamily: e.target.value as FrontSubFamily | BackSubFamily,
                    })
                  }
                  className="w-full px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded text-xs text-neutral-200 focus:outline-none"
                >
                  {formData.category === 'Front-end'
                    ? FRONT_SUBFAMILIES.map((sub) => (
                        <option key={sub} value={sub}>
                          {sub}
                        </option>
                      ))
                    : BACK_SUBFAMILIES.map((sub) => (
                        <option key={sub} value={sub}>
                          {sub}
                        </option>
                      ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">Statut</label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      status: e.target.value as 'Actif' | 'En révision' | 'Obsolète',
                    })
                  }
                  className="w-full px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded text-xs text-neutral-200 focus:outline-none"
                >
                  <option value="Actif">Actif</option>
                  <option value="En révision">En révision</option>
                  <option value="Obsolète">Obsolète</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">
                  Explication vulgarisée client (Bénéfice métier)
                </label>
                <textarea
                  rows={3}
                  value={formData.clientExplanation}
                  onChange={(e) => setFormData({ ...formData, clientExplanation: e.target.value })}
                  placeholder="Expliquez en langage clair ce que ce composant apporte au client..."
                  className="w-full px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded text-xs text-neutral-200 focus:outline-none focus:border-neutral-700"
                />
              </div>

              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">
                  Explication technique interne
                </label>
                <textarea
                  rows={3}
                  value={formData.internalExplanation}
                  onChange={(e) =>
                    setFormData({ ...formData, internalExplanation: e.target.value })
                  }
                  placeholder="Stack, composants techniques, flux, conventions..."
                  className="w-full px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded text-xs text-neutral-200 focus:outline-none focus:border-neutral-700"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-neutral-400 mb-1">Critère d’inclusion logique</label>
              <input
                type="text"
                value={formData.inclusionCriteria}
                onChange={(e) => setFormData({ ...formData, inclusionCriteria: e.target.value })}
                placeholder="Ex: Déclenché si l'exigence « Formulaires » est Validée."
                className="w-full px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded text-xs text-neutral-200 focus:outline-none focus:border-neutral-700"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">
                  Dépendances requises (IDs séparés par des virgules)
                </label>
                <input
                  type="text"
                  value={depsInput}
                  onChange={(e) => setDepsInput(e.target.value)}
                  placeholder="Ex: fe_responsive_layout, be_api_rest"
                  className="w-full px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded text-xs font-mono text-neutral-200 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">
                  Incompatibilités (IDs séparés par des virgules)
                </label>
                <input
                  type="text"
                  value={incompInput}
                  onChange={(e) => setIncompInput(e.target.value)}
                  placeholder="Ex: be_simple_file_storage"
                  className="w-full px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded text-xs font-mono text-neutral-200 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-neutral-950 border border-neutral-800 rounded-lg">
              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">Effort min (h)</label>
                <input
                  type="number"
                  min={0}
                  value={formData.effortMinHours}
                  onChange={(e) =>
                    setFormData({ ...formData, effortMinHours: Number(e.target.value) })
                  }
                  className="w-full px-3 py-1 bg-neutral-900 border border-neutral-800 rounded text-xs font-mono text-neutral-200"
                />
              </div>

              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">Effort max (h)</label>
                <input
                  type="number"
                  min={0}
                  value={formData.effortMaxHours}
                  onChange={(e) =>
                    setFormData({ ...formData, effortMaxHours: Number(e.target.value) })
                  }
                  className="w-full px-3 py-1 bg-neutral-900 border border-neutral-800 rounded text-xs font-mono text-neutral-200"
                />
              </div>

              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">Coût initial (€)</label>
                <input
                  type="number"
                  min={0}
                  value={formData.oneTimeCostDefault}
                  onChange={(e) =>
                    setFormData({ ...formData, oneTimeCostDefault: Number(e.target.value) })
                  }
                  className="w-full px-3 py-1 bg-neutral-900 border border-neutral-800 rounded text-xs font-mono text-neutral-200"
                />
              </div>

              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">Coût récurrent (€/m)</label>
                <input
                  type="number"
                  min={0}
                  value={formData.recurringMonthlyCostDefault}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      recurringMonthlyCostDefault: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-1 bg-neutral-900 border border-neutral-800 rounded text-xs font-mono text-neutral-200"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">Exigences de sécurité</label>
                <input
                  type="text"
                  value={formData.securityRequirements}
                  onChange={(e) =>
                    setFormData({ ...formData, securityRequirements: e.target.value })
                  }
                  placeholder="Ex: Rate limiting, CSRF, sanitisation des inputs"
                  className="w-full px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded text-xs text-neutral-200 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">Tests d’acceptation</label>
                <input
                  type="text"
                  value={formData.acceptanceTests}
                  onChange={(e) =>
                    setFormData({ ...formData, acceptanceTests: e.target.value })
                  }
                  placeholder="Ex: Envoi effectif d'un message avec notification et anti-spam"
                  className="w-full px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded text-xs text-neutral-200 focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-3 flex items-center justify-end gap-3 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-xs font-medium transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-white hover:bg-neutral-100 text-neutral-950 rounded-lg text-xs font-medium transition-colors shadow-xs"
              >
                {editingComponent ? 'Mettre à jour le composant' : 'Ajouter au catalogue'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
