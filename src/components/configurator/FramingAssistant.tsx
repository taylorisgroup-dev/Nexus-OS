import React, { useState } from 'react';
import {
  type FramingRequirement,
  type RequirementStatus,
  type WebProjectType,
  WEB_PROJECT_TYPES,
} from '../../types/configurator';
import {
  HelpCircle,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Filter,
  Check,
  Search,
  Layers,
  ChevronDown,
} from 'lucide-react';

interface FramingAssistantProps {
  projectType: WebProjectType;
  onUpdateProjectType: (type: WebProjectType) => void;
  requirements: FramingRequirement[];
  onUpdateRequirement: (id: string, status: RequirementStatus, details?: string) => void;
  clientName: string;
  projectTitle: string;
}

export const FramingAssistant: React.FC<FramingAssistantProps> = ({
  projectType,
  onUpdateProjectType,
  requirements,
  onUpdateRequirement,
  clientName,
  projectTitle,
}) => {
  const [filterStatus, setFilterStatus] = useState<'all' | 'critical' | 'to_qualify' | 'validated' | 'excluded'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const criticalPendingCount = requirements.filter(
    (r) => r.isCritical && r.status === 'À qualifier'
  ).length;

  const validatedCount = requirements.filter((r) => r.status === 'Validée').length;
  const excludedCount = requirements.filter((r) => r.status === 'Exclue').length;
  const toQualifyCount = requirements.filter((r) => r.status === 'À qualifier').length;

  const filteredRequirements = requirements.filter((r) => {
    if (filterStatus === 'critical' && (!r.isCritical || r.status !== 'À qualifier')) return false;
    if (filterStatus === 'to_qualify' && r.status !== 'À qualifier') return false;
    if (filterStatus === 'validated' && r.status !== 'Validée') return false;
    if (filterStatus === 'excluded' && r.status !== 'Exclue') return false;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return (
        r.title.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q) ||
        r.question.toLowerCase().includes(q) ||
        (r.responseDetails || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner: Project Type Selector & Framing State */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
          <div>
            <span className="text-[11px] text-neutral-400 font-mono uppercase tracking-wider block">
              Projet : {projectTitle || 'Non assigné'} · Client : {clientName || 'À préciser'}
            </span>
            <h3 className="text-base font-semibold text-white tracking-tight mt-0.5">
              Typologie & Périmètre du Projet Web
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-400">Type de projet :</span>
            <select
              value={projectType}
              onChange={(e) => onUpdateProjectType(e.target.value as WebProjectType)}
              className="px-3 py-1.5 bg-neutral-950 border border-neutral-700 rounded-lg text-xs text-neutral-100 font-medium focus:outline-none"
            >
              {WEB_PROJECT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Framing Health Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg">
            <span className="text-[11px] text-neutral-500 block">Exigences validées</span>
            <span className="text-lg font-bold font-mono text-emerald-400">{validatedCount}</span>
            <span className="text-[10px] text-neutral-500 block mt-0.5">Composants déclenchés</span>
          </div>

          <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg">
            <span className="text-[11px] text-neutral-500 block">Exigences exclues</span>
            <span className="text-lg font-bold font-mono text-neutral-400">{excludedCount}</span>
            <span className="text-[10px] text-neutral-500 block mt-0.5">Hors périmètre</span>
          </div>

          <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg">
            <span className="text-[11px] text-neutral-500 block">À qualifier</span>
            <span className="text-lg font-bold font-mono text-neutral-300">{toQualifyCount}</span>
            <span className="text-[10px] text-neutral-500 block mt-0.5">En cours d'échange</span>
          </div>

          <div
            className={`p-3 border rounded-lg ${
              criticalPendingCount > 0
                ? 'bg-amber-950/40 border-amber-800/80 text-amber-200'
                : 'bg-neutral-950 border-neutral-800 text-neutral-400'
            }`}
          >
            <span className="text-[11px] text-neutral-400 block">Critiques en suspens</span>
            <span
              className={`text-lg font-bold font-mono ${
                criticalPendingCount > 0 ? 'text-amber-400' : 'text-emerald-400'
              }`}
            >
              {criticalPendingCount}
            </span>
            <span className="text-[10px] block mt-0.5">
              {criticalPendingCount > 0 ? 'Bloque le chiffrage ferme' : 'Aucun point bloquant'}
            </span>
          </div>
        </div>

        {criticalPendingCount > 0 && (
          <div className="p-3 bg-amber-950/30 border border-amber-900/40 rounded-lg text-xs text-amber-300/90 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed text-[11px]">
              <strong>Règle d’or NEXUS :</strong> S’il manque une réponse critique, le configurateur signale ce qui doit être validé au lieu d’en faire une hypothèse hasardeuse. Les composants correspondants ne seront chiffrés fermement qu'après validation explicite.
            </p>
          </div>
        )}
      </div>

      {/* Filter and Search Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-neutral-900 border border-neutral-800 p-3.5 rounded-xl">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filtrer les 24 exigences (ex: paiement, SEO, contenus)..."
            className="w-full pl-8 pr-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center bg-neutral-950 border border-neutral-800 rounded-lg p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setFilterStatus('all')}
            className={`px-2.5 py-1 rounded transition-colors ${
              filterStatus === 'all' ? 'bg-neutral-800 text-white font-medium' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Toutes ({requirements.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('critical')}
            className={`px-2.5 py-1 rounded transition-colors ${
              filterStatus === 'critical' ? 'bg-amber-950 text-amber-300 font-medium' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Critiques ({criticalPendingCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('validated')}
            className={`px-2.5 py-1 rounded transition-colors ${
              filterStatus === 'validated' ? 'bg-neutral-800 text-white font-medium' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Validées ({validatedCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('excluded')}
            className={`px-2.5 py-1 rounded transition-colors ${
              filterStatus === 'excluded' ? 'bg-neutral-800 text-white font-medium' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Exclues ({excludedCount})
          </button>
        </div>
      </div>

      {/* Requirements List */}
      <div className="space-y-3">
        {filteredRequirements.map((req) => {
          const isExpanded = expandedId === req.id;
          return (
            <div
              key={req.id}
              className={`p-4 rounded-xl border transition-colors ${
                req.status === 'Validée'
                  ? 'bg-neutral-900 border-neutral-800 hover:border-neutral-700'
                  : req.status === 'Exclue'
                  ? 'bg-neutral-950/40 border-neutral-900 opacity-60'
                  : req.isCritical
                  ? 'bg-neutral-900/90 border-amber-900/60'
                  : 'bg-neutral-900 border-neutral-800'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider bg-neutral-950 px-2 py-0.5 rounded border border-neutral-800">
                      {req.category}
                    </span>
                    {req.isCritical && (
                      <span className="text-[10px] text-amber-400 font-medium bg-amber-950/60 border border-amber-900/60 px-1.5 py-0.2 rounded">
                        Point critique
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-semibold text-white tracking-tight pt-0.5">{req.title}</h4>
                  <p className="text-xs text-neutral-400 leading-relaxed">{req.question}</p>
                </div>

                {/* 3-State Segmented Control */}
                <div className="flex items-center bg-neutral-950 border border-neutral-800 rounded-lg p-1 text-xs shrink-0 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => onUpdateRequirement(req.id, 'À qualifier', req.responseDetails)}
                    className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                      req.status === 'À qualifier'
                        ? 'bg-neutral-800 text-neutral-200 font-semibold shadow-xs'
                        : 'text-neutral-500 hover:text-neutral-300'
                    }`}
                  >
                    À qualifier
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateRequirement(req.id, 'Validée', req.responseDetails)}
                    className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                      req.status === 'Validée'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800 font-semibold'
                        : 'text-neutral-500 hover:text-emerald-400'
                    }`}
                  >
                    Validée
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateRequirement(req.id, 'Exclue', req.responseDetails)}
                    className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                      req.status === 'Exclue'
                        ? 'bg-neutral-800 text-neutral-400 line-through font-semibold'
                        : 'text-neutral-500 hover:text-red-400'
                    }`}
                  >
                    Exclue
                  </button>
                </div>
              </div>

              {/* Note / Detail Collapsible */}
              <div className="mt-3 pt-3 border-t border-neutral-800/80">
                <div className="flex items-center justify-between text-[11px] text-neutral-500 mb-1">
                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : req.id)}
                    className="hover:text-neutral-300 flex items-center gap-1 cursor-pointer"
                  >
                    <span>{req.responseDetails ? 'Détails client consignés' : 'Ajouter une précision / réponse client'}</span>
                    <ChevronDown className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </button>
                  {req.responseDetails && !isExpanded && (
                    <span className="text-neutral-400 truncate max-w-xs italic font-mono text-[10px]">
                      « {req.responseDetails} »
                    </span>
                  )}
                </div>

                {isExpanded && (
                  <div className="mt-2 space-y-1.5">
                    <textarea
                      rows={2}
                      value={req.responseDetails || ''}
                      onChange={(e) => onUpdateRequirement(req.id, req.status, e.target.value)}
                      placeholder="Consignez les réponses précises du client, contraintes ou attentes spécifiques..."
                      className="w-full px-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded text-xs text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-neutral-700"
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
