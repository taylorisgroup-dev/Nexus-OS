import React, { useState, useEffect, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import type {
  WebConfiguration,
  WebProjectType,
  FramingRequirement,
  ComponentSelection,
  PricingParameters,
  DeliveryEstimation,
  ClientLegalProfile,
  RequirementStatus,
} from '../../types/configurator';
import {
  DEFAULT_FRAMING_REQUIREMENTS,
  DEFAULT_PRICING_PARAMETERS,
  REFERENCE_DELAYS,
} from '../../lib/configuratorDefaults';
import { runConfiguratorEngine, type EngineResult } from '../../lib/configuratorEngine';
import { FramingAssistant } from './FramingAssistant';
import { RulesEngineView } from './RulesEngineView';
import { PricingAndDeliveryView } from './PricingAndDeliveryView';
import { DocumentsView } from './DocumentsView';
import { ComponentsCatalogManager } from './ComponentsCatalogManager';
import { CompanyLegalModal } from './CompanyLegalModal';
import { ClientLegalModal } from './ClientLegalModal';
import { NexusLogo } from '../brand/NexusLogo';
import {
  Sliders,
  Layers,
  Calculator,
  FileText,
  Settings2,
  Building,
  UserCheck,
  Save,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Euro,
  Plus,
  Briefcase,
  Sparkles,
} from 'lucide-react';

export const ConfiguratorView: React.FC = () => {
  const {
    projects,
    prospects,
    componentsCatalog,
    companyLegal,
    saveProjectWebConfig,
    createProject,
  } = useData();

  // Active sub-tab
  const [activeTab, setActiveTab] = useState<'framing' | 'engine' | 'pricing' | 'documents' | 'catalog'>('framing');

  // Selected Project ID (or 'new')
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');

  // Modals for legal configurations
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);

  // Status feedback
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // Active Working Configuration
  const [activeConfig, setActiveConfig] = useState<WebConfiguration>(() => {
    return {
      id: `config_${Date.now()}`,
      projectId: '',
      projectTitle: 'Nouveau projet web',
      clientName: '',
      projectType: 'Site vitrine',
      requirements: DEFAULT_FRAMING_REQUIREMENTS.map((r) => ({ ...r })),
      selections: {},
      pricing: { ...DEFAULT_PRICING_PARAMETERS },
      delivery: {
        projectType: 'Site vitrine',
        referenceWeeksMin: REFERENCE_DELAYS['Site vitrine'].minWeeks,
        referenceWeeksMax: REFERENCE_DELAYS['Site vitrine'].maxWeeks,
        label: REFERENCE_DELAYS['Site vitrine'].label,
        clientDependencies: [
          'Fourniture des textes, logos et visuels haute définition validés',
          'Validation des wireframes et maquettes dans les délais convenus',
          'Accès aux zones DNS / hébergeur si déploiement délégué',
        ],
        targetStartDate: new Date().toISOString().split('T')[0],
        notes: '',
      },
      clientLegal: {
        companyName: '',
        contactName: '',
        address: '',
        postalCode: '',
        city: '',
        country: 'France',
        email: '',
        phone: '',
      },
      documents: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  });

  // Automatically select first project with webConfig or set first project
  useEffect(() => {
    if (projects.length > 0 && !selectedProjectId) {
      const projWithConfig = projects.find((p) => p.webConfig);
      if (projWithConfig) {
        setSelectedProjectId(projWithConfig.id);
        loadProjectConfig(projWithConfig);
      } else {
        setSelectedProjectId(projects[0].id);
        loadProjectConfig(projects[0]);
      }
    }
  }, [projects]);

  const loadProjectConfig = (project: (typeof projects)[0]) => {
    if (project.webConfig) {
      setActiveConfig(project.webConfig);
    } else {
      // Initialize a new config for this project
      const initial: WebConfiguration = {
        id: `config_${project.id}`,
        projectId: project.id,
        projectTitle: project.title,
        prospectId: project.prospectId,
        clientName: project.clientName || '',
        projectType: 'Site vitrine',
        requirements: DEFAULT_FRAMING_REQUIREMENTS.map((r) => ({ ...r })),
        selections: {},
        pricing: { ...DEFAULT_PRICING_PARAMETERS },
        delivery: {
          projectType: 'Site vitrine',
          referenceWeeksMin: REFERENCE_DELAYS['Site vitrine'].minWeeks,
          referenceWeeksMax: REFERENCE_DELAYS['Site vitrine'].maxWeeks,
          label: REFERENCE_DELAYS['Site vitrine'].label,
          clientDependencies: [
            'Fourniture des textes, logos et visuels haute définition validés',
            'Validation des wireframes et maquettes dans les délais convenus',
            'Accès aux zones DNS / hébergeur si déploiement délégué',
          ],
          targetStartDate: project.startDate || new Date().toISOString().split('T')[0],
          notes: '',
        },
        clientLegal: {
          companyName: project.clientName || '',
          contactName: '',
          address: '',
          postalCode: '',
          city: '',
          country: 'France',
          email: '',
          phone: '',
        },
        documents: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setActiveConfig(initial);
    }
  };

  const handleSelectProject = (projectId: string) => {
    setSelectedProjectId(projectId);
    if (projectId === 'new') {
      setActiveConfig({
        id: `config_${Date.now()}`,
        projectId: `proj_standalone_${Date.now()}`,
        projectTitle: 'Nouveau projet web autonome',
        clientName: '',
        projectType: 'Site vitrine',
        requirements: DEFAULT_FRAMING_REQUIREMENTS.map((r) => ({ ...r })),
        selections: {},
        pricing: { ...DEFAULT_PRICING_PARAMETERS },
        delivery: {
          projectType: 'Site vitrine',
          referenceWeeksMin: REFERENCE_DELAYS['Site vitrine'].minWeeks,
          referenceWeeksMax: REFERENCE_DELAYS['Site vitrine'].maxWeeks,
          label: REFERENCE_DELAYS['Site vitrine'].label,
          clientDependencies: [
            'Fourniture des textes, logos et visuels haute définition validés',
            'Validation des wireframes et maquettes dans les délais convenus',
            'Accès aux zones DNS / hébergeur si déploiement délégué',
          ],
          targetStartDate: new Date().toISOString().split('T')[0],
          notes: '',
        },
        clientLegal: {
          companyName: '',
          contactName: '',
          address: '',
          postalCode: '',
          city: '',
          country: 'France',
          email: '',
          phone: '',
        },
        documents: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } else {
      const proj = projects.find((p) => p.id === projectId);
      if (proj) {
        loadProjectConfig(proj);
      }
    }
  };

  // Run the deterministic engine on active state
  const engineResult: EngineResult = useMemo(() => {
    return runConfiguratorEngine(
      activeConfig.projectType,
      activeConfig.requirements,
      componentsCatalog,
      activeConfig.selections,
      activeConfig.pricing,
      activeConfig.delivery.targetStartDate
    );
  }, [
    activeConfig.projectType,
    activeConfig.requirements,
    componentsCatalog,
    activeConfig.selections,
    activeConfig.pricing,
    activeConfig.delivery.targetStartDate,
  ]);

  // Keep activeConfig selections in sync with engine recommendation if not overridden
  useEffect(() => {
    // Only update if selections differ to avoid infinite loop
    let hasChanges = false;
    const merged = { ...activeConfig.selections };

    for (const [id, calculated] of Object.entries(engineResult.selections)) {
      if (!merged[id]) {
        merged[id] = calculated;
        hasChanges = true;
      } else {
        const existing = merged[id];
        if (!existing.isOverriddenManually) {
          if (
            existing.isSelected !== calculated.isSelected ||
            existing.engineJustification !== calculated.engineJustification
          ) {
            merged[id] = {
              ...calculated,
              isOverriddenManually: false,
            };
            hasChanges = true;
          }
        }
      }
    }

    if (hasChanges) {
      setActiveConfig((prev) => ({
        ...prev,
        selections: merged,
      }));
    }
  }, [engineResult.selections]);

  // Updaters
  const handleUpdateProjectType = (type: WebProjectType) => {
    const delay = REFERENCE_DELAYS[type] || REFERENCE_DELAYS['Site vitrine'];
    setActiveConfig((prev) => ({
      ...prev,
      projectType: type,
      delivery: {
        ...prev.delivery,
        projectType: type,
        referenceWeeksMin: delay.minWeeks,
        referenceWeeksMax: delay.maxWeeks,
        label: delay.label,
      },
      updatedAt: new Date().toISOString(),
    }));
  };

  const handleUpdateRequirement = (
    id: string,
    status: RequirementStatus,
    details?: string
  ) => {
    setActiveConfig((prev) => ({
      ...prev,
      requirements: prev.requirements.map((r) =>
        r.id === id ? { ...r, status, responseDetails: details } : r
      ),
      updatedAt: new Date().toISOString(),
    }));
  };

  const handleToggleComponent = (
    componentId: string,
    isSelected: boolean,
    reason?: string
  ) => {
    const current = activeConfig.selections[componentId];
    const comp = componentsCatalog.find((c) => c.id === componentId);
    if (!comp) return;

    setActiveConfig((prev) => ({
      ...prev,
      selections: {
        ...prev.selections,
        [componentId]: {
          componentId,
          isSelected,
          isRecommendedByEngine: current?.isRecommendedByEngine ?? false,
          isOverriddenManually: true,
          overrideReason: reason || 'Surcharge manuelle dirigeant',
          engineJustification:
            current?.engineJustification || `Surchargé manuellement : ${reason || 'Décision dirigeant'}`,
          coveredRequirementIds: current?.coveredRequirementIds || [],
          missingConfirmations: current?.missingConfirmations || [],
        },
      },
      updatedAt: new Date().toISOString(),
    }));
  };

  const handleSaveToFirestore = async () => {
    setSaveStatus('Enregistrement en cours...');
    try {
      if (selectedProjectId === 'new' || !projects.some((p) => p.id === activeConfig.projectId)) {
        // Create new project in Projects module
        const newProjId = await createProject({
          title: activeConfig.projectTitle || `Projet Web ${activeConfig.projectType}`,
          clientName: activeConfig.clientLegal.companyName || activeConfig.clientName || 'Client digital',
          businessObjective: `Dispositif digital ${activeConfig.projectType} configuré avec NEXUS Digital`,
          scope: `${Object.values(activeConfig.selections).filter((s) => s.isSelected).length} composants logiciels configurés`,
          status: 'À cadrer',
          notes: activeConfig.delivery.notes || '',
          webConfig: activeConfig,
        });
        setSelectedProjectId(newProjId);
        setActiveConfig((prev) => ({ ...prev, projectId: newProjId }));
        setSaveStatus('Projet web et configuration créés et persistés dans Firestore.');
      } else {
        // Save to existing project
        await saveProjectWebConfig(activeConfig.projectId, activeConfig);
        setSaveStatus('Configuration enregistrée et synchronisée avec Firestore.');
      }
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (err: unknown) {
      console.error(err);
      setSaveStatus('Erreur lors de l’enregistrement dans Firestore.');
      setTimeout(() => setSaveStatus(null), 4000);
    }
  };

  // Metrics for Top Ribbon
  const validatedReqCount = activeConfig.requirements.filter((r) => r.status === 'Validée').length;
  const selectedCompCount = Object.values(activeConfig.selections).filter((s) => s.isSelected).length;

  return (
    <div className="space-y-6">
      {/* Top Header & Project Selection Bar */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
          <div className="space-y-2">
            <NexusLogo variant="sidebar" showSubtext={true} />
            <div className="flex items-center gap-2 pt-1">
              <span className="text-[11px] font-mono uppercase tracking-wider text-cyan-400 bg-cyan-950/60 border border-cyan-900/60 px-2 py-0.5 rounded">
                NEXUS Digital
              </span>
              <span className="text-xs text-neutral-500 font-mono">
                Ingénierie d’affaires & digitalisation
              </span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white">
              Configurateur Web & Documents Contractuels
            </h2>
            <p className="text-xs text-neutral-400 max-w-2xl leading-relaxed">
              « L’entreprise d’abord. La technologie ensuite. » Configurez uniquement les composants nécessaires,
              justifiez chaque inclusion, chiffrez avec transparence et produisez les 4 documents de travail en brouillon à vérifier.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsCompanyModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 rounded-lg text-xs text-neutral-300 font-medium transition-colors cursor-pointer"
              title="Configurer les coordonnées et mentions légales de NEXUS"
            >
              <Building className="w-3.5 h-3.5 text-neutral-400" />
              <span>Paramètres Vendeur</span>
            </button>

            <button
              type="button"
              onClick={() => setIsClientModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 rounded-lg text-xs text-neutral-300 font-medium transition-colors cursor-pointer"
              title="Configurer les coordonnées de facturation du client"
            >
              <UserCheck className="w-3.5 h-3.5 text-neutral-400" />
              <span>Coordonnées Client</span>
            </button>

            <button
              type="button"
              onClick={handleSaveToFirestore}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-white hover:bg-neutral-100 text-neutral-950 font-semibold text-xs rounded-lg transition-colors shadow-xs cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Enregistrer dans Firestore</span>
            </button>
          </div>
        </div>

        {/* Project Selector & Name input */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div>
            <label className="block text-[11px] text-neutral-400 mb-1">
              Dossier / Projet associé (NEXUS OS)
            </label>
            <select
              value={selectedProjectId}
              onChange={(e) => handleSelectProject(e.target.value)}
              className="w-full px-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-cyan-400 font-medium"
            >
              <option value="new">+ Créer une nouvelle configuration web</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title} {p.clientName ? `(${p.clientName})` : ''} {p.webConfig ? '· Configuré' : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] text-neutral-400 mb-1">Titre du projet web</label>
            <input
              type="text"
              value={activeConfig.projectTitle}
              onChange={(e) =>
                setActiveConfig((prev) => ({
                  ...prev,
                  projectTitle: e.target.value,
                  updatedAt: new Date().toISOString(),
                }))
              }
              placeholder="Ex: Refonte du portail institutionnel"
              className="w-full px-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div>
            <label className="block text-[11px] text-neutral-400 mb-1">Client / Organisation</label>
            <input
              type="text"
              value={activeConfig.clientLegal.companyName || activeConfig.clientName}
              onChange={(e) => {
                const val = e.target.value;
                setActiveConfig((prev) => ({
                  ...prev,
                  clientName: val,
                  clientLegal: { ...prev.clientLegal, companyName: val },
                  updatedAt: new Date().toISOString(),
                }));
              }}
              placeholder="Ex: Société Cliente"
              className="w-full px-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-cyan-400"
            />
          </div>
        </div>

        {saveStatus && (
          <div className="p-3 bg-neutral-950 border border-cyan-800/80 text-cyan-300 text-xs rounded-lg flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>{saveStatus}</span>
          </div>
        )}

        {/* Live Executive KPI Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2 text-xs">
          <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg">
            <span className="text-[10px] text-neutral-500 block uppercase font-mono">Typologie</span>
            <span className="text-sm font-bold text-white block mt-0.5 truncate">
              {activeConfig.projectType}
            </span>
            <span className="text-[10px] text-neutral-500 font-mono block mt-0.5">
              {engineResult.deliveryEstimate.referenceWeeksMin}-{engineResult.deliveryEstimate.referenceWeeksMax} sem.
            </span>
          </div>

          <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg">
            <span className="text-[10px] text-neutral-500 block uppercase font-mono">Cadrage validé</span>
            <span className="text-sm font-bold font-mono text-emerald-400 block mt-0.5">
              {validatedReqCount} / {activeConfig.requirements.length}
            </span>
            <span className="text-[10px] text-neutral-500 block mt-0.5">
              {engineResult.criticalRequirementsMissing.length > 0
                ? `${engineResult.criticalRequirementsMissing.length} critique(s) en suspens`
                : '100% qualifié'}
            </span>
          </div>

          <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg">
            <span className="text-[10px] text-neutral-500 block uppercase font-mono">Composants retenus</span>
            <span className="text-sm font-bold font-mono text-cyan-400 block mt-0.5">
              {selectedCompCount} modules
            </span>
            <span className="text-[10px] text-neutral-500 block mt-0.5">
              {engineResult.totalEffortMin}h - {engineResult.totalEffortMax}h d'ingénierie
            </span>
          </div>

          <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg">
            <span className="text-[10px] text-neutral-500 block uppercase font-mono">Total HT Estimé</span>
            <span className="text-sm font-bold font-mono text-white block mt-0.5">
              {engineResult.pricingCalculation.totalHTMin !== null
                ? `${engineResult.pricingCalculation.totalHTMin.toLocaleString('fr-FR')} € HT`
                : 'À configurer'}
            </span>
            <span className="text-[10px] text-neutral-500 block mt-0.5">
              {activeConfig.pricing.hourlyRate ? `${activeConfig.pricing.hourlyRate} €/h` : 'Taux non défini'}
            </span>
          </div>

          <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg">
            <span className="text-[10px] text-neutral-500 block uppercase font-mono">Facturation</span>
            <span
              className={`text-sm font-bold font-mono block mt-0.5 ${
                engineResult.pricingCalculation.isFullyConfigured &&
                engineResult.criticalRequirementsMissing.length === 0 &&
                companyLegal.sirenSiret.trim() &&
                activeConfig.clientLegal.companyName.trim()
                  ? 'text-emerald-400'
                  : 'text-amber-400'
              }`}
            >
              {engineResult.pricingCalculation.isFullyConfigured &&
              engineResult.criticalRequirementsMissing.length === 0 &&
              companyLegal.sirenSiret.trim() &&
              activeConfig.clientLegal.companyName.trim()
                ? 'Conforme'
                : 'Bloquée (brouillon)'}
            </span>
            <span className="text-[10px] text-neutral-500 block mt-0.5">
              Vendeur & Client
            </span>
          </div>
        </div>
      </div>

      {/* Module Navigation Tabs */}
      <div className="flex items-center gap-1 bg-neutral-900 border border-neutral-800 p-1.5 rounded-xl overflow-x-auto text-xs">
        <button
          type="button"
          onClick={() => setActiveTab('framing')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-medium transition-colors cursor-pointer shrink-0 ${
            activeTab === 'framing'
              ? 'bg-neutral-800 text-white shadow-xs'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Sliders className="w-4 h-4 text-cyan-400" />
          <span>1. Assistant de Cadrage</span>
          <span className="px-1.5 py-0.2 rounded bg-neutral-950 text-neutral-400 font-mono text-[10px]">
            {validatedReqCount}/{activeConfig.requirements.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('engine')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-medium transition-colors cursor-pointer shrink-0 ${
            activeTab === 'engine'
              ? 'bg-neutral-800 text-white shadow-xs'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4 text-cyan-400" />
          <span>2. Moteur de Règles & Composants</span>
          <span className="px-1.5 py-0.2 rounded bg-neutral-950 text-cyan-300 font-mono text-[10px]">
            {selectedCompCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('pricing')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-medium transition-colors cursor-pointer shrink-0 ${
            activeTab === 'pricing'
              ? 'bg-neutral-800 text-white shadow-xs'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Calculator className="w-4 h-4 text-cyan-400" />
          <span>3. Chiffrage & Délais</span>
          {activeConfig.pricing.hourlyRate && (
            <span className="px-1.5 py-0.2 rounded bg-neutral-950 text-neutral-400 font-mono text-[10px]">
              {activeConfig.pricing.hourlyRate}€/h
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('documents')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-medium transition-colors cursor-pointer shrink-0 ${
            activeTab === 'documents'
              ? 'bg-neutral-800 text-white shadow-xs'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4 text-cyan-400" />
          <span>4. Documents Contractuels (4)</span>
          <span className="px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 font-mono text-[10px]">
            Brouillons
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('catalog')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-medium transition-colors cursor-pointer shrink-0 ml-auto ${
            activeTab === 'catalog'
              ? 'bg-neutral-800 text-white shadow-xs'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Settings2 className="w-4 h-4 text-neutral-400" />
          <span>Catalogue Technique ({componentsCatalog.length})</span>
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === 'framing' && (
        <FramingAssistant
          projectType={activeConfig.projectType}
          onUpdateProjectType={handleUpdateProjectType}
          requirements={activeConfig.requirements}
          onUpdateRequirement={handleUpdateRequirement}
          clientName={activeConfig.clientLegal.companyName || activeConfig.clientName}
          projectTitle={activeConfig.projectTitle}
        />
      )}

      {activeTab === 'engine' && (
        <RulesEngineView
          catalog={componentsCatalog}
          selections={activeConfig.selections}
          engineResult={engineResult}
          requirements={activeConfig.requirements}
          onToggleComponent={handleToggleComponent}
        />
      )}

      {activeTab === 'pricing' && (
        <PricingAndDeliveryView
          pricing={activeConfig.pricing}
          onUpdatePricing={(p) =>
            setActiveConfig((prev) => ({
              ...prev,
              pricing: p,
              updatedAt: new Date().toISOString(),
            }))
          }
          delivery={activeConfig.delivery}
          onUpdateDelivery={(d) =>
            setActiveConfig((prev) => ({
              ...prev,
              delivery: d,
              updatedAt: new Date().toISOString(),
            }))
          }
          engineResult={engineResult}
        />
      )}

      {activeTab === 'documents' && (
        <DocumentsView
          config={activeConfig}
          engineResult={engineResult}
          componentsCatalog={componentsCatalog}
          companyLegal={companyLegal}
          onOpenCompanyLegal={() => setIsCompanyModalOpen(true)}
          onOpenClientLegal={() => setIsClientModalOpen(true)}
          onSaveConfig={(updated) => setActiveConfig(updated)}
        />
      )}

      {activeTab === 'catalog' && <ComponentsCatalogManager />}

      {/* Modals for Company & Client Legal Info */}
      {isCompanyModalOpen && (
        <CompanyLegalModal
          isOpen={isCompanyModalOpen}
          onClose={() => setIsCompanyModalOpen(false)}
        />
      )}

      {isClientModalOpen && (
        <ClientLegalModal
          isOpen={isClientModalOpen}
          onClose={() => setIsClientModalOpen(false)}
          initialProfile={activeConfig.clientLegal}
          onSave={(updatedProfile) => {
            setActiveConfig((prev) => ({
              ...prev,
              clientLegal: updatedProfile,
              clientName: updatedProfile.companyName || prev.clientName,
              updatedAt: new Date().toISOString(),
            }));
          }}
          clientDisplayName={activeConfig.clientLegal.companyName || activeConfig.clientName}
        />
      )}
    </div>
  );
};
