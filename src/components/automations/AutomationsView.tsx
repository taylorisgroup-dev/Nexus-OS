import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Modal } from '../ui/Modal';
import type {
  AutomationRule,
  AutomationTrigger,
  AutomationAction,
  AutomationStatus,
  AutomationLog,
} from '../../types/nexus';
import {
  Cpu,
  ShieldAlert,
  Play,
  Pause,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Plus,
  Edit2,
  Trash2,
  RotateCw,
  Bell,
  FileText,
  CheckSquare,
  Lock,
  StopCircle,
  HelpCircle,
  Eye,
  X,
  Search,
} from 'lucide-react';

export const AutomationsView: React.FC = () => {
  const {
    automations,
    automationLogs,
    inAppAlerts,
    branches,
    createAutomationRule,
    updateAutomationRule,
    deleteAutomationRule,
    toggleAutomationRuleStatus,
    emergencyStopAutomations,
    runAutomationSimulation,
    runAutomationsEvaluation,
    dismissAlert,
  } = useData();

  // Active view tab
  const [activeTab, setActiveTab] = useState<'rules' | 'logs' | 'alerts'>('rules');

  // Modal for creating/editing a rule
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null);
  const [formName, setFormName] = useState('');
  const [formTrigger, setFormTrigger] = useState<AutomationTrigger>('task_overdue');
  const [formConditions, setFormConditions] = useState('');
  const [formActionType, setFormActionType] = useState<AutomationAction>('in_app_alert');
  const [formScope, setFormScope] = useState('Transversale');
  const [formStatus, setFormStatus] = useState<AutomationStatus>('en test');
  const [formOwner, setFormOwner] = useState('Direction Opérationnelle');
  const [formDeduplication, setFormDeduplication] = useState('1 alerte par tranche de 24h');
  const [formError, setFormError] = useState<string | null>(null);

  // Simulation results modal
  const [simulationLogs, setSimulationLogs] = useState<AutomationLog[] | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evalResultNotice, setEvalResultNotice] = useState<string | null>(null);

  // Search in execution logs
  const [logFilterStatus, setLogFilterStatus] = useState<string>('all');

  const openCreateRule = () => {
    setEditingRule(null);
    setFormName('');
    setFormTrigger('task_overdue');
    setFormConditions('Tâches actives avec status != "Terminé" et dueDate < date actuelle');
    setFormActionType('in_app_alert');
    setFormScope('Transversale');
    setFormStatus('en test'); // Par défaut : en test ou brouillon
    setFormOwner('Direction Opérationnelle');
    setFormDeduplication('1 alerte par tâche par tranche de 24h');
    setFormError(null);
    setIsRuleModalOpen(true);
  };

  const openEditRule = (r: AutomationRule) => {
    setEditingRule(r);
    setFormName(r.name);
    setFormTrigger(r.trigger);
    setFormConditions(r.conditions);
    setFormActionType(r.actionType);
    setFormScope(r.scope);
    setFormStatus(r.status);
    setFormOwner(r.owner);
    setFormDeduplication(r.deduplicationLimit);
    setFormError(null);
    setIsRuleModalOpen(true);
  };

  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!formName.trim()) {
      setFormError('Le nom de la règle est obligatoire.');
      return;
    }

    const triggerLabels: Record<AutomationTrigger, string> = {
      task_overdue: 'Échéance de tâche dépassée (date < aujourd’hui & non terminée)',
      prospect_won: 'Prospect passant au statut « Gagné »',
      period_end: 'Clôture de quinzaine ou de mois calendaire',
      project_blocked: 'Projet signalé au statut Bloqué',
      manual_check: 'Vérification planifiée ou manuelle',
    };

    const actionLabels: Record<AutomationAction, string> = {
      in_app_alert: 'Notification d’alerte visuelle dans le cockpit interne',
      propose_task_checklist: 'Proposer la création des tâches de cadrage',
      prepare_draft_report: 'Préparer un brouillon de synthèse consolidée',
    };

    // Strict safety rule: new rules must start in 'brouillon' or 'en test'
    const validatedStatus: AutomationStatus =
      !editingRule && formStatus === 'active' ? 'en test' : formStatus;

    try {
      if (editingRule) {
        await updateAutomationRule(editingRule.id, {
          name: formName.trim(),
          trigger: formTrigger,
          triggerLabel: triggerLabels[formTrigger] || formTrigger,
          conditions: formConditions.trim(),
          actionType: formActionType,
          actionLabel: actionLabels[formActionType] || formActionType,
          scope: formScope,
          status: validatedStatus,
          owner: formOwner.trim(),
          deduplicationLimit: formDeduplication.trim(),
        });
      } else {
        await createAutomationRule({
          name: formName.trim(),
          trigger: formTrigger,
          triggerLabel: triggerLabels[formTrigger] || formTrigger,
          conditions: formConditions.trim(),
          actionType: formActionType,
          actionLabel: actionLabels[formActionType] || formActionType,
          scope: formScope,
          status: validatedStatus,
          owner: formOwner.trim(),
          deduplicationLimit: formDeduplication.trim(),
        });
      }
      setIsRuleModalOpen(false);
    } catch (err: unknown) {
      setFormError((err as Error).message || 'Erreur lors de la sauvegarde de la règle.');
    }
  };

  const handleRunSimulation = (ruleId?: string) => {
    const logs = runAutomationSimulation(ruleId);
    setSimulationLogs(logs);
  };

  const handleRunEvaluation = async () => {
    setIsEvaluating(true);
    try {
      const logs = await runAutomationsEvaluation();
      setEvalResultNotice(
        `Évaluation exécutée avec succès : ${logs.length} événement(s) traité(s) en conformité interne.`
      );
      setTimeout(() => setEvalResultNotice(null), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsEvaluating(false);
    }
  };

  const activeAlertsCount = inAppAlerts.filter((a) => !a.dismissed).length;

  const filteredLogs = automationLogs.filter((log) => {
    if (logFilterStatus === 'all') return true;
    return log.status === logFilterStatus;
  });

  const getStatusBadge = (st: AutomationStatus) => {
    switch (st) {
      case 'active':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-800';
      case 'en test':
        return 'bg-blue-950/80 text-blue-300 border-blue-800';
      case 'brouillon':
        return 'bg-neutral-800 text-neutral-300 border-neutral-700';
      case 'en pause':
        return 'bg-amber-950/80 text-amber-400 border-amber-800';
      default:
        return 'bg-neutral-800 text-neutral-300 border-neutral-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Strict Safeguards & Security Constitution */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-neutral-400 font-mono uppercase tracking-wider">
                NEXUS OS · Ingénierie Opérationnelle
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800">
                Garde-fous Actifs
              </span>
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight mt-0.5">
              Centre de Gestion des Automatisations Internes
            </h2>
            <p className="text-xs text-neutral-400 mt-1 max-w-3xl leading-relaxed">
              Moteur déterministe d'assistance opérationnelle. <strong>Règle d'or de sécurité :</strong>{' '}
              AUCUN appel téléphonique, courriel, message, publication, contrat, facture, paiement,
              suppression, export externe ou partage automatique. Tout reste sous supervision et validation
              humaine stricte.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={emergencyStopAutomations}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-950 hover:bg-red-900 text-red-200 border border-red-800 font-medium text-xs rounded-lg transition-colors cursor-pointer"
              title="Basculer instantanément toutes les automatisations en pause"
            >
              <StopCircle className="w-3.5 h-3.5 text-red-400" />
              <span>Arrêt d’Urgence Global</span>
            </button>

            <button
              type="button"
              onClick={() => handleRunSimulation()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 font-medium text-xs rounded-lg transition-colors cursor-pointer"
              title="Simuler les règles sans modifier aucune donnée"
            >
              <Eye className="w-3.5 h-3.5 text-cyan-400" />
              <span>Lancer Simulation Sèche</span>
            </button>

            <button
              type="button"
              onClick={handleRunEvaluation}
              disabled={isEvaluating}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 font-medium text-xs rounded-lg transition-colors cursor-pointer"
            >
              <RotateCw className={`w-3.5 h-3.5 text-emerald-400 ${isEvaluating ? 'animate-spin' : ''}`} />
              <span>Évaluer Règles Actives</span>
            </button>

            <button
              type="button"
              onClick={openCreateRule}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-neutral-100 text-neutral-950 font-medium text-xs rounded-lg transition-colors cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nouvelle Règle</span>
            </button>
          </div>
        </div>

        {evalResultNotice && (
          <div className="p-3 bg-emerald-950/80 border border-emerald-800 rounded-lg text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{evalResultNotice}</span>
          </div>
        )}

        {/* Tab Switcher */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            type="button"
            onClick={() => setActiveTab('rules')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'rules'
                ? 'bg-neutral-800 text-white border border-neutral-700 shadow-xs'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
            }`}
          >
            <Cpu className="w-3.5 h-3.5 text-blue-400" />
            <span>Règles Internes ({automations.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('alerts')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'alerts'
                ? 'bg-neutral-800 text-white border border-neutral-700 shadow-xs'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
            }`}
          >
            <Bell className="w-3.5 h-3.5 text-amber-400" />
            <span>Alertes & Propositions In-App</span>
            {activeAlertsCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono bg-red-950 text-red-300 border border-red-800 font-bold">
                {activeAlertsCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('logs')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'logs'
                ? 'bg-neutral-800 text-white border border-neutral-700 shadow-xs'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>Journal d’Exécution ({automationLogs.length})</span>
          </button>
        </div>
      </div>

      {/* TAB 1: RULES REGISTRY */}
      {activeTab === 'rules' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {automations.map((rule) => {
              return (
                <div
                  key={rule.id}
                  className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-4 hover:border-neutral-700 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-neutral-800 pb-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-white">{rule.name}</span>
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded border font-semibold ${getStatusBadge(
                            rule.status
                          )}`}
                        >
                          {rule.status.toUpperCase()}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-950 text-neutral-400 border border-neutral-800">
                          Portée : {rule.scope}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-300 leading-relaxed">
                        <strong>Déclencheur :</strong> {rule.triggerLabel}
                      </p>
                    </div>

                    {/* Status Toggle & Action Buttons */}
                    <div className="flex items-center gap-2 self-end sm:self-start">
                      <select
                        value={rule.status}
                        onChange={(e) =>
                          toggleAutomationRuleStatus(rule.id, e.target.value as AutomationStatus)
                        }
                        className="px-2 py-1 bg-neutral-950 border border-neutral-800 rounded text-xs text-neutral-200 font-mono focus:outline-none"
                      >
                        <option value="brouillon">Brouillon</option>
                        <option value="en test">En test</option>
                        <option value="active">Active</option>
                        <option value="en pause">En pause</option>
                      </select>

                      <button
                        type="button"
                        onClick={() => handleRunSimulation(rule.id)}
                        className="p-1.5 text-neutral-400 hover:text-cyan-300 rounded bg-neutral-950 border border-neutral-800 transition-colors"
                        title="Simuler cette règle"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => openEditRule(rule)}
                        className="p-1.5 text-neutral-400 hover:text-white rounded bg-neutral-950 border border-neutral-800 transition-colors"
                        title="Modifier la règle"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => deleteAutomationRule(rule.id)}
                        className="p-1.5 text-neutral-400 hover:text-red-400 rounded bg-neutral-950 border border-neutral-800 transition-colors"
                        title="Supprimer la règle"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Rule details */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-neutral-400">
                    <div className="p-3 bg-neutral-950 border border-neutral-800/80 rounded-lg space-y-1">
                      <span className="text-[10px] font-mono uppercase text-neutral-500 block">
                        Condition stricte
                      </span>
                      <p className="text-neutral-200 leading-tight">{rule.conditions}</p>
                    </div>

                    <div className="p-3 bg-neutral-950 border border-neutral-800/80 rounded-lg space-y-1">
                      <span className="text-[10px] font-mono uppercase text-neutral-500 block">
                        Action interne autorisée
                      </span>
                      <p className="text-neutral-200 leading-tight">{rule.actionLabel}</p>
                    </div>

                    <div className="p-3 bg-neutral-950 border border-neutral-800/80 rounded-lg space-y-1">
                      <span className="text-[10px] font-mono uppercase text-neutral-500 block">
                        Limite & Déduplication
                      </span>
                      <p className="text-neutral-200 leading-tight font-mono">{rule.deduplicationLimit}</p>
                    </div>
                  </div>

                  {/* Last execution results */}
                  <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-neutral-500 font-mono border-t border-neutral-800/80">
                    <div>
                      Dernier résultat :{' '}
                      <span className="text-neutral-300 font-sans">
                        {rule.lastResult || 'En attente de première exécution'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span>Exécutions : {rule.executionCount}</span>
                      <span>
                        Dernière passe :{' '}
                        {rule.lastRunAt ? new Date(rule.lastRunAt).toLocaleString('fr-FR') : 'Jamais'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: IN-APP ALERTS & PROPOSITIONS */}
      {activeTab === 'alerts' && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <div>
              <h3 className="text-sm font-semibold text-white tracking-tight">
                Alertes & Propositions d'Actions Générées
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Notifications internes non invasives soumises à la validation humaine du dirigeant.
              </p>
            </div>
            <span className="text-xs font-mono text-neutral-400">
              {activeAlertsCount} alerte(s) active(s)
            </span>
          </div>

          {activeAlertsCount === 0 ? (
            <div className="p-8 text-center text-xs text-neutral-500 space-y-1">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto" />
              <p className="text-neutral-300 font-medium">Aucune alerte interne en cours.</p>
              <p>Les règles internes surveillent le système sans générer de faux positifs.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {inAppAlerts
                .filter((a) => !a.dismissed)
                .map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-4 rounded-xl border flex items-start justify-between gap-4 transition-colors ${
                      alert.severity === 'avertissement'
                        ? 'bg-amber-950/30 border-amber-800/70 text-amber-200'
                        : alert.severity === 'critique'
                        ? 'bg-red-950/40 border-red-800 text-red-200'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-200'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <AlertTriangle
                          className={`w-4 h-4 shrink-0 ${
                            alert.severity === 'avertissement'
                              ? 'text-amber-400'
                              : alert.severity === 'critique'
                              ? 'text-red-400'
                              : 'text-blue-400'
                          }`}
                        />
                        <span className="text-xs font-bold">{alert.title}</span>
                        <span className="text-[10px] font-mono text-neutral-400">
                          {new Date(alert.timestamp).toLocaleTimeString('fr-FR')}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-300 leading-relaxed pl-6">
                        {alert.message}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => dismissAlert(alert.id)}
                      className="px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-[11px] text-neutral-200 transition-colors font-medium shrink-0 cursor-pointer"
                    >
                      Acquitter
                    </button>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: EXECUTION JOURNAL */}
      {activeTab === 'logs' && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800 pb-3">
            <div>
              <h3 className="text-sm font-semibold text-white tracking-tight">
                Journal d’Exécution & Audit des Automatisations
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Traçabilité intégrale des simulations et évaluations de règles.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-neutral-400">Statut :</span>
              <select
                value={logFilterStatus}
                onChange={(e) => setLogFilterStatus(e.target.value)}
                className="px-2.5 py-1 bg-neutral-950 border border-neutral-800 rounded text-xs text-neutral-200 font-mono focus:outline-none"
              >
                <option value="all">Tous ({automationLogs.length})</option>
                <option value="succès">Succès</option>
                <option value="avertissement">Avertissements</option>
                <option value="simulé">Simulations</option>
                <option value="erreur">Erreurs</option>
              </select>
            </div>
          </div>

          {filteredLogs.length === 0 ? (
            <div className="p-8 text-center text-xs text-neutral-500">
              Aucun événement d'exécution enregistré pour ce filtre.
            </div>
          ) : (
            <div className="divide-y divide-neutral-800/80 max-h-[500px] overflow-y-auto">
              {filteredLogs.map((log) => (
                <div key={log.id} className="py-2.5 flex items-start justify-between gap-4 text-xs">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">{log.ruleName}</span>
                      <span
                        className={`text-[9px] font-mono px-1.5 py-0.2 rounded border uppercase ${
                          log.status === 'succès'
                            ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                            : log.status === 'avertissement'
                            ? 'bg-amber-950/80 text-amber-300 border-amber-800'
                            : log.status === 'simulé'
                            ? 'bg-blue-950/80 text-blue-300 border-blue-800'
                            : 'bg-red-950 text-red-300 border-red-800'
                        }`}
                      >
                        {log.status}
                      </span>
                    </div>
                    <p className="text-neutral-300 text-[11px]">{log.summary}</p>
                    {log.details && (
                      <p className="text-[10px] text-neutral-400 font-mono">{log.details}</p>
                    )}
                  </div>

                  <span className="text-[10px] text-neutral-500 font-mono shrink-0">
                    {new Date(log.timestamp).toLocaleString('fr-FR')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL: CREATE / EDIT RULE */}
      {isRuleModalOpen && (
        <Modal
          isOpen={isRuleModalOpen}
          onClose={() => setIsRuleModalOpen(false)}
          title={editingRule ? `Modifier la Règle : ${editingRule.name}` : 'Nouvelle Règle d’Automatisation'}
          subtitle="Automatisation interne déterministe avec validation humaine"
          maxWidth="max-w-xl"
        >
          <form onSubmit={handleSaveRule} className="space-y-4 text-xs text-neutral-300">
            {formError && (
              <div className="p-3 bg-red-950/80 border border-red-800 text-red-300 rounded-lg">
                {formError}
              </div>
            )}

            <div>
              <label className="block text-[11px] text-neutral-400 mb-1">
                Nom de la règle <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Ex: Alerte sur échéance dépassée..."
                className="w-full px-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded text-xs text-neutral-200 focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">
                  Déclencheur (Trigger) <span className="text-red-400">*</span>
                </label>
                <select
                  value={formTrigger}
                  onChange={(e) => setFormTrigger(e.target.value as AutomationTrigger)}
                  className="w-full px-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded text-xs text-neutral-200 focus:outline-none focus:border-cyan-400"
                >
                  <option value="task_overdue">Échéance de tâche dépassée</option>
                  <option value="prospect_won">Prospect passé au statut « Gagné »</option>
                  <option value="period_end">Fin de période / jalon de synthèse</option>
                  <option value="project_blocked">Projet signalé au statut « Bloqué »</option>
                  <option value="manual_check">Vérification manuelle déclenchée</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">
                  Action interne autorisée <span className="text-red-400">*</span>
                </label>
                <select
                  value={formActionType}
                  onChange={(e) => setFormActionType(e.target.value as AutomationAction)}
                  className="w-full px-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded text-xs text-neutral-200 focus:outline-none focus:border-cyan-400"
                >
                  <option value="in_app_alert">Alerte dans l’application (In-app)</option>
                  <option value="propose_task_checklist">Proposer une checklist de tâches</option>
                  <option value="prepare_draft_report">Préparer un brouillon de rapport</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-neutral-400 mb-1">Condition logique d’application</label>
              <input
                type="text"
                value={formConditions}
                onChange={(e) => setFormConditions(e.target.value)}
                placeholder="Ex: Tâches avec statut != Terminé et date < aujourd'hui"
                className="w-full px-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded text-xs text-neutral-200 focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">Portée de la règle</label>
                <select
                  value={formScope}
                  onChange={(e) => setFormScope(e.target.value)}
                  className="w-full px-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded text-xs text-neutral-200 focus:outline-none focus:border-cyan-400"
                >
                  <option value="Transversale">Transversale (Toutes branches)</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.name}>
                      Branche : {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">
                  État initial <span className="text-red-400">*</span>
                </label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as AutomationStatus)}
                  className="w-full px-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded text-xs text-neutral-200 focus:outline-none focus:border-cyan-400"
                >
                  <option value="en test">En test (Mode simulation sécurisé)</option>
                  <option value="brouillon">Brouillon (Non exécuté)</option>
                  <option value="en pause">En pause (Suspendu)</option>
                  {editingRule && <option value="active">Active (Exécution interne)</option>}
                </select>
                {!editingRule && (
                  <p className="text-[10px] text-neutral-500 mt-1">
                    Toute nouvelle règle commence obligatoirement « en test » ou « brouillon ».
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-neutral-400 mb-1">
                Garde-fou & Limite de déduplication
              </label>
              <input
                type="text"
                value={formDeduplication}
                onChange={(e) => setFormDeduplication(e.target.value)}
                placeholder="Ex: 1 alerte par tâche par tranche de 24h"
                className="w-full px-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded text-xs text-neutral-200 font-mono focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-3 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => setIsRuleModalOpen(false)}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-xs font-medium transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-white hover:bg-neutral-100 text-neutral-950 rounded-lg text-xs font-medium transition-colors shadow-xs"
              >
                {editingRule ? 'Enregistrer les modifications' : 'Créer la règle (en test)'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* SIMULATION RESULTS MODAL */}
      {simulationLogs && (
        <Modal
          isOpen={Boolean(simulationLogs)}
          onClose={() => setSimulationLogs(null)}
          title="Résultat de la Simulation Sèche"
          subtitle="Aperçu des déclenchements potentiels sans impact sur les données réelles"
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-blue-950/40 border border-blue-800 rounded-lg text-blue-200 text-[11px] flex items-center gap-2">
              <Eye className="w-4 h-4 text-blue-400 shrink-0" />
              <span>
                Simulation exécutée en mémoire. Aucune alerte n’a été publiée et aucune tâche n’a été créée.
              </span>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto divide-y divide-neutral-800">
              {simulationLogs.map((log) => (
                <div key={log.id} className="pt-2 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">{log.ruleName}</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-blue-950 text-blue-300 border border-blue-800">
                      SIMULÉ
                    </span>
                  </div>
                  <p className="text-neutral-300 text-[11px]">{log.summary}</p>
                  {log.details && (
                    <p className="text-[10px] text-neutral-400 font-mono bg-neutral-950 p-1.5 rounded">
                      Éléments ciblés : {log.details}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-end border-t border-neutral-800">
              <button
                type="button"
                onClick={() => setSimulationLogs(null)}
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
