import React, { useState } from 'react';
import {
  type WebComponent,
  type ComponentSelection,
  type FramingRequirement,
} from '../../types/configurator';
import type { EngineResult } from '../../lib/configuratorEngine';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Euro,
  HelpCircle,
  ToggleLeft,
  ToggleRight,
  Info,
  ChevronDown,
  Layers,
  Filter,
  Search,
  Sparkles,
} from 'lucide-react';
import { Modal } from '../ui/Modal';

interface RulesEngineViewProps {
  catalog: WebComponent[];
  selections: Record<string, ComponentSelection>;
  engineResult: EngineResult;
  requirements: FramingRequirement[];
  onToggleComponent: (componentId: string, isSelected: boolean, reason?: string) => void;
  onUpdateComponentMetrics?: (
    componentId: string,
    customEffortMin?: number,
    customEffortMax?: number,
    customOneTime?: number,
    customRecurring?: number
  ) => void;
}

export const RulesEngineView: React.FC<RulesEngineViewProps> = ({
  catalog,
  selections,
  engineResult,
  requirements,
  onToggleComponent,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'selected' | 'recommended' | 'overridden' | 'issues'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [overrideModalCompId, setOverrideModalCompId] = useState<string | null>(null);
  const [overrideReason, setOverrideReason] = useState('');
  const [overrideTargetState, setOverrideTargetState] = useState(false);

  const compMap = new Map(catalog.map((c) => [c.id, c]));

  // Count metrics
  const selectedCount = Object.values(selections).filter((s) => s.isSelected).length;
  const recommendedCount = Object.values(selections).filter((s) => s.isRecommendedByEngine).length;
  const overriddenCount = Object.values(selections).filter((s) => s.isOverriddenManually).length;

  const filteredComponents = catalog.filter((comp) => {
    const sel = selections[comp.id];
    const isSelected = sel ? sel.isSelected : false;
    const isOverridden = sel ? sel.isOverriddenManually : false;
    const isRecommended = sel ? sel.isRecommendedByEngine : false;

    const hasIssue =
      engineResult.unresolvedDependencies.some((d) => d.componentId === comp.id) ||
      engineResult.detectedIncompatibilities.some(
        (inc) => inc.componentAId === comp.id || inc.componentBId === comp.id
      );

    if (filterType === 'selected' && !isSelected) return false;
    if (filterType === 'recommended' && !isRecommended) return false;
    if (filterType === 'overridden' && !isOverridden) return false;
    if (filterType === 'issues' && !hasIssue) return false;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return (
        comp.name.toLowerCase().includes(q) ||
        comp.id.toLowerCase().includes(q) ||
        comp.subFamily.toLowerCase().includes(q) ||
        (sel?.engineJustification || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleOpenOverride = (componentId: string, currentSelected: boolean) => {
    setOverrideModalCompId(componentId);
    setOverrideTargetState(!currentSelected);
    const existing = selections[componentId];
    setOverrideReason(existing?.overrideReason || '');
  };

  const handleConfirmOverride = () => {
    if (overrideModalCompId) {
      onToggleComponent(overrideModalCompId, overrideTargetState, overrideReason);
      setOverrideModalCompId(null);
      setOverrideReason('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Engine Principles & Live Summary */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
          <div>
            <span className="text-[11px] text-neutral-400 font-mono uppercase tracking-wider block">
              NEXUS Digital · Moteur Déterministe & Traçable
            </span>
            <h3 className="text-base font-semibold text-white tracking-tight mt-0.5">
              Sélection & Justification des Composants Logiciels
            </h3>
            <p className="text-xs text-neutral-400 mt-1">
              Chaque composant inclus est directement motivé par une exigence validée lors du cadrage ou une dépendance technique obligatoire.
            </p>
          </div>

          {/* Ethics / Transparency Warning */}
          <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg text-[11px] text-neutral-400 max-w-sm">
            <span className="text-amber-400 font-semibold block mb-0.5">Discipline d’ingénierie NEXUS :</span>
            Ne jamais prétendre qu’une fonctionnalité est livrée parce qu’elle est configurée. Seuls les composants validés et testés constituent un livrable effectif.
          </div>
        </div>

        {/* Live Engine KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
          <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg">
            <span className="text-[11px] text-neutral-500 block">Composants retenus</span>
            <span className="text-lg font-bold font-mono text-cyan-400">{selectedCount}</span>
            <span className="text-[10px] text-neutral-500 block mt-0.5">sur {catalog.length} briques</span>
          </div>

          <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg">
            <span className="text-[11px] text-neutral-500 block">Effort estimé</span>
            <span className="text-lg font-bold font-mono text-white">
              {engineResult.totalEffortMin}h - {engineResult.totalEffortMax}h
            </span>
            <span className="text-[10px] text-neutral-500 block mt-0.5">Fourchette basse / haute</span>
          </div>

          <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg">
            <span className="text-[11px] text-neutral-500 block">Coûts initiaux</span>
            <span className="text-lg font-bold font-mono text-neutral-200">
              {engineResult.totalOneTimeCosts} €
            </span>
            <span className="text-[10px] text-neutral-500 block mt-0.5">Logiciels / licences</span>
          </div>

          <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg">
            <span className="text-[11px] text-neutral-500 block">Abonnements récurrents</span>
            <span className="text-lg font-bold font-mono text-neutral-200">
              {engineResult.totalRecurringMonthlyCosts} €/m
            </span>
            <span className="text-[10px] text-neutral-500 block mt-0.5">Services tiers / infra</span>
          </div>

          <div
            className={`p-3 border rounded-lg ${
              engineResult.unresolvedDependencies.length > 0 || engineResult.detectedIncompatibilities.length > 0
                ? 'bg-amber-950/40 border-amber-800/80 text-amber-200'
                : 'bg-neutral-950 border-neutral-800 text-neutral-400'
            }`}
          >
            <span className="text-[11px] text-neutral-400 block">Conflits / Dépendances</span>
            <span
              className={`text-lg font-bold font-mono ${
                engineResult.unresolvedDependencies.length > 0 || engineResult.detectedIncompatibilities.length > 0
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              }`}
            >
              {engineResult.unresolvedDependencies.length + engineResult.detectedIncompatibilities.length}
            </span>
            <span className="text-[10px] block mt-0.5">
              {engineResult.unresolvedDependencies.length > 0 || engineResult.detectedIncompatibilities.length > 0
                ? 'Anomalies à résoudre'
                : 'Architecture cohérente'}
            </span>
          </div>
        </div>

        {/* Warning messages if dependencies unresolved or conflicts */}
        {engineResult.unresolvedDependencies.length > 0 && (
          <div className="p-3 bg-amber-950/40 border border-amber-800/80 rounded-lg space-y-1.5 text-xs text-amber-200">
            <div className="flex items-center gap-2 font-semibold">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Dépendances techniques requises non sélectionnées :</span>
            </div>
            <ul className="list-disc list-inside space-y-0.5 text-[11px] text-amber-300/90 pl-1">
              {engineResult.unresolvedDependencies.map((dep, idx) => (
                <li key={idx}>
                  Le composant <strong className="font-mono">{dep.componentId}</strong> requiert{' '}
                  <strong className="font-mono">{dep.missingDependencyName}</strong> ({dep.missingDependencyId}).
                </li>
              ))}
            </ul>
          </div>
        )}

        {engineResult.detectedIncompatibilities.length > 0 && (
          <div className="p-3 bg-red-950/40 border border-red-800/80 rounded-lg space-y-1.5 text-xs text-red-200">
            <div className="flex items-center gap-2 font-semibold">
              <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
              <span>Incompatibilités logiques détectées :</span>
            </div>
            <ul className="list-disc list-inside space-y-0.5 text-[11px] text-red-300/90 pl-1">
              {engineResult.detectedIncompatibilities.map((inc, idx) => (
                <li key={idx}>{inc.message}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-neutral-900 border border-neutral-800 p-3.5 rounded-xl">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher un composant, ID ou justification..."
            className="w-full pl-8 pr-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center bg-neutral-950 border border-neutral-800 rounded-lg p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setFilterType('all')}
            className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
              filterType === 'all' ? 'bg-neutral-800 text-white font-medium' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Tous ({catalog.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('selected')}
            className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
              filterType === 'selected' ? 'bg-neutral-800 text-cyan-300 font-medium' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Retenus ({selectedCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('recommended')}
            className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
              filterType === 'recommended'
                ? 'bg-neutral-800 text-emerald-300 font-medium'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Recommandés ({recommendedCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('overridden')}
            className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
              filterType === 'overridden'
                ? 'bg-amber-950 text-amber-300 font-medium'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Surchargés ({overriddenCount})
          </button>
        </div>
      </div>

      {/* Component Matrix */}
      <div className="space-y-3">
        {filteredComponents.map((comp) => {
          const sel = selections[comp.id];
          const isSelected = sel ? sel.isSelected : false;
          const isRecommended = sel ? sel.isRecommendedByEngine : false;
          const isOverridden = sel ? sel.isOverriddenManually : false;

          const missingDep = engineResult.unresolvedDependencies.find((d) => d.componentId === comp.id);
          const incomp = engineResult.detectedIncompatibilities.find(
            (inc) => inc.componentAId === comp.id || inc.componentBId === comp.id
          );

          return (
            <div
              key={comp.id}
              className={`p-4 rounded-xl border transition-all ${
                isSelected
                  ? isOverridden
                    ? 'bg-neutral-900 border-amber-900/60 shadow-xs'
                    : 'bg-neutral-900 border-neutral-700 shadow-xs'
                  : 'bg-neutral-950/50 border-neutral-900 opacity-70 hover:opacity-100'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                {/* Left: Info & Badges */}
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded border ${
                        comp.category === 'Front-end'
                          ? 'bg-cyan-950/60 text-cyan-400 border-cyan-900/60'
                          : 'bg-amber-950/60 text-amber-400 border-amber-900/60'
                      }`}
                    >
                      {comp.category}
                    </span>
                    <span className="text-[10px] text-neutral-400 font-mono bg-neutral-950 px-2 py-0.5 rounded border border-neutral-800">
                      {comp.subFamily}
                    </span>

                    {/* Status Badge */}
                    {isSelected ? (
                      isOverridden ? (
                        <span className="text-[10px] text-amber-300 font-medium bg-amber-950/80 border border-amber-800/80 px-2 py-0.5 rounded">
                          Surcharge manuelle ({isRecommended ? 'Forcé inclus' : 'Inclus manuellement'})
                        </span>
                      ) : (
                        <span className="text-[10px] text-emerald-300 font-medium bg-emerald-950/80 border border-emerald-800/80 px-2 py-0.5 rounded flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          Recommandé par le moteur
                        </span>
                      )
                    ) : (
                      <span className="text-[10px] text-neutral-500 font-medium bg-neutral-950 px-2 py-0.5 rounded border border-neutral-800">
                        {isOverridden ? 'Exclu manuellement' : 'Non retenu'}
                      </span>
                    )}

                    {missingDep && (
                      <span className="text-[10px] text-amber-400 font-medium bg-amber-950/80 border border-amber-800 px-2 py-0.5 rounded flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Dépendance manquante
                      </span>
                    )}

                    {incomp && (
                      <span className="text-[10px] text-red-400 font-medium bg-red-950/80 border border-red-800 px-2 py-0.5 rounded flex items-center gap-1">
                        <ShieldAlert className="w-3 h-3" />
                        Incompatibilité
                      </span>
                    )}
                  </div>

                  <h4 className="text-sm font-semibold text-white tracking-tight pt-0.5">
                    {comp.name}
                  </h4>

                  {/* Justification of Inclusion */}
                  <div className="p-2.5 bg-neutral-950 border border-neutral-800/80 rounded-lg text-xs space-y-1">
                    <div className="flex items-start gap-1.5 text-neutral-300">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                      <span className="leading-relaxed">
                        <strong className="text-neutral-400 font-sans">Justification déterministe : </strong>
                        {sel?.engineJustification || comp.inclusionCriteria}
                      </span>
                    </div>

                    {isOverridden && sel?.overrideReason && (
                      <div className="text-[11px] text-amber-300/90 pt-1 border-t border-neutral-900">
                        <strong className="font-sans">Motif de la surcharge : </strong>
                        « {sel.overrideReason} »
                      </div>
                    )}
                  </div>

                  {/* Explanations */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] text-neutral-400 pt-1">
                    <div>
                      <span className="text-neutral-500 font-medium">Bénéfice client : </span>
                      <span className="text-neutral-300">{comp.clientExplanation}</span>
                    </div>
                    <div>
                      <span className="text-neutral-500 font-medium">Spécification interne : </span>
                      <span className="text-neutral-400 font-mono text-[10px]">
                        {comp.internalExplanation}
                      </span>
                    </div>
                  </div>

                  {/* Dependencies & Confirmations */}
                  {sel && sel.missingConfirmations && sel.missingConfirmations.length > 0 && (
                    <div className="p-2 bg-amber-950/20 border border-amber-900/40 rounded text-[11px] text-amber-300 flex items-start gap-1.5">
                      <Info className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <strong>Points à confirmer : </strong>
                        {sel.missingConfirmations.join(' · ')}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right: Metrics & Toggle Switch */}
                <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between gap-3 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-neutral-800">
                  <div className="text-right space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-mono text-white justify-end">
                      <Clock className="w-3.5 h-3.5 text-neutral-400" />
                      <span>
                        {comp.effortMinHours}h - {comp.effortMaxHours}h
                      </span>
                    </div>

                    {(comp.oneTimeCostDefault > 0 || comp.recurringMonthlyCostDefault > 0) && (
                      <div className="text-[11px] font-mono text-neutral-400 justify-end">
                        {comp.oneTimeCostDefault > 0 && `${comp.oneTimeCostDefault} € initial`}
                        {comp.recurringMonthlyCostDefault > 0 &&
                          ` + ${comp.recurringMonthlyCostDefault} €/mois`}
                      </div>
                    )}
                  </div>

                  {/* Inclusion Toggle Button */}
                  <button
                    type="button"
                    onClick={() => handleOpenOverride(comp.id, isSelected)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-neutral-800 text-cyan-300 border border-neutral-700 hover:bg-neutral-700'
                        : 'bg-neutral-950 text-neutral-400 border border-neutral-800 hover:text-white'
                    }`}
                  >
                    {isSelected ? (
                      <>
                        <ToggleRight className="w-4 h-4 text-cyan-400" />
                        <span>Inclus dans le périmètre</span>
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="w-4 h-4 text-neutral-500" />
                        <span>Exclu du périmètre</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Override Reason Modal */}
      {overrideModalCompId && (
        <Modal
          isOpen={Boolean(overrideModalCompId)}
          onClose={() => setOverrideModalCompId(null)}
          title={`Surcharge de sélection : ${compMap.get(overrideModalCompId)?.name}`}
          subtitle="Toute modification manuelle doit être motivée pour garantir la traçabilité"
          maxWidth="max-w-md"
        >
          <div className="space-y-4 text-xs text-neutral-300">
            <p className="leading-relaxed">
              Vous vous apprêtez à {overrideTargetState ? 'inclure' : 'exclure'} manuellement ce composant par
              rapport à la recommandation calculée du moteur déterministe.
            </p>

            <div>
              <label className="block text-[11px] text-neutral-400 mb-1">
                Motif obligatoire de la décision dirigeant / technique :
              </label>
              <textarea
                rows={3}
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                placeholder="Ex: Demande expresse du client lors de la réunion de cadrage du 02/10..."
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-neutral-700"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => setOverrideModalCompId(null)}
                className="px-3.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-xs font-medium transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmOverride}
                className="px-3.5 py-1.5 bg-white hover:bg-neutral-100 text-neutral-950 rounded-lg text-xs font-medium transition-colors shadow-xs"
              >
                Valider la surcharge
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
