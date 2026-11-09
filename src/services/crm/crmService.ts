/**
 * NEXUS OS — Service Commercial & CRM Central
 * Gestion des entreprises, contacts décisionnaires, opportunités et interactions
 */

import { supabase, isSupabaseConfigured, localStore } from '../supabase/client';
import type {
  Company,
  Contact,
  ProspectRecord,
  InteractionRecord,
  DataLead,
  ProspectCommercialStatus,
  PriorityLevel,
} from '../supabase/types';

export class CrmService {
  /**
   * Récupère la liste de toutes les entreprises enregistrées
   */
  async getCompanies(): Promise<Company[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    }
    return localStore.getTable<Company>('companies');
  }

  /**
   * Récupère la liste de tous les prospects commerciaux actifs
   */
  async getProspects(): Promise<ProspectRecord[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('prospects')
        .select(`
          *,
          company:companies(*),
          primary_contact:contacts(*)
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    }

    // Mode Local
    const prospects = localStore.getTable<ProspectRecord>('prospects');
    const companies = localStore.getTable<Company>('companies');
    const contacts = localStore.getTable<Contact>('contacts');

    return prospects.map((p) => ({
      ...p,
      company: companies.find((c) => c.id === p.company_id),
      primary_contact: contacts.find((c) => c.id === p.primary_contact_id),
    }));
  }

  /**
   * Importation d'un lead réel collecté dans NEXUS DATA vers le CRM
   */
  async importDataLeadToCrm(
    lead: DataLead,
    campaignId?: string,
    initialStatus: ProspectCommercialStatus = 'a_qualifier',
    initialPriority: PriorityLevel = 'moyenne'
  ): Promise<{ company: Company; contact: Contact; prospect: ProspectRecord }> {
    const now = new Date().toISOString();

    // 1. Création ou détection de l'entreprise
    let company: Company;
    const existingCompanies = await this.getCompanies();
    const existingBySiren = lead.siren
      ? existingCompanies.find((c) => c.siren === lead.siren)
      : null;

    if (existingBySiren) {
      company = existingBySiren;
    } else {
      const companyData: Omit<Company, 'id'> = {
        commercial_name: lead.company_name,
        legal_name: lead.legal_name || lead.company_name,
        siren: lead.siren,
        siret: lead.siret,
        naf_code: lead.naf_code,
        sector: lead.sector,
        website: lead.website,
        standard_phone: lead.phone,
        general_email: lead.email,
        address_street: lead.address_street,
        postal_code: lead.postal_code,
        city: lead.city,
        department: lead.department,
        region: lead.region,
        latitude: lead.latitude,
        longitude: lead.longitude,
        google_maps_url: lead.maps_url,
        source_origin: lead.provenance_source,
        lead_source_id: lead.id,
        is_archived: false,
        created_at: now,
        updated_at: now,
      };

      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase
          .from('companies')
          .insert(companyData)
          .select()
          .single();
        if (error) throw error;
        company = data;
      } else {
        company = localStore.insert<Company>('companies', companyData as Company);
      }
    }

    // 2. Création du contact principal (dirigeant identifié au RCS ou Direction)
    const director = lead.legal_directors?.[0];
    const contactData: Omit<Contact, 'id'> = {
      company_id: company.id,
      first_name: director?.name ? director.name.split(' ')[0] : 'Direction',
      last_name: director?.name ? director.name.split(' ').slice(1).join(' ') : 'Générale',
      role_title: director?.role || 'Dirigeant / Gérant',
      direct_phone: lead.phone,
      email: lead.email,
      is_decision_maker: true,
      is_primary: true,
      preferred_contact_channel: 'phone',
      notes: `Vérifié au RCS : ${director?.role || 'Représentant légal'}`,
      created_at: now,
      updated_at: now,
    };

    let contact: Contact;
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('contacts')
        .insert(contactData)
        .select()
        .single();
      if (error) throw error;
      contact = data;
    } else {
      contact = localStore.insert<Contact>('contacts', contactData as Contact);
    }

    // 3. Création de l'opportunité commerciale / prospect
    const prospectData: Omit<ProspectRecord, 'id'> = {
      company_id: company.id,
      primary_contact_id: contact.id,
      status: initialStatus,
      priority: initialPriority,
      active_campaign_id: campaignId || undefined,
      needs_summary: `Acquisition via ${lead.provenance_source} · Secteur : ${lead.sector || lead.profession}`,
      is_archived: false,
      created_at: now,
      updated_at: now,
    };

    let prospect: ProspectRecord;
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('prospects')
        .insert(prospectData)
        .select()
        .single();
      if (error) throw error;
      prospect = { ...data, company, primary_contact: contact };
    } else {
      prospect = localStore.insert<ProspectRecord>('prospects', prospectData as ProspectRecord);
      prospect = { ...prospect, company, primary_contact: contact };
    }

    return { company, contact, prospect };
  }

  /**
   * Met à jour le statut commercial d'un prospect
   */
  async updateProspectStatus(id: string, status: ProspectCommercialStatus): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('prospects')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
      return;
    }
    localStore.update<ProspectRecord>('prospects', id, { status });
  }

  /**
   * Enregistre une interaction commerciale
   */
  async logInteraction(data: Omit<InteractionRecord, 'id' | 'created_at'>): Promise<InteractionRecord> {
    const now = new Date().toISOString();
    const payload = {
      ...data,
      created_at: now,
    };

    if (isSupabaseConfigured && supabase) {
      const { data: record, error } = await supabase
        .from('interactions')
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return record;
    }

    return localStore.insert<InteractionRecord>('interactions', payload as InteractionRecord);
  }

  /**
   * Récupère l'historique des interactions d'un prospect
   */
  async getProspectInteractions(prospectId: string): Promise<InteractionRecord[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('interactions')
        .select('*')
        .eq('prospect_id', prospectId)
        .order('performed_at', { ascending: false });
      if (error) throw error;
      return data || [];
    }

    return localStore
      .getTable<InteractionRecord>('interactions')
      .filter((i) => i.prospect_id === prospectId)
      .sort((a, b) => b.performed_at.localeCompare(a.performed_at));
  }
}

export const crmService = new CrmService();
