import React, { useState } from 'react';
import type { Prospect, EnrichedData } from '../../types/nexus';
import { useData } from '../../context/DataContext';
import { Modal } from '../ui/Modal';
import {
  MapPin,
  Globe,
  Star,
  Users,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Phone,
  ShieldCheck,
  Building2,
  FileCheck,
  Cpu,
} from 'lucide-react';

interface ProspectEnrichmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  prospect: Prospect | null;
  onEnriched?: (enriched: EnrichedData) => void;
}

export const ProspectEnrichmentModal: React.FC<ProspectEnrichmentModalProps> = ({
  isOpen,
  onClose,
  prospect,
  onEnriched,
}) => {
  const { enrichProspect } = useData();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [enrichedData, setEnrichedData] = useState<EnrichedData | null>(
    prospect?.enrichedData || null
  );
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen || !prospect) return null;

  const handleRunEnrichment = async () => {
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/enrich-prospect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company: prospect.company,
          city: prospect.city,
          website: prospect.website,
          phone: prospect.phone,
          sector: prospect.sector,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Erreur lors de l’enrichissement');
      }

      const result: EnrichedData = {
        ...data.enrichedData,
        enrichedAt: new Date().toISOString(),
      };

      setEnrichedData(result);

      // Save directly to Firestore for this prospect
      await enrichProspect(prospect.id, result);
      setSuccessMsg('Données Google Maps et web vérifiées et enregistrées avec succès !');

      if (onEnriched) {
        onEnriched(result);
      }
    } catch (err: unknown) {
      setError((err as Error).message || 'Échec de l’enrichissement');
    } finally {
      setLoading(false);
    }
  };

  const mapsSearchUrl =
    enrichedData?.googleMapsUrl ||
    prospect.mapsUrl ||
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      `${prospect.company} ${prospect.city || ''}`
    )}`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Enrichissement & Vérification Google Maps : ${prospect.company}`}
      subtitle="Extraction en temps réel des données officielles, avis, site web et décideurs réels"
      maxWidth="max-w-3xl"
    >
      <div className="space-y-5">
        {/* Header Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-neutral-900 border border-neutral-800 rounded-xl">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-neutral-950 border border-neutral-800 flex items-center justify-center text-cyan-400">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <span>{prospect.company}</span>
                {enrichedData && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    Données Vérifiées
                  </span>
                )}
              </h4>
              <p className="text-xs text-neutral-400">
                {prospect.city || 'France'} · {prospect.sector || 'Secteur B2B'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={mapsSearchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
            >
              <MapPin className="w-3.5 h-3.5 text-red-400" />
              <span>Voir sur Google Maps</span>
              <ExternalLink className="w-3 h-3 text-neutral-500" />
            </a>

            <button
              type="button"
              onClick={handleRunEnrichment}
              disabled={loading}
              className="px-4 py-1.5 bg-white hover:bg-neutral-100 text-neutral-950 font-bold rounded-lg text-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-sm"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-600" />
                  <span>Vérification...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
                  <span>{enrichedData ? 'Actualiser l’enrichissement' : 'Lancer l’enrichissement'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Feedback banners */}
        {error && (
          <div className="p-3 bg-red-950/80 border border-red-800 rounded-lg text-red-200 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-950/80 border border-emerald-800 rounded-lg text-emerald-200 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Enriched Content or Empty Guide */}
        {!enrichedData && !loading && (
          <div className="text-center py-10 px-4 bg-neutral-950/60 border border-neutral-800/80 rounded-xl space-y-3">
            <div className="w-12 h-12 mx-auto rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-cyan-400">
              <MapPin className="w-6 h-6" />
            </div>
            <h5 className="text-sm font-bold text-white">Aucun enrichissement actif pour cette fiche</h5>
            <p className="text-xs text-neutral-400 max-w-md mx-auto leading-relaxed">
              Cliquez sur « Lancer l’enrichissement » pour interroger les données réelles Google Maps, auditer le site internet, identifier les décideurs clés et générer les angles d’attaque personnalisés pour vos appels.
            </p>
          </div>
        )}

        {enrichedData && (
          <div className="space-y-4">
            {/* Grid 1: Verification & Maps info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Address */}
              <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-xl space-y-1">
                <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider block">
                  Adresse physique vérifiée
                </span>
                <p className="text-xs font-semibold text-white">
                  {enrichedData.fullAddress || prospect.address || 'Adresse à confirmer'}
                </p>
                <div className="text-[11px] text-neutral-400 font-mono">
                  {prospect.city || ''}
                </div>
              </div>

              {/* Verified Phone */}
              <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-xl space-y-1">
                <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider block">
                  Téléphone direct vérifié
                </span>
                <p className="text-xs font-semibold text-cyan-300 font-mono">
                  {enrichedData.verifiedPhone || prospect.phone || 'Non renseigné'}
                </p>
                <span className="text-[10px] text-neutral-500 font-mono">
                  Ligne professionnelle
                </span>
              </div>

              {/* Google Maps Rating */}
              <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-xl space-y-1">
                <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider block">
                  Note & Avis Google Maps
                </span>
                <div className="flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <span className="text-xs font-bold text-white font-mono">
                    {enrichedData.googleRating ? `${enrichedData.googleRating} / 5` : 'Établissement référencé'}
                  </span>
                  {enrichedData.googleReviewCount && (
                    <span className="text-[11px] text-neutral-400 font-mono">
                      ({enrichedData.googleReviewCount} avis)
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-emerald-400 font-mono">
                  Fiche Google Business active
                </span>
              </div>
            </div>

            {/* Grid 2: Digital Audit & Maturity */}
            <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-xl space-y-3">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-cyan-400" />
                  <h5 className="text-xs font-bold text-white">Audit Digital & Stack Web</h5>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-neutral-400 font-mono">Maturité digitale :</span>
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                      enrichedData.digitalMaturity === 'Faible'
                        ? 'bg-amber-950 text-amber-300 border-amber-800'
                        : enrichedData.digitalMaturity === 'Avancée'
                        ? 'bg-blue-950 text-blue-300 border-blue-800'
                        : 'bg-neutral-800 text-neutral-300 border-neutral-700'
                    }`}
                  >
                    {enrichedData.digitalMaturity || 'Moyenne'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[10px] font-mono text-neutral-400 block mb-0.5">Statut du site :</span>
                  <p className="text-neutral-200 font-medium">
                    {enrichedData.websiteStatus || 'En ligne'}
                  </p>
                  {prospect.website && (
                    <a
                      href={prospect.website.startsWith('http') ? prospect.website : `https://${prospect.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1 mt-1 font-mono"
                    >
                      <span>{prospect.website}</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  )}
                </div>

                <div>
                  <span className="text-[10px] font-mono text-neutral-400 block mb-0.5">Technologies & Outils détectés :</span>
                  <p className="text-neutral-300 text-[11px]">
                    {enrichedData.detectedTechStack || 'Présence web standard, opportunité de modernisation.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Grid 3: Decision Makers */}
            {enrichedData.decisionMakers && enrichedData.decisionMakers.length > 0 && (
              <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-xl space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-bold text-white border-b border-neutral-800 pb-2">
                  <Users className="w-4 h-4 text-cyan-400" />
                  <span>Dirigeants & Décideurs Identifiés</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {enrichedData.decisionMakers.map((dm, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 bg-neutral-950/70 border border-neutral-800/80 rounded-lg flex items-center justify-between"
                    >
                      <div>
                        <p className="text-xs font-semibold text-white">{dm.name}</p>
                        <p className="text-[11px] text-neutral-400">{dm.role}</p>
                      </div>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300">
                        Cible d'appel
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Grid 4: Angles d'accroche NEXUS */}
            {enrichedData.nexusHooks && enrichedData.nexusHooks.length > 0 && (
              <div className="p-4 bg-gradient-to-r from-neutral-900 to-neutral-950 border border-neutral-800 rounded-xl space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-bold text-white">
                  <Sparkles className="w-4 h-4 text-red-400" />
                  <span>Angles d'Attaque & Accroches Personnalisées NEXUS</span>
                </div>

                <div className="space-y-2">
                  {enrichedData.nexusHooks.map((hook, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 bg-neutral-950/80 border border-neutral-800 rounded-lg text-xs text-neutral-300 flex items-start gap-2.5"
                    >
                      <span className="w-5 h-5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 text-[10px] font-mono font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <p className="leading-relaxed">{hook}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs font-medium transition-colors cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </Modal>
  );
};
