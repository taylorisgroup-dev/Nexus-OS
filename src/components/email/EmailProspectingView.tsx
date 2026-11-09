import React, { useState, useEffect } from 'react';
import { outlookService, type OutlookStatusResponse } from '../../services/microsoft/outlookService';
import { crmService } from '../../services/crm/crmService';
import type { ProspectRecord } from '../../services/supabase/types';
import {
  Mail,
  Send,
  CheckCircle2,
  AlertCircle,
  FileText,
  UserCheck,
  Building2,
  Sparkles,
  RotateCw,
  ExternalLink,
} from 'lucide-react';

export const EmailProspectingView: React.FC = () => {
  const [outlookStatus, setOutlookStatus] = useState<OutlookStatusResponse | null>(null);
  const [prospects, setProspects] = useState<ProspectRecord[]>([]);
  const [selectedProspectId, setSelectedProspectId] = useState<string>('');

  // Email form
  const [templateType, setTemplateType] = useState<'cadrage' | 'relance' | 'custom'>('cadrage');
  const [recipientEmail, setRecipientEmail] = useState<string>('');
  const [subject, setSubject] = useState<string>('NEXUS Premium Solutions · Optimisation opérationnelle & Cadrage 45 min');
  const [bodyText, setBodyText] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);
  const [sendSuccess, setSendSuccess] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);

  useEffect(() => {
    outlookService.getStatus().then(setOutlookStatus);
    crmService.getProspects().then((list) => {
      setProspects(list);
      if (list.length > 0) {
        setSelectedProspectId(list[0].id);
        setRecipientEmail(list[0].primary_contact?.email || list[0].company?.general_email || '');
      }
    });
  }, []);

  const selectedProspect = prospects.find((p) => p.id === selectedProspectId);

  // Mise à jour du template selon le prospect sélectionné
  useEffect(() => {
    if (!selectedProspect) return;

    const companyName = selectedProspect.company?.commercial_name || 'votre établissement';
    const contactName = selectedProspect.primary_contact?.first_name || 'Madame, Monsieur';
    const sector = selectedProspect.company?.sector || 'votre secteur d’activité';
    const city = selectedProspect.company?.city || 'votre région';

    if (templateType === 'cadrage') {
      setSubject(`NEXUS Premium Solutions · Cadrage exécutif 45 min · ${companyName}`);
      setBodyText(
`Bonjour ${contactName},

Je me permets de vous contacter de la part de NEXUS Premium Solutions.

Nous accompagnons les dirigeants d'entreprises du secteur ${sector} sur ${city} pour optimiser leur rentabilité opérationnelle et automatiser leurs flux clients grâce à une approche hybride associant expertise humaine et ingénierie de pointe.

Notre principe directeur : « L’entreprise d’abord. La technologie ensuite. »

Dans ce cadre, nous vous proposons un échange de cadrage exécutif de 45 minutes, en visio ou en présentiel, sans aucun engagement. L'objectif est de passer en revue vos points de friction actuels et de vous remettre un diagnostic d'optimisation concret.

Seriez-vous disponible pour un créneau ce jeudi à 11h ou vendredi à 14h30 ?

Bien cordialement,
L'équipe NEXUS Premium Solutions
nexuspremiumsolutions@gmail.com`
      );
    } else if (templateType === 'relance') {
      setSubject(`Suite à notre échange · NEXUS Premium Solutions · ${companyName}`);
      setBodyText(
`Bonjour ${contactName},

Faisant suite à notre prise de contact téléphonique concernant le développement de ${companyName}, je vous transmets comme convenu notre synthèse d'intervention.

Nous restons à votre entière disposition pour convenir d'un échange approfondi de 45 minutes sur vos priorités actuelles.

Bien cordialement,
L'équipe NEXUS Premium Solutions`
      );
    }
  }, [templateType, selectedProspectId, selectedProspect]);

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientEmail.trim() || !subject.trim() || !bodyText.trim()) return;

    setIsSending(true);
    setSendSuccess(null);
    setSendError(null);

    try {
      await outlookService.sendCommercialEmail({
        prospectId: selectedProspect?.id,
        companyId: selectedProspect?.company_id,
        recipientEmail: recipientEmail.trim(),
        subject: subject.trim(),
        bodyText: bodyText.trim(),
      });

      setSendSuccess(
        `Email commercial envoyé avec succès à ${recipientEmail} et rattaché à l'historique CRM du prospect !`
      );
    } catch (err: unknown) {
      setSendError((err as Error).message || 'Échec d’envoi du message.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête Canal Emailing */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/80 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-400 mb-1">
              <Mail className="w-4 h-4 text-blue-400" />
              <span>Canal 3 · Prospection Numérique & Emailing</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
              Emailing Commercial
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40">
                Microsoft Graph / Outlook
              </span>
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Rédigez et expédiez des messages personnalisés via votre compte Outlook professionnel avec archivage automatique dans le CRM.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Microsoft 365 Bridge</span>
            </span>
          </div>
        </div>
      </div>

      {/* Formulaire d'Envoi d'Email */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-xl">
        <form onSubmit={handleSendEmail} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Destinataire (Prospect CRM)
              </label>
              <select
                value={selectedProspectId}
                onChange={(e) => {
                  setSelectedProspectId(e.target.value);
                  const p = prospects.find((item) => item.id === e.target.value);
                  if (p) {
                    setRecipientEmail(p.primary_contact?.email || p.company?.general_email || '');
                  }
                }}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
              >
                {prospects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.company?.commercial_name} — {p.primary_contact?.first_name || 'Direction'} ({p.company?.city})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Adresse Email du Destinataire
              </label>
              <input
                type="email"
                required
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="contact@entreprise.fr"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 font-medium">Modèle de message :</span>
            <button
              type="button"
              onClick={() => setTemplateType('cadrage')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                templateType === 'cadrage'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Invitation Cadrage 45 min
            </button>
            <button
              type="button"
              onClick={() => setTemplateType('relance')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                templateType === 'relance'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Relance Post-Appel
            </button>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Objet de l'email
            </label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Corps du message
            </label>
            <textarea
              rows={10}
              required
              value={bodyText}
              onChange={(e) => setBodyText(e.target.value)}
              className="w-full bg-slate-800/90 border border-slate-700 rounded-lg p-3 text-sm text-white font-mono text-xs leading-relaxed focus:outline-none focus:border-blue-500"
            />
          </div>

          {sendSuccess && (
            <div className="p-3 bg-emerald-950/40 border border-emerald-800 rounded-lg text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{sendSuccess}</span>
            </div>
          )}

          {sendError && (
            <div className="p-3 bg-red-950/40 border border-red-800 rounded-lg text-xs text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{sendError}</span>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSending}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg flex items-center gap-2 shadow-lg shadow-blue-600/20 cursor-pointer transition-colors"
            >
              {isSending ? (
                <>
                  <RotateCw className="w-4 h-4 animate-spin" />
                  <span>Envoi via Outlook...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Expédier via Microsoft Outlook</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
