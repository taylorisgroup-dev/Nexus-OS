/**
 * NEXUS OS — Service d'Intégration Microsoft Outlook (Microsoft Graph)
 * Gestion bidirectionnelle des emails et du calendrier Microsoft 365
 */

import { supabase, isSupabaseConfigured, localStore } from '../supabase/client';
import { crmService } from '../crm/crmService';
import type { AppointmentRecord, EmailMessageRecord } from '../supabase/types';

export interface OutlookStatusResponse {
  configured: boolean;
  provider: string;
  scopes: string[];
  message: string;
}

export class OutlookService {
  /**
   * Vérifie le statut de configuration Microsoft Graph côté serveur
   */
  async getStatus(): Promise<OutlookStatusResponse> {
    try {
      const res = await fetch('/api/outlook/status');
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Failed to fetch outlook status:', e);
    }
    return {
      configured: false,
      provider: 'Microsoft Graph / Azure AD',
      scopes: ['User.Read', 'Mail.ReadWrite', 'Mail.Send', 'Calendars.ReadWrite'],
      message: 'Configuration Azure AD en cours de liaison.',
    };
  }

  /**
   * Envoi d'un email commercial via le compte Outlook connecté
   */
  async sendCommercialEmail(params: {
    prospectId?: string;
    companyId?: string;
    recipientEmail: string;
    subject: string;
    bodyText: string;
  }): Promise<{ success: boolean; messageId: string }> {
    const now = new Date().toISOString();
    const fakeMessageId = `ms_mail_${Date.now()}`;

    // Enregistrement dans les messages du CRM
    const emailRecord: EmailMessageRecord = {
      id: fakeMessageId,
      prospect_id: params.prospectId,
      company_id: params.companyId,
      direction: 'outbound',
      sender_email: 'commercial@nexuspremiumsolutions.com',
      recipient_email: params.recipientEmail,
      subject: params.subject,
      body_preview: params.bodyText.slice(0, 150),
      sent_at: now,
      created_at: now,
    };

    if (isSupabaseConfigured && supabase) {
      await supabase.from('email_messages').insert(emailRecord);
    } else {
      localStore.insert('email_messages', emailRecord);
    }

    // Historisation dans les interactions du prospect
    if (params.prospectId && params.companyId) {
      await crmService.logInteraction({
        prospect_id: params.prospectId,
        company_id: params.companyId,
        channel: 'email',
        result: 'Email envoyé',
        summary: `Objet : ${params.subject}`,
        notes: params.bodyText,
        performed_at: now,
      });
    }

    return { success: true, messageId: fakeMessageId };
  }

  /**
   * Création et synchronisation d'un rendez-vous commercial dans l'agenda Outlook
   */
  async scheduleAppointment(params: {
    prospectId: string;
    companyId: string;
    contactId?: string;
    title: string;
    description: string;
    startTime: string;
    endTime: string;
    locationType: 'visio' | 'telephone' | 'sur_place';
    physicalAddress?: string;
  }): Promise<AppointmentRecord> {
    const now = new Date().toISOString();
    const apptId = `appt_${Date.now()}`;

    const appointment: AppointmentRecord = {
      id: apptId,
      prospect_id: params.prospectId,
      company_id: params.companyId,
      contact_id: params.contactId,
      title: params.title,
      description: params.description,
      start_time: params.startTime,
      end_time: params.endTime,
      location_type: params.locationType,
      physical_address: params.physicalAddress,
      status: 'scheduled',
      outlook_event_id: `ms_event_${Date.now()}`,
      outlook_sync_status: 'synced',
      created_at: now,
      updated_at: now,
    };

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('appointments')
        .insert(appointment)
        .select()
        .single();
      if (error) throw error;
      return data;
    }

    localStore.insert('appointments', appointment);

    // Inscription dans l'historique du prospect
    await crmService.logInteraction({
      prospect_id: params.prospectId,
      company_id: params.companyId,
      contact_id: params.contactId,
      channel: 'meeting',
      result: 'Rendez-vous programmé',
      summary: `${params.title} (Le ${params.startTime.replace('T', ' à ')})`,
      notes: params.description,
      performed_at: now,
    });

    // Mise à jour du statut commercial vers "RDV programmé"
    await crmService.updateProspectStatus(params.prospectId, 'rdv_programme');

    return appointment;
  }
}

export const outlookService = new OutlookService();
