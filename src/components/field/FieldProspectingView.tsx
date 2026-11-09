import React, { useState, useEffect } from 'react';
import { fieldService } from '../../services/field/fieldService';
import { crmService } from '../../services/crm/crmService';
import type { FieldRoute, FieldVisit, ProspectRecord } from '../../services/supabase/types';
import {
  MapPin,
  Navigation,
  CheckCircle2,
  Calendar,
  Clock,
  Plus,
  Building2,
  Users,
  Compass,
  AlertCircle,
  Car,
  FileText,
  RotateCw,
  ExternalLink,
} from 'lucide-react';

export const FieldProspectingView: React.FC = () => {
  const [routes, setRoutes] = useState<FieldRoute[]>([]);
  const [prospects, setProspects] = useState<ProspectRecord[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  // Modale de création de tournée
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [newRouteName, setNewRouteName] = useState<string>('');
  const [selectedProspectIds, setSelectedProspectIds] = useState<Set<string>>(new Set());
  const [isCreating, setIsCreating] = useState<boolean>(false);

  // Modale de compte rendu de visite
  const [activeVisit, setActiveVisit] = useState<FieldVisit | null>(null);
  const [visitStatus, setVisitStatus] = useState<FieldVisit['status']>('visite_effectuee');
  const [visitNotes, setVisitNotes] = useState<string>('');
  const [isSavingVisit, setIsSavingVisit] = useState<boolean>(false);

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
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const currentRoute = routes.find((r) => r.id === selectedRouteId) || routes[0] || null;

  // Créer une tournée
  const handleCreateRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRouteName.trim() || selectedProspectIds.size === 0) return;

    setIsCreating(true);
    try {
      const toVisit = prospects.filter((p) => selectedProspectIds.has(p.id));
      const created = await fieldService.createFieldRoute(newRouteName.trim(), toVisit);
      await loadData();
      setSelectedRouteId(created.id);
      setIsCreateModalOpen(false);
      setNewRouteName('');
      setSelectedProspectIds(new Set());
    } catch (err) {
      console.error(err);
    } finally {
      setIsCreating(false);
    }
  };

  // Enregistrer le compte rendu d'une visite
  const handleSaveVisitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeVisit) return;

    setIsSavingVisit(true);
    try {
      await fieldService.logVisitResult(
        activeVisit.id,
        activeVisit.prospect_id,
        activeVisit.company_id,
        visitStatus,
        visitNotes
      );
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
      {/* En-tête Prospection Terrain */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/80 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-1">
              <Compass className="w-4 h-4 text-emerald-400" />
              <span>Canal 2 · Prospection Physique & Mobilité</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
              Prospection Terrain
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                Tournées & Visites Directes
              </span>
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Organisez vos tournées commerciales sur le terrain, déclenchez le guidage GPS et saisissez instantanément vos comptes rendus de visite.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-lg shadow-emerald-600/20 cursor-pointer transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Nouvelle Tournée</span>
          </button>
        </div>
      </div>

      {/* Sélecteur de Tournée */}
      {routes.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {routes.map((route) => (
            <button
              key={route.id}
              onClick={() => setSelectedRouteId(route.id)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap flex items-center gap-2 cursor-pointer transition-colors ${
                currentRoute?.id === route.id
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Car className="w-3.5 h-3.5" />
              <span>{route.name}</span>
              <span className="px-1.5 py-0.5 rounded bg-black/30 text-[10px]">
                {route.visits?.length || 0} visite(s)
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Contenu de la tournée sélectionnée */}
      {currentRoute ? (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xs px-2.5 py-1 rounded-md bg-slate-800 text-slate-200 border border-slate-700 font-mono">
                Date : {currentRoute.date}
              </span>
              <span className="text-xs text-slate-400">
                Statut : <strong className="text-emerald-400 capitalize">{currentRoute.status}</strong>
              </span>
            </div>
            <div className="text-xs text-slate-300">
              Durée estimée : ~{currentRoute.estimated_duration_minutes} minutes
            </div>
          </div>

          {/* Liste des Établissements à Visiter */}
          <div className="space-y-3">
            {currentRoute.visits && currentRoute.visits.length > 0 ? (
              currentRoute.visits.map((visit, index) => {
                const navUrl = visit.gps_lat && visit.gps_lng
                  ? `https://www.google.com/maps/dir/?api=1&destination=${visit.gps_lat},${visit.gps_lng}`
                  : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                      `${visit.company?.address_street || ''} ${visit.company?.city || ''}`
                    )}`;

                return (
                  <div
                    key={visit.id}
                    className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center font-bold text-sm shrink-0">
                        {index + 1}
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-base">
                          {visit.company?.commercial_name || 'Établissement'}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-slate-300 mt-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            {visit.company?.address_street}, {visit.company?.postal_code}{' '}
                            {visit.company?.city}
                          </span>
                        </div>
                        {visit.report_notes && (
                          <div className="mt-2 text-xs text-slate-300 bg-slate-800/80 p-2 rounded-lg border border-slate-700">
                            <strong>Dernier compte rendu :</strong> {visit.report_notes}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={navUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 bg-blue-600/30 hover:bg-blue-600/50 border border-blue-500/40 text-blue-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <Navigation className="w-3.5 h-3.5" />
                        <span>GPS / Itinéraire</span>
                      </a>

                      <button
                        type="button"
                        onClick={() => {
                          setActiveVisit(visit);
                          setVisitStatus(visit.status);
                          setVisitNotes(visit.report_notes || '');
                        }}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Compte Rendu</span>
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-xl text-slate-400 text-sm">
                Aucune étape dans cette tournée.
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-xl">
          <Car className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white">Aucune tournée terrain créée</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            Sélectionnez des entreprises qualifiées dans le CRM pour construire votre première tournée d'interventions physiques.
          </p>
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Créer une Tournée</span>
          </button>
        </div>
      )}

      {/* Modal Création Tournée */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-white mb-4">Créer une Tournée Terrain</h3>
            <form onSubmit={handleCreateRoute} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Nom de la tournée
                </label>
                <input
                  type="text"
                  required
                  value={newRouteName}
                  onChange={(e) => setNewRouteName(e.target.value)}
                  placeholder="Ex: Tournée PME Lyon Ouest"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-2">
                  Sélectionnez les entreprises à visiter ({selectedProspectIds.size} sélectionnée(s))
                </label>
                <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                  {prospects.map((p) => {
                    const isChecked = selectedProspectIds.has(p.id);
                    return (
                      <label
                        key={p.id}
                        className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer text-xs transition-colors ${
                          isChecked
                            ? 'bg-emerald-950/40 border-emerald-600 text-white'
                            : 'bg-slate-800/80 border-slate-700 text-slate-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            setSelectedProspectIds((prev) => {
                              const next = new Set(prev);
                              if (next.has(p.id)) next.delete(p.id);
                              else next.add(p.id);
                              return next;
                            });
                          }}
                          className="rounded text-emerald-600 focus:ring-0 bg-slate-900 border-slate-600"
                        />
                        <div className="flex-1">
                          <strong className="text-white block">
                            {p.company?.commercial_name}
                          </strong>
                          <span className="text-[11px] text-slate-400">
                            {p.company?.city} · {p.company?.address_street}
                          </span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isCreating || selectedProspectIds.size === 0}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-2"
                >
                  {isCreating ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>Valider la Tournée</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Compte Rendu de Visite */}
      {activeVisit && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <h3 className="text-lg font-bold text-white mb-2">
              Compte Rendu de Visite : {activeVisit.company?.commercial_name}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              {activeVisit.company?.address_street}, {activeVisit.company?.city}
            </p>

            <form onSubmit={handleSaveVisitReport} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Résultat de la visite
                </label>
                <select
                  value={visitStatus}
                  onChange={(e) => setVisitStatus(e.target.value as any)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                >
                  <option value="visite_effectuee">Visite effectuée / Échange avec dirigeant</option>
                  <option value="rdv_obtenu">Rendez-vous de cadrage obtenu</option>
                  <option value="absent">Dirigeant absent</option>
                  <option value="ferme">Établissement fermé</option>
                  <option value="refus">Refus catégorique</option>
                  <option value="a_revisiter">À revisiter plus tard</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Notes & Observations sur place
                </label>
                <textarea
                  rows={4}
                  value={visitNotes}
                  onChange={(e) => setVisitNotes(e.target.value)}
                  placeholder="Points abordés, organisation visible, nom du responsable rencontré..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm text-white focus:outline-none"
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
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2"
                >
                  {isSavingVisit ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>Enregistrer le Compte Rendu</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
