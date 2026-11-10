import React, { useState, useEffect } from 'react';
import { fieldService } from '../../services/field/fieldService';
import { crmService } from '../../services/crm/crmService';
import type { FieldRoute, FieldVisit, ProspectRecord, FieldSession, OfflineSyncQueueItem } from '../../services/supabase/types';
import { localStore } from '../../services/supabase/client';
import {
  Compass,
  MapPin,
  Navigation,
  Car,
  CheckCircle2,
  Clock,
  Calendar,
  Plus,
  Play,
  Pause,
  StopCircle,
  Wifi,
  WifiOff,
  CloudOff,
  CloudCheck,
  RotateCw,
  Building2,
  Users,
  AlertCircle,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';

export const NexusFieldView: React.FC = () => {
  const [routes, setRoutes] = useState<FieldRoute[]>([]);
  const [prospects, setProspects] = useState<ProspectRecord[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  // Session Terrain Active
  const [fieldSessionStatus, setFieldSessionStatus] = useState<FieldSession['status']>('planned');
  const [sessionDurationMinutes, setSessionDurationMinutes] = useState<number>(0);

  // Mode Hors-Connexion & Queue de Synchronisation Différée
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [pendingSyncItems, setPendingSyncItems] = useState<OfflineSyncQueueItem[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Modale Compte Rendu Mobile
  const [activeVisit, setActiveVisit] = useState<FieldVisit | null>(null);
  const [visitStatus, setVisitStatus] = useState<FieldVisit['status']>('visite_effectuee');
  const [visitNotes, setVisitNotes] = useState<string>('');
  const [isSavingVisit, setIsSavingVisit] = useState<boolean>(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  // Modale Création Tournée
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [newRouteName, setNewRouteName] = useState<string>('');
  const [selectedProspectIds, setSelectedProspectIds] = useState<Set<string>>(new Set());

  const loadData = async () => {
    setLoading(true);
    try {
      const [allRoutes, allProspects] = await Promise.all([
        fieldService.getFieldRoutes(),
        crmService.getProspects(),
      ]);
      setRoutes(allRoutes);
      setProspects(allProspects);
      if (allRoutes.length > 0 && !selectedRouteId) {
        setSelectedRouteId(allRoutes[0].id);
      }

      // Charger la file de synchronisation hors-ligne
      const syncQueue = localStore.getTable<OfflineSyncQueueItem>('offline_sync_queue');
      setPendingSyncItems(syncQueue.filter((i) => i.status === 'pending'));
    } catch (err) {
      console.error('[NEXUS FIELD] Load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const currentRoute = routes.find((r) => r.id === selectedRouteId) || routes[0] || null;

  // Calculs métriques de la tournée
  const totalStops = currentRoute?.visits?.length || 0;
  const completedStops = currentRoute?.visits?.filter((v) => v.status !== 'a_visiter').length || 0;
  const progressPercent = totalStops > 0 ? Math.round((completedStops / totalStops) * 100) : 0;

  // Déclencher la synchronisation des données différées
  const handleSyncPending = async () => {
    if (pendingSyncItems.length === 0) return;
    setIsSyncing(true);
    try {
      // Exécute chaque élément de la queue
      for (const item of pendingSyncItems) {
        if (item.entity_type === 'field_visit') {
          await fieldService.logVisitResult(
            item.entity_id,
            item.payload.prospectId,
            item.payload.companyId,
            item.payload.status,
            item.payload.notes
          );
        }
      }

      // Marquer comme synchronisé
      localStore.setTable('offline_sync_queue', []);
      setPendingSyncItems([]);
      setSyncFeedback('Toutes les visites hors-connexion ont été synchronisées avec succès !');
      await loadData();
    } catch (err) {
      console.error('[SYNC ENGINE] Error:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Enregistrer le compte rendu (Online ou Offline)
  const handleSaveVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeVisit) return;
    setIsSavingVisit(true);

    try {
      if (isOnline) {
        await fieldService.logVisitResult(
          activeVisit.id,
          activeVisit.prospect_id,
          activeVisit.company_id,
          visitStatus,
          visitNotes
        );
        setSyncFeedback(`Visite enregistrée en direct sur le CRM !`);
      } else {
        // Enregistrement différé dans la file de sync locale
        const offlineItem: OfflineSyncQueueItem = {
          id: `sync_${Date.now()}`,
          entity_type: 'field_visit',
          entity_id: activeVisit.id,
          action: 'UPDATE',
          payload: {
            prospectId: activeVisit.prospect_id,
            companyId: activeVisit.company_id,
            status: visitStatus,
            notes: visitNotes,
          },
          status: 'pending',
          created_at: new Date().toISOString(),
        };
        localStore.insert('offline_sync_queue', offlineItem);
        setPendingSyncItems((prev) => [...prev, offlineItem]);
        setSyncFeedback('Visite enregistrée localement (Hors-ligne). Synchronisation dès retour du réseau.');
      }

      await loadData();
      setActiveVisit(null);
      setVisitNotes('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingVisit(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête NEXUS FIELD */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/80 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-400 mb-1">
              <Compass className="w-4 h-4 text-teal-400" />
              <span>Addendum 3 · Espace Opérationnel de Prospection Terrain</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
              NEXUS FIELD
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40">
                Tournées & Mode Tactile Mobile
              </span>
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Cartographie des établissements, guidage GPS Waze/Maps, comptes rendus sur place et synchronisation hors-connexion sécurisée.
            </p>
          </div>

          {/* Indicateur de Connectivité & Synchronisation Hors-Ligne */}
          <div className="flex items-center gap-2.5 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2 text-xs">
              {isOnline ? (
                <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                  <Wifi className="w-3.5 h-3.5" />
                  <span>En Ligne</span>
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-amber-400 font-semibold">
                  <WifiOff className="w-3.5 h-3.5" />
                  <span>Hors-Ligne (Cache Actif)</span>
                </span>
              )}
            </div>

            {pendingSyncItems.length > 0 && (
              <button
                type="button"
                onClick={handleSyncPending}
                disabled={!isOnline || isSyncing}
                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                {isSyncing ? <RotateCw className="w-3 h-3 animate-spin" /> : <CloudOff className="w-3 h-3" />}
                <span>Synchroniser ({pendingSyncItems.length})</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Métriques d'Avancement de la Tournée */}
      {currentRoute && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <span className="text-[11px] text-slate-400 block">Total Visites Prévues</span>
            <span className="text-2xl font-bold text-white font-mono">{totalStops}</span>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <span className="text-[11px] text-slate-400 block">Visites Effectuées</span>
            <span className="text-2xl font-bold text-teal-400 font-mono">{completedStops}</span>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <span className="text-[11px] text-slate-400 block">Progression Tournée</span>
            <span className="text-2xl font-bold text-emerald-400 font-mono">{progressPercent}%</span>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <span className="text-[11px] text-slate-400 block">Temps Estimé</span>
            <span className="text-2xl font-bold text-purple-400 font-mono">
              ~{currentRoute.estimated_duration_minutes || 90}m
            </span>
          </div>
        </div>
      )}

      {/* FEEDBACK SYNC */}
      {syncFeedback && (
        <div className="p-3 bg-emerald-950/40 border border-emerald-800 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{syncFeedback}</span>
        </div>
      )}

      {/* LISTE CHRONOLOGIQUE DES ÉTAPES DE LA TOURNÉE */}
      {currentRoute && (
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-1">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Car className="w-4 h-4 text-teal-400" />
              <span>Itinéraire Ordonné : {currentRoute.name}</span>
            </h3>
            <span className="text-xs text-slate-400">Date : {currentRoute.date}</span>
          </div>

          {(currentRoute.visits || []).map((visit, index) => {
            const gpsTarget = visit.gps_lat && visit.gps_lng
              ? `${visit.gps_lat},${visit.gps_lng}`
              : encodeURIComponent(`${visit.company?.address_street || ''} ${visit.company?.city || ''}`);
            const wazeUrl = `https://waze.com/ul?q=${gpsTarget}&navigate=yes`;
            const gmapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${gpsTarget}`;

            const isCompleted = visit.status !== 'a_visiter';

            return (
              <div
                key={visit.id}
                className={`border rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
                  isCompleted
                    ? 'bg-slate-900/60 border-slate-800 opacity-90'
                    : 'bg-slate-900 border-teal-500/40 shadow-lg shadow-teal-500/5'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 border ${
                      isCompleted
                        ? 'bg-slate-800 border-slate-700 text-slate-400'
                        : 'bg-teal-500/20 border-teal-500/50 text-teal-300'
                    }`}
                  >
                    {index + 1}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-bold text-white">
                        {visit.company?.commercial_name}
                      </h4>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                        SIREN {visit.company?.siren}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-300 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        {visit.company?.address_street}, {visit.company?.postal_code}{' '}
                        {visit.company?.city}
                      </span>
                    </div>

                    {visit.report_notes && (
                      <div className="mt-2 text-xs text-slate-300 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                        <strong className="text-teal-400">Compte Rendu :</strong> {visit.report_notes}
                      </div>
                    )}
                  </div>
                </div>

                {/* Boutons d'action tactile (Mobile Friendly) */}
                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={gmapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Guidage GPS</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveVisit(visit);
                      setVisitStatus(visit.status === 'a_visiter' ? 'visite_effectuee' : visit.status);
                      setVisitNotes(visit.report_notes || '');
                    }}
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md shadow-teal-600/20 transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Pointer Visite</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Compte Rendu Mobile Tactile */}
      {activeVisit && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <h3 className="text-lg font-bold text-white mb-1">
              Compte Rendu sur Place : {activeVisit.company?.commercial_name}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              {activeVisit.company?.address_street}, {activeVisit.company?.city}
            </p>

            <form onSubmit={handleSaveVisit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Résultat de l'intervention :
                </label>
                <select
                  value={visitStatus}
                  onChange={(e) => setVisitStatus(e.target.value as any)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none"
                >
                  <option value="visite_effectuee">Visite effectuée / Échange avec dirigeant</option>
                  <option value="rdv_obtenu">Rendez-vous de cadrage 45 min obtenu</option>
                  <option value="absent">Dirigeant absent</option>
                  <option value="ferme">Établissement fermé / Chantier</option>
                  <option value="refus">Refus catégorique</option>
                  <option value="a_revisiter">À revisiter lors de la prochaine tournée</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Notes de Visite (Dictée vocale ou texte) :
                </label>
                <textarea
                  rows={4}
                  value={visitNotes}
                  onChange={(e) => setVisitNotes(e.target.value)}
                  placeholder="Notes sur les locaux, le matériel, le nom du responsable..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActiveVisit(null)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs"
                >
                  Fermer
                </button>
                <button
                  type="submit"
                  disabled={isSavingVisit}
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-bold flex items-center gap-2"
                >
                  {isSavingVisit ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>Valider le Compte Rendu</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
