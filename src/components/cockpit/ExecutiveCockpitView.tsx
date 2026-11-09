import React, { useState, useEffect } from 'react';
import { crmService } from '../../services/crm/crmService';
import { phoningService } from '../../services/phoning/phoningService';
import { fieldService } from '../../services/field/fieldService';
import { outlookService } from '../../services/microsoft/outlookService';
import type { ProspectRecord, TaskRecord } from '../../services/supabase/types';
import { localStore } from '../../services/supabase/client';
import {
  Activity,
  PhoneCall,
  MapPin,
  Mail,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Users,
  Building2,
  Layers,
  Sparkles,
  Zap,
} from 'lucide-react';

interface ExecutiveCockpitViewProps {
  onNavigateToSection: (sectionKey: string) => void;
}

export const ExecutiveCockpitView: React.FC<ExecutiveCockpitViewProps> = ({
  onNavigateToSection,
}) => {
  const [prospects, setProspects] = useState<ProspectRecord[]>([]);
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    Promise.all([
      crmService.getProspects(),
      Promise.resolve(localStore.getTable<TaskRecord>('tasks')),
    ]).then(([pList, tList]) => {
      setProspects(pList);
      setTasks(tList);
      setLoading(false);
    });
  }, []);

  const todayStr = new Date().toISOString().split('T')[0];

  // Calculs métriques réels
  const totalProspects = prospects.length;
  const toQualifyCount = prospects.filter((p) => p.status === 'a_qualifier' || p.status === 'nouveau').length;
  const inDiscussionCount = prospects.filter((p) => p.status === 'premier_contact' || p.status === 'interet_identifie').length;
  const appointmentsCount = prospects.filter((p) => p.status === 'rdv_programme').length;
  const wonCount = prospects.filter((p) => p.status === 'gagne').length;

  const overdueTasks = tasks.filter((t) => t.status !== 'done' && t.due_date < todayStr);
  const todayTasks = tasks.filter((t) => t.status !== 'done' && t.due_date === todayStr);

  return (
    <div className="space-y-6">
      {/* En-tête Cockpit */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/80 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-400 mb-1">
              <Activity className="w-4 h-4 text-blue-400" />
              <span>Centre de Pilotage Exécutif & Décisionnel</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
              Cockpit NEXUS OS
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40">
                Temps Réel
              </span>
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Vue synthétique de l'activité commerciale des 3 canaux (Téléphone, Terrain, Email) et priorités du jour.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onNavigateToSection('acquisition')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-blue-600/20 cursor-pointer transition-colors"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Acquisition Immédiate</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateToSection('phoning')}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <PhoneCall className="w-3.5 h-3.5 text-emerald-400" />
              <span>Poste Phoning</span>
            </button>
          </div>
        </div>
      </div>

      {/* Règle directrice : Que dois-je faire aujourd'hui ? */}
      <div className="bg-slate-900 border border-blue-500/40 rounded-xl p-5 shadow-lg relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400">
                Recommandation Opérationnelle Prioritaire
              </span>
              <h3 className="text-base font-bold text-white mt-0.5">
                {overdueTasks.length > 0
                  ? `Vous avez ${overdueTasks.length} relance(s) en retard à débloquer en priorité.`
                  : toQualifyCount > 0
                  ? `Vous disposez de ${toQualifyCount} nouveaux prospects qualifiés prêts pour une session de phoning.`
                  : `Base commerciale à jour. Lancez une acquisition de nouvelles cibles sur NEXUS DATA.`}
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                {overdueTasks.length > 0
                  ? 'Traitez immédiatement les contacts en attente pour ne laisser filer aucune opportunité.'
                  : 'Chaque appel de cadrage 45 min augmente directement votre taux de conversion.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              if (overdueTasks.length > 0) onNavigateToSection('phoning');
              else if (toQualifyCount > 0) onNavigateToSection('phoning');
              else onNavigateToSection('acquisition');
            }}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg flex items-center gap-2 shrink-0 cursor-pointer transition-colors"
          >
            <span>Passer à l'action</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Cartes Métriques Chiffrées Réelles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Prospects Actifs</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">{totalProspects}</div>
          <div className="text-[11px] text-slate-400 mt-1">
            dont <strong className="text-blue-300">{toQualifyCount}</strong> à contacter
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>En Négociation / Échange</span>
            <TrendingUp className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">{inDiscussionCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">Opportunités en cours</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Rendez-vous Programmés</span>
            <Calendar className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-mono">{appointmentsCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">Cadrages 45 min verrouillés</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Clients Convertis</span>
            <CheckCircle2 className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-purple-300 font-mono">{wonCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">Opportunités gagnées</div>
        </div>
      </div>

      {/* Activité par Canal & Actions du Jour */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Canal 1 : Téléphone */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Canal Phoning</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                Prioritaire
              </span>
            </div>
            <h4 className="text-base font-bold text-white mb-1">Prospection Téléphonique</h4>
            <p className="text-xs text-slate-400 mb-4">
              File d'appels concentrée avec guide commercial en 5 étapes et matrice d'objections instantanée.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigateToSection('phoning')}
            className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <span>Ouvrir la Station d'Appels</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Canal 2 : Terrain */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                <span>Canal Terrain</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300">
                Mobilité
              </span>
            </div>
            <h4 className="text-base font-bold text-white mb-1">Visites Physiques</h4>
            <p className="text-xs text-slate-400 mb-4">
              Organisation de tournées géographiques, navigation GPS Waze/Maps et comptes rendus de visite.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigateToSection('field')}
            className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <span>Accéder aux Tournées</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Canal 3 : Email */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" />
                <span>Canal Email</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-300">
                Outlook 365
              </span>
            </div>
            <h4 className="text-base font-bold text-white mb-1">Prospection Numérique</h4>
            <p className="text-xs text-slate-400 mb-4">
              Campagnes d'emails personnalisés via Microsoft Graph et archivage automatique dans le CRM.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigateToSection('email')}
            className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <span>Rédiger un Email</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
