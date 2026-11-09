/**
 * NEXUS OS — Service Phoning & Campagnes de Prospection
 * Gestion de la file d'appels, des scripts, objections et comptes rendus rapides
 */

import { supabase, isSupabaseConfigured, localStore } from '../supabase/client';
import { crmService } from '../crm/crmService';
import type {
  Campaign,
  CommercialScript,
  ObjectionRecord,
  ProspectRecord,
  TaskRecord,
  ProspectCommercialStatus,
  PriorityLevel,
} from '../supabase/types';

export interface LogCallParams {
  prospectId: string;
  companyId: string;
  contactId?: string;
  campaignId?: string;
  callResult: string;
  summary: string;
  notes?: string;
  durationMinutes?: number;
  newStatus?: ProspectCommercialStatus;
  createFollowupTask?: boolean;
  followupDate?: string;
  followupPriority?: PriorityLevel;
}

export class PhoningService {
  /**
   * Récupère la liste des campagnes
   */
  async getCampaigns(): Promise<Campaign[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    }

    const campaigns = localStore.getTable<Campaign>('campaigns');
    if (campaigns.length === 0) {
      // Seed initial local campaign if empty
      const defaultCampaign: Campaign = {
        id: 'camp_def_01',
        name: 'Campagne Cadrage 45 min — Dirigeants PME',
        objective: 'Détecter les goulots d’étranglement et proposer un cadrage exécutif de 45 min',
        channel: 'phone',
        status: 'active',
        target_sector: 'Cabinets & Entreprises B2B',
        target_location: 'France entière',
        target_count: 50,
        start_date: new Date().toISOString().split('T')[0],
        branch_name: 'NEXUS Premium Solutions',
        priority: 'haute',
        notes: 'Campagne prioritaire d’acquisition commerciale',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      localStore.insert('campaigns', defaultCampaign);
      return [defaultCampaign];
    }
    return campaigns;
  }

  /**
   * Récupère la file d'attente d'appels pour une campagne ou globale
   */
  async getCallQueue(campaignId?: string): Promise<ProspectRecord[]> {
    const prospects = await crmService.getProspects();
    return prospects.filter((p) => {
      if (p.is_archived) return false;
      if (p.status === 'gagne' || p.status === 'perdu' || p.status === 'ne_plus_contacter') return false;
      if (campaignId && campaignId !== 'all') {
        return p.active_campaign_id === campaignId;
      }
      return true;
    });
  }

  /**
   * Enregistre le résultat d'un appel avec création automatique de relance
   */
  async logCall(params: LogCallParams): Promise<{ interactionId: string; taskId?: string }> {
    // 1. Enregistrement de l'interaction
    const interaction = await crmService.logInteraction({
      prospect_id: params.prospectId,
      company_id: params.companyId,
      contact_id: params.contactId,
      channel: 'phone',
      result: params.callResult,
      summary: params.summary,
      notes: params.notes,
      duration_minutes: params.durationMinutes || 1,
      performed_at: new Date().toISOString(),
    });

    // 2. Mise à jour du statut commercial si spécifié
    if (params.newStatus) {
      await crmService.updateProspectStatus(params.prospectId, params.newStatus);
    }

    // 3. Création automatique de la tâche de relance si demandée
    let createdTaskId: string | undefined;
    if (params.createFollowupTask && params.followupDate) {
      const taskData: Omit<TaskRecord, 'id' | 'created_at' | 'updated_at'> = {
        prospect_id: params.prospectId,
        company_id: params.companyId,
        title: `Relance suite à appel [${params.callResult}]`,
        description: params.notes || params.summary,
        due_date: params.followupDate,
        priority: params.followupPriority || 'haute',
        status: 'todo',
        task_type: 'relance_tel',
      };

      if (isSupabaseConfigured && supabase) {
        const { data: task, error } = await supabase
          .from('tasks')
          .insert(taskData)
          .select()
          .single();
        if (!error && task) createdTaskId = task.id;
      } else {
        const task = localStore.insert<TaskRecord>('tasks', taskData as TaskRecord);
        createdTaskId = task.id;
      }
    }

    return { interactionId: interaction.id, taskId: createdTaskId };
  }

