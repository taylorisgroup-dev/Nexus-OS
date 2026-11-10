import React, { useState, useEffect, useMemo } from 'react';
import { crmService } from '../../services/crm/crmService';
import { phoningService, type LogCallParams } from '../../services/phoning/phoningService';
import { outlookService } from '../../services/microsoft/outlookService';
import type {
  ProspectRecord,
  Campaign,
  ObjectionRecord,
  CallSession,
  ProspectCommercialStatus,
} from '../../services/supabase/types';
import { localStore } from '../../services/supabase/client';
import {
  PhoneCall,
  PhoneForwarded,
  CheckCircle2,
  Clock,
  Calendar,
  AlertTriangle,
  Users,
  Building2,
  MapPin,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Zap,
  Play,
  Pause,
  StopCircle,
  Copy,
  Check,
  Send,
  BookOpen,
  HelpCircle,
  RotateCw,
  Search,
} from 'lucide-react';

interface CallDeskViewProps {
  initialCampaignId?: string;
  onNavigateToCockpit?: () => void;
}

export const CallDeskView: React.FC<CallDeskViewProps> = ({
  initialCampaignId,
  onNavigateToCockpit,
}) => {
  const [prospects, setProspects] = useState<ProspectRecord[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [objections, setObjections] = useState<ObjectionRecord[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>(initialCampaignId || '');
  const [selectedProspectId, setSelectedProspectId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Session de Phoning Active
  const [isSessionActive, setIsSessionActive] = useState<boolean>(false);
  const [sessionDurationSeconds, setSessionDurationSeconds] = useState<number>(0);
  const [sessionCallsCount, setSessionCallsCount] = useState<number>(0);
  const [sessionAppointmentsCount, setSessionAppointmentsCount] = useState<number>(0);
  const [sessionFollowupsCount, setSessionFollowupsCount] = useState<number>(0);

  // Script & Objections Tabs
  const [deskTab, setDeskTab] = useState<'script' | 'objections' | 'notes' | 'rdv'>('script');
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const [copiedPhone, setCopiedPhone] = useState<boolean>(false);

  // Formulaire post-appel rapide (2 clics)
  const [callResult, setCallResult] = useState<string>('Échange constructif');
  const [callNotes, setCallNotes] = useState<string>('');
  const [followupDate, setFollowupDate] = useState<string>(
    new Date(Date.now() + 48 * 3600 * 1000).toISOString().split('T')[0]
  );
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitFeedback, setSubmitFeedback] = useState<string | null>(null);

  // RDV Outlook immédiat
  const [appointmentTitle, setAppointmentTitle] = useState<string>(
    'Cadrage Exécutif 45 min · NEXUS Premium Solutions'
  );
  const [appointmentDateTime, setAppointmentDateTime] = useState<string>(
    new Date(Date.now() + 48 * 3600 * 1000).toISOString().slice(0, 16)
  );

  const loadData = async () => {
    setLoading(true);
    try {
      const [allProspects, allCampaigns, allObjections] = await Promise.all([
        crmService.getProspects(),
        phoningService.getCampaigns(),
        phoningService.getObjections(),
      ]);
      setProspects(allProspects);
      setCampaigns(allCampaigns);
      setObjections(allObjections);

      if (allCampaigns.length > 0 && !selectedCampaignId) {
        setSelectedCampaignId(allCampaigns[0].id);
      }

      // Sélectionner le premier prospect non contacté ou à qualifier
      const firstTarget = allProspects.find(
        (p) => p.status === 'a_qualifier' || p.status === 'nouveau' || p.status === 'premier_contact'
      );
      if (firstTarget) {
        setSelectedProspectId(firstTarget.id);
      }
    } catch (err) {
      console.error('[CALL DESK] Load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Timer de session actif
  useEffect(() => {
    let timer: any;
    if (isSessionActive) {
      timer = setInterval(() => {
        setSessionDurationSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isSessionActive]);

  // File d'attente filtrée
  const queueProspects = useMemo(() => {
    return prospects.filter((p) => {
      if (p.is_archived) return false;
      if (p.status === 'gagne' || p.status === 'perdu' || p.status === 'ne_plus_contacter') return false;
      if (selectedCampaignId && selectedCampaignId !== 'all') {
        return p.active_campaign_id === selectedCampaignId || !p.active_campaign_id;
      }
      return true;
    });
  }, [prospects, selectedCampaignId]);

  const activeProspect = useMemo(() => {
    return queueProspects.find((p) => p.id === selectedProspectId) || queueProspects[0] || null;
  }, [queueProspects, selectedProspectId]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCopyPhone = (phone?: string) => {
    if (!phone) return;
    navigator.clipboard.writeText(phone);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  // Enregistrer le résultat et passer au prospect suivant automatiquement
  const handleSubmitOutcome = async (
    customResult?: string,
    nextStatus: ProspectCommercialStatus = 'premier_contact'
  ) => {
    if (!activeProspect) return;
    const finalResult = customResult || callResult;

    setIsSubmitting(true);
    setSubmitFeedback(null);

    try {
      const isRdv = finalResult.includes('Rendez-vous') || finalResult.includes('RDV');
      const isRelance = finalResult.includes('Rappel') || finalResult.includes('relance');

      // 1. Enregistrement de l'appel
      await phoningService.logCall({
        prospectId: activeProspect.id,
        companyId: activeProspect.company_id,
        contactId: activeProspect.primary_contact_id,
        campaignId: selectedCampaignId,
        callResult: finalResult,
        summary: `Appel CALL DESK [${finalResult}] : ${callNotes || 'Qualification effectuée'}`,
        notes: callNotes,
        newStatus: isRdv ? 'rdv_programme' : nextStatus,
        createFollowupTask: isRelance || isRdv,
        followupDate: followupDate,
        followupPriority: isRdv ? 'urgente' : 'haute',
      });

      // 2. Si RDV obtenu : création synchrone dans Outlook Calendar
      if (isRdv) {
        await outlookService.scheduleAppointment({
          prospectId: activeProspect.id,
          companyId: activeProspect.company_id,
          contactId: activeProspect.primary_contact_id,
          title: appointmentTitle,
          description: `Cadrage 45 min avec ${activeProspect.primary_contact?.first_name || 'le dirigeant'}. Notes : ${callNotes}`,
          startTime: new Date(appointmentDateTime).toISOString(),
          endTime: new Date(new Date(appointmentDateTime).getTime() + 45 * 60000).toISOString(),
          locationType: 'visio',
        });
        setSessionAppointmentsCount((prev) => prev + 1);
      }

      if (isRelance) {
        setSessionFollowupsCount((prev) => prev + 1);
      }

      setSessionCallsCount((prev) => prev + 1);
      setSubmitFeedback(`Appel enregistré [${finalResult}] ! Passage au prospect suivant...`);

      // 3. Passage automatique au prospect suivant dans la file
      const currentIdx = queueProspects.findIndex((p) => p.id === activeProspect.id);
      const nextProspect = queueProspects[currentIdx + 1] || queueProspects[0] || null;

      // Recharger la base
      await loadData();
      if (nextProspect && nextProspect.id !== activeProspect.id) {
        setSelectedProspectId(nextProspect.id);
      }

      setCallNotes('');
      setActiveStepIndex(0);
    } catch (err: unknown) {
      setSubmitFeedback(`Erreur : ${(err as Error).message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepsGuide = [
    {
      title: '1. Accroche Chirurgicale (15s)',
      text: `« Bonjour ${activeProspect?.primary_contact?.first_name || 'Monsieur/Madame'}, je vous contacte de la part de NEXUS Premium Solutions. Je ne vous prends que 30 secondes : nous accompagnons les dirigeants de ${activeProspect?.company?.sector || 'votre secteur'} à ${activeProspect?.company?.city || 'votre ville'} pour structurer leur flux d'acquisition et sécuriser leurs marges. »`,
    },
    {
      title: '2. Diagnostic de Rupture (45s)',
      text: '« Aujourd’hui, votre croissance repose-t-elle principalement sur le bouche-à-oreille classique ou avez-vous un canal prédictible pour aller chercher de nouveaux chantiers / contrats chaque mois ? »',
    },
    {
      title: '3. Proposition de Valeur Hybride (60s)',
      text: '« Notre devise chez NEXUS : "L’entreprise d’abord. La technologie ensuite." Nous combinons prospection ciblée et automatisation sur-mesure pour vous apporter des rendez-vous qualifiés prêts à signer. »',
    },
    {
      title: '4. Proposition de Cadrage 45 min (Verrouillage)',
      text: '« Je vous propose un échange de cadrage de 45 minutes sans aucun engagement, en visio ou par téléphone. Nous passons en revue votre organisation et vous repartez avec un diagnostic d’optimisation clair. Seriez-vous plus disponible ce jeudi à 11h ou vendredi à 14h30 ? »',
    },
  ];

  return (
    <div className="space-y-6">
      {/* En-tête NEXUS CALL DESK */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/80 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-1">
              <PhoneCall className="w-4 h-4 text-emerald-400" />
              <span>Addendum 2 · Poste Opérationnel Haute Performance (Interconnexion Globale)</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
              NEXUS CALL DESK
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                Lien Tel Direct & Guide Interactif
              </span>
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Cadence commerciale continue : numérotation immédiate, déroulement du script en 4 étapes, objections instantanées et synchronisation Outlook.
            </p>
          </div>

          {/* Contrôle de la session d'appels */}
          <div className="flex items-center gap-3 bg-slate-950/80 p-3 rounded-xl border border-slate-800">
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Temps Session</span>
              <span className="text-lg font-mono font-bold text-emerald-400">
                {formatTimer(sessionDurationSeconds)}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsSessionActive((prev) => !prev)}
              className={`p-2.5 rounded-lg text-white font-semibold flex items-center gap-1.5 text-xs cursor-pointer transition-colors ${
                isSessionActive ? 'bg-amber-600 hover:bg-amber-500' : 'bg-emerald-600 hover:bg-emerald-500'
              }`}
            >
              {isSessionActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{isSessionActive ? 'Pause' : 'Démarrer Session'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Barre Métriques de Session en Direct */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 block">File Disponible</span>
            <span className="text-xl font-bold text-white font-mono">{queueProspects.length}</span>
          </div>
          <Users className="w-5 h-5 text-blue-400" />
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 block">Appels Passés</span>
            <span className="text-xl font-bold text-white font-mono">{sessionCallsCount}</span>
          </div>
          <PhoneCall className="w-5 h-5 text-emerald-400" />
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 block">RDV Cadrage Verrouillés</span>
            <span className="text-xl font-bold text-emerald-400 font-mono">{sessionAppointmentsCount}</span>
          </div>
          <Calendar className="w-5 h-5 text-emerald-400" />
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 block">Relances Programmées</span>
            <span className="text-xl font-bold text-amber-400 font-mono">{sessionFollowupsCount}</span>
          </div>
          <Clock className="w-5 h-5 text-amber-400" />
        </div>
      </div>

      {/* FEEDBACK DE SOUMISSION RAPIDE */}
      {submitFeedback && (
        <div className="p-3 bg-emerald-950/40 border border-emerald-800 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{submitFeedback}</span>
        </div>
      )}

      {/* ESPACE DE TRAVAIL PRINCIPAL : 2 COLONNES (Prospect & File VS Guide & Qualification) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* COLONNE GAUCHE (5 cols) : Fiche Prospect Concentrée & File */}
        <div className="lg:col-span-5 space-y-4">
          {activeProspect ? (
            <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-5 shadow-xl relative">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                    Prospect en cours d'appel
                  </span>
                  <h2 className="text-xl font-bold text-white mt-0.5">
                    {activeProspect.company?.commercial_name}
                  </h2>
                  <p className="text-xs text-slate-400">
                    {activeProspect.company?.sector || 'Secteur B2B'} · {activeProspect.company?.city}
                  </p>
                </div>

                {activeProspect.company?.google_maps_url && (
                  <a
                    href={activeProspect.company.google_maps_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                    title="Ouvrir Google Maps"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>

              {/* BOUTON D'APPEL DIRECT TEL: (Grand & Immédiat) */}
              <div className="bg-emerald-950/30 border border-emerald-600/40 rounded-xl p-4 my-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-emerald-300 font-semibold uppercase block">
                    Numéro de Téléphone
                  </span>
                  <a
                    href={`tel:${activeProspect.primary_contact?.direct_phone || activeProspect.company?.standard_phone || '0478000000'}`}
                    className="text-xl font-mono font-bold text-white hover:text-emerald-300 flex items-center gap-2 mt-0.5"
                  >
                    <PhoneCall className="w-5 h-5 text-emerald-400 animate-pulse" />
                    <span>
                      {activeProspect.primary_contact?.direct_phone ||
                        activeProspect.company?.standard_phone ||
                        'Numéro direct disponible'}
                    </span>
                  </a>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    handleCopyPhone(
                      activeProspect.primary_contact?.direct_phone ||
                        activeProspect.company?.standard_phone
                    )
                  }
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedPhone ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedPhone ? 'Copié' : 'Copier'}</span>
                </button>
              </div>

              {/* Détails Dirigeant & Coordonnées certifiées RCS */}
              <div className="space-y-2.5 text-xs text-slate-300 pt-2 border-t border-slate-800">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>
                    Décideur :{' '}
                    <strong className="text-white">
                      {activeProspect.primary_contact?.first_name}{' '}
                      {activeProspect.primary_contact?.last_name}
                    </strong>{' '}
                    ({activeProspect.primary_contact?.role_title || 'Dirigeant'})
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>
                    {activeProspect.company?.address_street}, {activeProspect.company?.postal_code}{' '}
                    {activeProspect.company?.city}
                  </span>
                </div>

                {activeProspect.company?.siren && (
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>
                      Immatriculation RCS : SIREN <span className="font-mono text-emerald-300">{activeProspect.company.siren}</span>
                    </span>
                  </div>
                )}
              </div>

              {/* QUALIFICATION RAPIDE EN 2 CLICS (Boutons d'action immédiate) */}
              <div className="mt-5 pt-4 border-t border-slate-800">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300 block mb-2">
                  Validation Résultat d'Appel (1 clic) :
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => {
                      setCallResult('Rendez-vous de cadrage 45 min obtenu');
                      handleSubmitOutcome('Rendez-vous de cadrage 45 min obtenu', 'rdv_programme');
                    }}
                    className="p-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>RDV 45 min Gagné</span>
                  </button>

                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => {
                      setCallResult('Échange constructif / Rappel demandé');
                      handleSubmitOutcome('Échange constructif / Rappel demandé', 'a_recontacter');
                    }}
                    className="p-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition-colors"
                  >
                    <Clock className="w-4 h-4" />
                    <span>À rappeler sous 48h</span>
                  </button>

                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => {
                      setCallResult('Standard / Décideur absent');
                      handleSubmitOutcome('Standard / Décideur absent', 'premier_contact');
                    }}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    Barrage / Absent
                  </button>

                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => {
                      setCallResult('Pas de réponse / Messagerie');
                      handleSubmitOutcome('Pas de réponse / Messagerie', 'premier_contact');
                    }}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    Messagerie vocale
                  </button>

                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => {
                      setCallResult('Refus poli / Pas intéressé');
                      handleSubmitOutcome('Refus poli / Pas intéressé', 'perdu');
                    }}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-red-300 rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    Refus
                  </button>

                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => {
                      setCallResult('Ne plus contacter (Opposition)');
                      handleSubmitOutcome('Ne plus contacter (Opposition)', 'ne_plus_contacter');
                    }}
                    className="p-2 bg-red-950/40 hover:bg-red-900/60 text-red-300 rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    Ne plus contacter
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400 text-sm">
              Aucun prospect dans cette file.
            </div>
          )}

          {/* Mini-file d'attente visible */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-white uppercase">
                File Suivante ({queueProspects.length})
              </span>
              <span className="text-[11px] text-slate-400">Sélection manuelle</span>
            </div>
            <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
              {queueProspects.slice(0, 10).map((p) => (
                <div
                  key={p.id}
                  onClick={() => setSelectedProspectId(p.id)}
                  className={`p-2 rounded-lg text-xs cursor-pointer flex items-center justify-between transition-colors ${
                    activeProspect?.id === p.id
                      ? 'bg-emerald-950/50 border border-emerald-500/50 text-white font-semibold'
                      : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span className="truncate">{p.company?.commercial_name}</span>
                  <span className="text-[10px] text-slate-400 shrink-0 ml-2">{p.company?.city}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* COLONNE DROITE (7 cols) : Guide d'Appel, Objections & RDV Outlook */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            {/* Onglets Guide / Objections / RDV */}
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-4">
              <button
                type="button"
                onClick={() => setDeskTab('script')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                  deskTab === 'script'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Guide d'Entretien (4 Étapes)</span>
              </button>
              <button
                type="button"
                onClick={() => setDeskTab('objections')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                  deskTab === 'objections'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Objections Instantanées ({objections.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setDeskTab('rdv')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                  deskTab === 'rdv'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Fixer RDV Outlook</span>
              </button>
            </div>

            {/* TAB 1 : GUIDE D'ENTRETIEN COMMERCIAL EN 4 ÉTAPES */}
            {deskTab === 'script' && (
              <div className="space-y-4">
                <div className="flex items-center gap-1.5 pb-2 border-b border-slate-800/80">
                  {stepsGuide.map((step, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveStepIndex(idx)}
                      className={`flex-1 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-colors ${
                        activeStepIndex === idx
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      Étape {idx + 1}
                    </button>
                  ))}
                </div>

                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5">
                  <h4 className="text-sm font-bold text-emerald-400 mb-2">
                    {stepsGuide[activeStepIndex].title}
                  </h4>
                  <p className="text-sm text-slate-200 leading-relaxed font-sans italic bg-slate-900/90 p-4 rounded-lg border border-slate-800">
                    {stepsGuide[activeStepIndex].text}
                  </p>

                  <div className="mt-4 flex justify-between items-center pt-2">
                    <button
                      type="button"
                      disabled={activeStepIndex === 0}
                      onClick={() => setActiveStepIndex((prev) => prev - 1)}
                      className="px-3 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-xs text-white rounded"
                    >
                      Précédent
                    </button>
                    <button
                      type="button"
                      disabled={activeStepIndex === stepsGuide.length - 1}
                      onClick={() => setActiveStepIndex((prev) => prev + 1)}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-xs text-white rounded font-semibold"
                    >
                      Suivant
                    </button>
                  </div>
                </div>

                {/* Champ Notes d'Appel en direct */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Notes & Verbatims de conversation :
                  </label>
                  <textarea
                    rows={3}
                    value={callNotes}
                    onChange={(e) => setCallNotes(e.target.value)}
                    placeholder="Saisissez en direct les éléments évoqués par l'interlocuteur..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            )}

            {/* TAB 2 : ANNUAIRE D'OBJECTIONS CHIRURGICALES */}
            {deskTab === 'objections' && (
              <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                {objections.map((obj) => (
                  <div
                    key={obj.id}
                    className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold uppercase">
                        {obj.category}
                      </span>
                      <strong className="text-white text-xs">{obj.title}</strong>
                    </div>

                    <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800 text-xs text-emerald-300 font-medium leading-relaxed">
                      <strong>Réponse chirurgicale :</strong> {obj.rebuttal}
                    </div>

                    {obj.counter_questions && obj.counter_questions.length > 0 && (
                      <div className="text-[11px] text-slate-400">
                        <span className="font-semibold text-slate-300">Contre-questions :</span>{' '}
                        {obj.counter_questions.join(' · ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* TAB 3 : FIXER RENDEZ-VOUS OUTLOOK IMMÉDIAT */}
            {deskTab === 'rdv' && (
              <div className="space-y-4 bg-slate-950 border border-slate-800 rounded-xl p-5">
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                  <Calendar className="w-4 h-4" />
                  <span>Synchronisation Immédiate Microsoft Outlook</span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Titre de la réunion :
                  </label>
                  <input
                    type="text"
                    value={appointmentTitle}
                    onChange={(e) => setAppointmentTitle(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Date et Heure du Cadrage :
                  </label>
                  <input
                    type="datetime-local"
                    value={appointmentDateTime}
                    onChange={(e) => setAppointmentDateTime(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleSubmitOutcome('Rendez-vous de cadrage 45 min obtenu', 'rdv_programme')}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/20"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Valider le RDV & Inscrire dans Outlook</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
