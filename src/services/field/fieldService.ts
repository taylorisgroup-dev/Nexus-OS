/**
 * NEXUS OS — Service Prospection Terrain (Canal 2)
 * Organisation des tournées, géolocalisation, comptes rendus et visites physiques
 */

import { supabase, isSupabaseConfigured, localStore } from '../supabase/client';
import { crmService } from '../crm/crmService';
import type { FieldRoute, FieldVisit, ProspectRecord } from '../supabase/types';

export class FieldService {
  /**
   * Récupère la liste des tournées de prospection terrain
   */
  async getFieldRoutes(): Promise<FieldRoute[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('field_routes')
        .select(`
          *,
          visits:field_visits(
            *,
            company:companies(*),
            prospect:prospects(*)
          )
        `)
        .order('date', { ascending: false });
      if (error) throw error;
      return data || [];
    }

    const routes = localStore.getTable<FieldRoute>('field_routes');
    const visits = localStore.getTable<FieldVisit>('field_visits');
    const companies = await crmService.getCompanies();
    const prospects = await crmService.getProspects();

    return routes.map((r) => ({
      ...r,
      visits: visits
        .filter((v) => v.route_id === r.id)
        .map((v) => ({
          ...v,
          company: companies.find((c) => c.id === v.company_id),
          prospect: prospects.find((p) => p.id === v.prospect_id),
        }))
        .sort((a, b) => a.visit_order - b.visit_order),
    }));
  }

  /**
   * Crée une nouvelle tournée terrain avec ordre de visite
   */
  async createFieldRoute(
    name: string,
    prospectsToVisit: ProspectRecord[],
    date: string = new Date().toISOString().split('T')[0]
  ): Promise<FieldRoute> {
    const routeId = `route_${Date.now()}`;
    const newRoute: FieldRoute = {
      id: routeId,
      name,
      date,
      status: 'planned',
      total_distance_km: 0,
      estimated_duration_minutes: prospectsToVisit.length * 30,
      created_at: new Date().toISOString(),
      visits: [],
    };

    if (isSupabaseConfigured && supabase) {
      const { data: route, error } = await supabase
        .from('field_routes')
        .insert({
          id: routeId,
          name,
          date,
          status: 'planned',
          estimated_duration_minutes: prospectsToVisit.length * 30,
        })
        .select()
        .single();
      if (error) throw error;

      // Inscription des étapes de visite
      const visitPayloads = prospectsToVisit.map((p, idx) => ({
        route_id: routeId,
        prospect_id: p.id,
        company_id: p.company_id,
        visit_order: idx + 1,
        status: 'a_visiter',
        gps_lat: p.company?.latitude || null,
        gps_lng: p.company?.longitude || null,
      }));

      await supabase.from('field_visits').insert(visitPayloads);
      return route;
    }

    // Mode Local
    localStore.insert('field_routes', newRoute);
    prospectsToVisit.forEach((p, idx) => {
      const visit: FieldVisit = {
        id: `visit_${routeId}_${idx + 1}`,
        route_id: routeId,
        prospect_id: p.id,
        company_id: p.company_id,
        visit_order: idx + 1,
        status: 'a_visiter',
        gps_lat: p.company?.latitude,
        gps_lng: p.company?.longitude,
        created_at: new Date().toISOString(),
        company: p.company,
        prospect: p,
      };
      localStore.insert('field_visits', visit);
      newRoute.visits?.push(visit);
    });

    return newRoute;
  }

  /**
   * Enregistre le compte rendu d'une visite physique sur place
   */
  async logVisitResult(
    visitId: string,
    prospectId: string,
    companyId: string,
    status: FieldVisit['status'],
    reportNotes: string
  ): Promise<void> {
    const now = new Date().toISOString();

    // 1. Mise à jour de la visite
    if (isSupabaseConfigured && supabase) {
      await supabase
        .from('field_visits')
        .update({
          status,
          report_notes: reportNotes,
          visited_at: now,
        })
        .eq('id', visitId);
    } else {
      localStore.update<FieldVisit>('field_visits', visitId, {
        status,
        report_notes: reportNotes,
        visited_at: now,
      });
    }

    // 2. Inscription dans l'historique des interactions CRM
    await crmService.logInteraction({
      prospect_id: prospectId,
      company_id: companyId,
      channel: 'field',
      result: `Visite Terrain [${status}]`,
      summary: reportNotes.slice(0, 500) || `Visite effectuée le ${now.split('T')[0]}`,
      notes: reportNotes,
      performed_at: now,
    });
  }
}

export const fieldService = new FieldService();