  /**
   * Récupère la bibliothèque d'objections commerciales
   */
  async getObjections(): Promise<ObjectionRecord[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('objections')
        .select('*')
        .eq('is_active', true);
      if (error) throw error;
      return data || [];
    }

    const localObjections = localStore.getTable<ObjectionRecord>('objections');
    if (localObjections.length === 0) {
      const defaultObjections: ObjectionRecord[] = [
        {
          id: 'obj_01',
          category: 'Barrage standard',
          title: 'C’est à quel sujet ? / Il n’est pas disponible',
          rebuttal: 'Bonjour, c’est à propos du développement et de la digitalisation opérationnelle de votre établissement. C’est le dirigeant qui prend les arbitrages sur ce sujet. Est-il joignable en fin de matinée ou préférez-vous que je rappelle vers 14h ?',
          counter_questions: ['Est-il sur place aujourd’hui ?', 'Quel est le moment le plus calme pour échanger 2 minutes ?'],
          is_active: true,
          created_at: new Date().toISOString(),
        },
        {
          id: 'obj_02',
          category: 'Temps',
          title: 'Je n’ai pas le temps en ce moment',
          rebuttal: 'Je comprends parfaitement, vous êtes en plein dans les opérations. C’est justement pour cela qu’on propose un échange de cadrage ultra-concentré de 45 minutes sans engagement, pour identifier immédiatement où vous perdez du temps et des opportunités.',
          counter_questions: ['Sur quel dossier passez-vous le plus de temps actuellement ?', 'Si on pouvait vous libérer 5h par semaine, cela vaudrait-il 30 minutes de discussion ?'],
          is_active: true,
          created_at: new Date().toISOString(),
        },
        {
          id: 'obj_03',
          category: 'Budget',
          title: 'Nous n’avons pas de budget pour cela',
          rebuttal: 'Je ne vous appelle pas pour vous vendre une prestation à l’aveugle. Notre approche chez NEXUS Premium Solutions consiste d’abord à auditer vos points de friction. Si notre intervention ne génère pas un retour sur investissement mesurable, nous ne travaillons pas ensemble.',
          counter_questions: ['Quel budget aviez-vous alloué à votre acquisition client cette année ?', 'Quels sont vos objectifs de croissance pour les 6 prochains mois ?'],
          is_active: true,
          created_at: new Date().toISOString(),
        },
        {
          id: 'obj_04',
          category: 'Concurrence',
          title: 'Nous avons déjà quelqu’un qui gère ça',
          rebuttal: 'C’est une excellente chose. La plupart de nos clients avaient également un prestataire historique. Notre valeur ajoutée chez NEXUS n’est pas de remplacer ce qui fonctionne, mais d’apporter une sur-couche d’ingénierie et d’automatisation que les prestataires classiques ne couvrent pas.',
          counter_questions: ['Êtes-vous pleinement satisfait des résultats concrets générés ?', 'Avez-vous une visibilité claire sur votre ROI ?'],
          is_active: true,
          created_at: new Date().toISOString(),
        },
        {
          id: 'obj_05',
          category: 'Email de barrage',
          title: 'Envoyez-moi un email, je regarderai',
          rebuttal: 'Avec plaisir ! Mais pour que je vous envoie un document réellement utile et sur-mesure pour votre structure plutôt qu’une plaquette générique qui ira à la corbeille, quel est votre défi majeur en ce moment : la rentabilité ou le flux de nouveaux clients ?',
          counter_questions: ['À quelle adresse directe puis-je vous l’adresser ?', 'Puis-je vous rappeler jeudi à 11h après lecture ?'],
          is_active: true,
          created_at: new Date().toISOString(),
        },
      ];
      localObjections.forEach((o) => localStore.insert('objections', o));
      return defaultObjections;
    }
    return localObjections;
  }
}

export const phoningService = new PhoningService();
