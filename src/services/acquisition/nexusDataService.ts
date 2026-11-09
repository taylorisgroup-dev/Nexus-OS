/**
 * NEXUS OS — Service d'Acquisition & Pipeline de Données (NEXUS DATA)
 * Données réelles, vérifiées au registre officiel des entreprises (SIRENE/INSEE)
 * Zéro hallucination, traçabilité de provenance intégrale.
 */

import type { DataLead } from '../supabase/types';

export interface SearchCompaniesParams {
  query: string;
  location?: string;
  postalCode?: string;
  department?: string;
  count?: number;
}

export interface WebsiteAuditResult {
  digitalMaturity: 'Faible' | 'Moyenne' | 'Avancée';
  visibleServices: string[];
  painPoints: string[];
  nexusMeetingAngles: string[];
  detectedPhone?: string | null;
  detectedEmail?: string | null;
}

export class NexusDataService {
  /**
   * Recherche d'entreprises réelles vérifiées via le registre officiel français (SIRENE)
   */
  async searchCompanies(params: SearchCompaniesParams): Promise<{
    companies: DataLead[];
    totalFound: number;
  }> {
    const res = await fetch('/api/nexus-data/search-companies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: params.query.trim(),
        location: params.location?.trim() || '',
        postalCode: params.postalCode?.trim() || '',
        department: params.department?.trim() || '',
        count: params.count || 10,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Erreur lors de la recherche des entreprises réelles.');
    }

    const companies: DataLead[] = (data.companies || []).map((c: any) => ({
      id: c.id,
      company_name: c.companyName,
      legal_name: c.legalName,
      siren: c.siren,
      siret: c.siret,
      naf_code: c.nafCode,
      sector: c.sector,
      profession: c.profession,
      phone: c.phone,
      email: c.email,
      website: c.website,
      address_street: c.addressStreet,
      postal_code: c.postalCode,
      city: c.city,
      department: c.department,
      region: c.region,
      latitude: c.latitude,
      longitude: c.longitude,
      maps_url: c.mapsUrl,
      legal_directors: c.legalDirectors || [],
      verification_status: c.verificationStatus || 'verified_sirene',
      confidence_score: c.confidenceScore || 1.0,
      provenance_source: c.provenanceSource || 'Annuaire Officiel des Entreprises (INSEE / SIRENE)',
      is_imported_to_crm: false,
      raw_payload: c,
      created_at: new Date().toISOString(),
    }));

    return {
      companies,
      totalFound: data.totalFound || companies.length,
    };
  }

  /**
   * Audit réel du site web d'une entreprise (cadrage exécutif 45 min)
   */
  async auditCompanyWebsite(
    companyName: string,
    websiteUrl: string,
    siren?: string
  ): Promise<WebsiteAuditResult> {
    const res = await fetch('/api/nexus-data/enrich-website', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companyName, websiteUrl, siren }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Impossible d’auditer le site web de l’entreprise.');
    }

    return {
      digitalMaturity: data.audit?.digitalMaturity || 'Moyenne',
      visibleServices: data.audit?.visibleServices || [],
      painPoints: data.audit?.painPoints || [],
      nexusMeetingAngles: data.audit?.nexusMeetingAngles || [],
      detectedPhone: data.detectedPhone || null,
      detectedEmail: data.detectedEmail || null,
    };
  }

  /**
   * Algorithme de déduplication par SIREN, Nom et Ville
   */
  filterDuplicates(existingSirens: Set<string>, newLeads: DataLead[]): {
    uniqueLeads: DataLead[];
    duplicateCount: number;
  } {
    let duplicateCount = 0;
    const uniqueLeads: DataLead[] = [];

    for (const lead of newLeads) {
      if (lead.siren && existingSirens.has(lead.siren)) {
        duplicateCount++;
      } else {
        uniqueLeads.push(lead);
      }
    }

    return { uniqueLeads, duplicateCount };
  }
}

export const nexusDataService = new NexusDataService();
