import React from 'react';
import { useData } from '../../context/DataContext';
import {
  Users,
  Briefcase,
  Layers,
  CheckCircle2,
  Clock,
  ArrowRight,
  AlertCircle,
  PlusCircle,
  Calendar,
  Check,
  Sliders,
  FileText,
  GitBranch,
  Cpu,
  ShieldCheck,
  PhoneCall,
  Zap,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import type { ActiveSection } from '../../types/nexus';
import { NexusBanner } from '../brand/NexusBanner';

interface CockpitViewProps {
  onNavigate: (section: ActiveSection) => void;
  onOpenCreateTask: () => void;
}

export const CockpitView: React.FC<CockpitViewProps> = ({
  onNavigate,
  onOpenCreateTask,
}) => {
  const { kpis, tasks, toggleTaskStatus, branches, automations, inAppAlerts, phoningCampaigns } = useData();

  const todayDateStr = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Welcome & Dark Ambiance Hero Banner */}
      <NexusBanner
        title="Cockpit NEXUS Premium Solutions"
        subtitle="Partenaire d’ingénierie d’affaires et de digitalisation. Analyse des besoins avant orchestration des solutions adaptées."
        showMotto={true}
      />

      {/* Plan d'action direct & Démarrage Express */}
      <div className="bg-gradient-to-r from-neutral-900 via-neutral-900 to-neutral-950 border border-neutral-800 rounded-2xl p-6 space-y-5 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800 uppercase tracking-wider">
                Poste de Prospection & Ventes Actif
              </span>
              <span className="text-[11px] text-neutral-400 font-mono">
                100% opérationnel · Scraping en temps réel
              </span>
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight mt-1">
              Démarrage Rapide : De l'acquisition au rendez-vous en 3 étapes
            </h2>
            <p className="text-xs text-neutral-300 mt-0.5">
              Acquérez des entreprises réelles, composez au poste phoning concentré, et convertissez en rendez-vous de cadrage.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate('campaigns')}
              className="px-5 py-2.5 bg-white hover:bg-neutral-100 text-neutral-950 font-bold rounded-xl text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer"
            >
              <Layers className="w-4 h-4 text-cyan-600" />
              <span>Créer une Campagne & Scraper</span>
            </button>
          </div>
        </div>

        {/* 3 Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Step 1 */}
          <div
            onClick={() => onNavigate('campaigns')}
            className="p-4 bg-neutral-950/70 border border-neutral-800/80 hover:border-cyan-500/50 rounded-xl transition-all cursor-pointer space-y-2 group"
          >
            <div className="flex items-center justify-between">
              <div className="w-7 h-7 rounded-lg bg-cyan-950/80 border border-cyan-800 text-cyan-300 flex items-center justify-center font-bold font-mono text-xs">
                1
              </div>
              <span className="text-[10px] text-neutral-400 font-mono flex items-center gap-1 group-hover:text-cyan-400 transition-colors">
                <span>Campagnes & Scraping</span>
                <ChevronRight className="w-3 h-3" />
              </span>
            </div>
            <h3 className="font-bold text-white text-sm">1. Campagnes & Cibles Réelles</h3>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Créez votre campagne ciblée (secteur, ville, offre). Scrapez en direct des entreprises réelles avec dirigeants, téléphones directs et besoins qualifiés.
            </p>
          </div>

          {/* Step 2 */}
          <div
            onClick={() => onNavigate('phoning')}
            className="p-4 bg-neutral-950/70 border border-neutral-800/80 hover:border-cyan-500/50 rounded-xl transition-all cursor-pointer space-y-2 group"
          >
            <div className="flex items-center justify-between">
              <div className="w-7 h-7 rounded-lg bg-blue-950/80 border border-blue-800 text-blue-300 flex items-center justify-center font-bold font-mono text-xs">
                2
              </div>
              <span className="text-[10px] text-neutral-400 font-mono flex items-center gap-1 group-hover:text-cyan-400 transition-colors">
                <span>Ouvrir le poste</span>
                <ChevronRight className="w-3 h-3" />
              </span>
            </div>
            <h3 className="font-bold text-white text-sm">2. Appeler au Poste Phoning</h3>
            <p className="text-xs text-neutral-300 leading-relaxed">
              File d'appels ciblée, numéro à composer en 1 clic, guide vivant par étapes sans texte rigide, et bibliothèque d'objections (Comprendre → Répondre → Rebondir).
            </p>
          </div>

          {/* Step 3 */}
          <div
            onClick={() => onNavigate('tasks')}
            className="p-4 bg-neutral-950/70 border border-neutral-800/80 hover:border-cyan-500/50 rounded-xl transition-all cursor-pointer space-y-2 group"
          >
            <div className="flex items-center justify-between">
              <div className="w-7 h-7 rounded-lg bg-emerald-950/80 border border-emerald-800 text-emerald-300 flex items-center justify-center font-bold font-mono text-xs">
                3
              </div>
              <span className="text-[10px] text-neutral-400 font-mono flex items-center gap-1 group-hover:text-cyan-400 transition-colors">
                <span>Voir les relances</span>
                <ChevronRight className="w-3 h-3" />
              </span>
            </div>
            <h3 className="font-bold text-white text-sm">3. Consigner & Relancer</h3>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Enregistrez le résultat en 5 secondes (RDV pris, rappel, échange). L'historique et les tâches de relance se synchronisent automatiquement dans Firestore.
            </p>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Prospects actifs */}
        <div
          onClick={() => onNavigate('prospects')}
          className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 cursor-pointer hover:border-neutral-700 transition-colors"
        >
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-2">
            <span>Prospects Actifs</span>
            <Users className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-white">
            {kpis.activeProspects}
          </div>
          <div className="mt-2 text-[11px] text-neutral-400 flex items-center gap-1">
            <span>{kpis.proposalsSent} proposition{kpis.proposalsSent > 1 ? 's' : ''} envoyée{kpis.proposalsSent > 1 ? 's' : ''}</span>
            <span>·</span>
            <span>{kpis.wonProspects} gagné{kpis.wonProspects > 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* KPI 2: Projets en cours */}
        <div
          onClick={() => onNavigate('projects')}
          className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 cursor-pointer hover:border-neutral-700 transition-colors"
        >
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-2">
            <span>Projets en cours</span>
            <Layers className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-white">
            {kpis.activeProjects}
          </div>
          <div className="mt-2 text-[11px] text-neutral-400 flex items-center gap-1">
            <span className={kpis.blockedProjects > 0 ? 'text-amber-400' : ''}>
              {kpis.blockedProjects} bloqué{kpis.blockedProjects > 1 ? 's' : ''}
            </span>
            <span>·</span>
            <span>{kpis.deliveredProjects} livré{kpis.deliveredProjects > 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* KPI 3: Actions aujourd'hui */}
        <div
          onClick={() => onNavigate('tasks')}
          className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 cursor-pointer hover:border-neutral-700 transition-colors"
        >
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-2">
            <span>À faire aujourd'hui</span>
            <Clock className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-white">
            {kpis.todayTasks.length}
          </div>
          <div className="mt-2 text-[11px] text-neutral-400 flex items-center gap-1">
            {kpis.overdueTasksCount > 0 ? (
              <span className="text-red-400 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {kpis.overdueTasksCount} en retard
              </span>
            ) : (
              <span className="text-emerald-400">Échéances respectées</span>
            )}
          </div>
        </div>

        {/* KPI 4: Offres prêtes & Décisions */}
        <div
          onClick={() => onNavigate('offers')}
          className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 cursor-pointer hover:border-neutral-700 transition-colors"
        >
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-2">
            <span>Offres Prêtes / Actives</span>
            <Briefcase className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-white">
            {kpis.activeOffersCount}
          </div>
          <div className="mt-2 text-[11px] text-neutral-400 flex items-center gap-1">
            <span>{kpis.totalDecisionsCount} décision{kpis.totalDecisionsCount > 1 ? 's' : ''} actée{kpis.totalDecisionsCount > 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>

      {/* NEXUS Digital Configurator Banner */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 bg-cyan-950/60 border border-cyan-900/60 px-2 py-0.5 rounded">
              NEXUS Digital
            </span>
            <span className="text-xs font-semibold text-white">Configurateur Web & Documents Contractuels</span>
          </div>
          <p className="text-xs text-neutral-400 leading-relaxed max-w-2xl">
            Cadrage méthodique en 24 points, moteur de règles déterministe pour composants front & back, chiffrage transparent et génération des 4 documents en brouillon.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('configurator')}
          className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-xs font-medium transition-colors shrink-0 cursor-pointer shadow-xs"
        >
          <Sliders className="w-3.5 h-3.5 text-cyan-400" />
          <span>Accéder au configurateur</span>
          <ArrowRight className="w-3.5 h-3.5 text-neutral-400" />
        </button>
      </div>

      {/* Cockpit Steering Grid: Branches, Phoning & Automatisations */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Branches & Rapports consolidés */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-semibold text-white tracking-tight">
                  Branches & Rapports
                </h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950/80 text-blue-300 border border-blue-800">
                {branches.length} branches
              </span>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Registre des entités NEXUS (Consulting, Digital, Academy, Capital, QVT, Marque). Rapports consolidés avec dénominateurs stricts.
            </p>
          </div>

          <div className="pt-3 border-t border-neutral-800/80 flex items-center justify-between">
            <span className="text-[11px] text-neutral-500 font-mono">
              Consolidation par branche
            </span>
            <button
              type="button"
              onClick={() => onNavigate('branches_reports')}
              className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium cursor-pointer"
            >
              <span>Ouvrir les branches</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Card 2: Poste de Prospection Téléphonique */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PhoneCall className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-semibold text-white tracking-tight">
                  Prospection Téléphonique
                </h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800">
                {phoningCampaigns.filter((c) => c.status === 'Active').length} active(s)
              </span>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Poste concentré opérationnel pour NEXUS : file d'appels, guide de conversation par étapes, objections structurées et journalisation rapide.
            </p>
          </div>

          <div className="pt-3 border-t border-neutral-800/80 flex items-center justify-between">
            <span className="text-[11px] text-neutral-500 font-mono">
              Zéro appel auto · Contrôle manuel
            </span>
            <button
              type="button"
              onClick={() => onNavigate('phoning')}
              className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium cursor-pointer"
            >
              <span>Lancer le poste</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Card 3: Centre d'Automatisations Sécurisées */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-semibold text-white tracking-tight">
                  Automatisations Internes
                </h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800">
                {automations.length} règle(s)
              </span>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Règles internes sous contrôle humain strict : alertes visuelles, propositions de tâches et brouillons. Aucun envoi externe autonome.
            </p>
          </div>

          <div className="pt-3 border-t border-neutral-800/80 flex items-center justify-between">
            <span className="text-[11px] text-neutral-500 font-mono">
              {inAppAlerts.filter((a) => !a.dismissed).length} alerte(s) active(s)
            </span>
            <button
              type="button"
              onClick={() => onNavigate('automations')}
              className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium cursor-pointer"
            >
              <span>Automatisations</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: "À faire aujourd'hui" & "Prochaines actions" */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 1: À faire aujourd'hui */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-400" />
                <h2 className="text-sm font-semibold tracking-tight text-white">
                  À faire aujourd'hui
                </h2>
                <span className="text-xs text-neutral-400 font-mono">
                  ({kpis.todayTasks.length})
                </span>
              </div>
              <button
                type="button"
                onClick={onOpenCreateTask}
                className="text-xs text-neutral-300 hover:text-white flex items-center gap-1 cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Ajouter</span>
              </button>
            </div>

            <div className="mt-4 space-y-2">
              {kpis.todayTasks.length === 0 ? (
                <div className="py-8 text-center text-xs text-neutral-400 space-y-2">
                  <CheckCircle2 className="w-6 h-6 mx-auto text-emerald-400/80 mb-1" />
                  <p className="font-medium text-neutral-300">Toutes les actions du jour sont terminées.</p>
                  <p className="text-neutral-500">Aucune tâche urgente en attente.</p>
                </div>
              ) : (
                kpis.todayTasks.map((t) => (
                  <div
                    key={t.id}
                    className="p-3 bg-neutral-950/50 hover:bg-neutral-950/80 border border-neutral-800/80 rounded-lg flex items-start gap-3 transition-colors"
                  >
                    <button
                      type="button"
                      onClick={() => toggleTaskStatus(t.id, t.status)}
                      className="mt-0.5 w-4 h-4 rounded border border-neutral-600 hover:border-emerald-500 flex items-center justify-center shrink-0 cursor-pointer text-emerald-400"
                    >
                      {t.status === 'Terminé' && <Check className="w-3 h-3" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-neutral-200 truncate">{t.title}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-neutral-400">
                        {t.priority === 'Haute' && (
                          <span className="text-red-400">Priorité Haute</span>
                        )}
                        {t.priority === 'Moyenne' && (
                          <span className="text-amber-400">Priorité Moyenne</span>
                        )}
                        {t.priority === 'Basse' && (
                          <span className="text-neutral-400">Priorité Basse</span>
                        )}
                        {t.projectTitle && (
                          <>
                            <span>·</span>
                            <span className="truncate max-w-[140px]">{t.projectTitle}</span>
                          </>
                        )}
                        {t.prospectName && (
                          <>
                            <span>·</span>
                            <span className="truncate max-w-[140px]">{t.prospectName}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-neutral-800/80 flex items-center justify-between text-xs text-neutral-400">
            <span>Actions prioritaires de la journée</span>
            <button
              type="button"
              onClick={() => onNavigate('tasks')}
              className="text-white hover:underline flex items-center gap-1"
            >
              <span>Voir tout</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Section 2: Prochaines actions */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-400" />
                <h2 className="text-sm font-semibold tracking-tight text-white">
                  Prochaines actions planifiées
                </h2>
                <span className="text-xs text-neutral-400 font-mono">
                  ({kpis.upcomingTasks.length})
                </span>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              {kpis.upcomingTasks.length === 0 ? (
                <div className="py-8 text-center text-xs text-neutral-400 space-y-2">
                  <p className="font-medium text-neutral-300">Aucune action future planifiée.</p>
                  <p className="text-neutral-500">Planifiez vos prochaines étapes pour vos projets ou prospects.</p>
                </div>
              ) : (
                kpis.upcomingTasks.slice(0, 5).map((t) => (
                  <div
                    key={t.id}
                    className="p-3 bg-neutral-950/50 hover:bg-neutral-950/80 border border-neutral-800/80 rounded-lg flex items-start gap-3 transition-colors"
                  >
                    <button
                      type="button"
                      onClick={() => toggleTaskStatus(t.id, t.status)}
                      className="mt-0.5 w-4 h-4 rounded border border-neutral-600 hover:border-emerald-500 flex items-center justify-center shrink-0 cursor-pointer text-emerald-400"
                    >
                      {t.status === 'Terminé' && <Check className="w-3 h-3" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-neutral-200 truncate">{t.title}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-neutral-400">
                        {t.dueDate && (
                          <span className="font-mono text-neutral-400">
                            Échéance : {t.dueDate}
                          </span>
                        )}
                        {t.projectTitle && (
                          <>
                            <span>·</span>
                            <span className="truncate max-w-[140px]">{t.projectTitle}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-neutral-800/80 flex items-center justify-between text-xs text-neutral-400">
            <span>Ordonnancé par date d’échéance</span>
            <button
              type="button"
              onClick={() => onNavigate('tasks')}
              className="text-white hover:underline flex items-center gap-1"
            >
              <span>Accéder aux tâches</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
