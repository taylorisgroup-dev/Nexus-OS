import React, { useState } from 'react';
import type {
  WebConfiguration,
  GeneratedDocument,
  DocumentType,
  CompanyLegalProfile,
  ClientLegalProfile,
  WebComponent,
} from '../../types/configurator';
import type { EngineResult } from '../../lib/configuratorEngine';
import {
  generateDocument,
  checkInvoiceLegalBlockers,
} from '../../lib/documentGenerator';
import {
  FileText,
  Printer,
  Copy,
  Check,
  AlertTriangle,
  ShieldCheck,
  Lock,
  Layers,
  Building,
  User,
  Calendar,
  Clock,
  Euro,
  FileCheck,
  ExternalLink,
} from 'lucide-react';
import { NexusLogo } from '../brand/NexusLogo';

interface DocumentsViewProps {
  config: WebConfiguration;
  engineResult: EngineResult;
  componentsCatalog: WebComponent[];
  companyLegal: CompanyLegalProfile;
  onOpenCompanyLegal: () => void;
  onOpenClientLegal: () => void;
  onSaveConfig: (updatedConfig: WebConfiguration) => void;
}

export const DocumentsView: React.FC<DocumentsViewProps> = ({
  config,
  engineResult,
  componentsCatalog,
  companyLegal,
  onOpenCompanyLegal,
  onOpenClientLegal,
  onSaveConfig,
}) => {
  const [activeDocType, setActiveDocType] = useState<DocumentType>('cahier_technique');
  const [copiedStatus, setCopiedStatus] = useState<string | null>(null);

  // Check invoice blockers
  const invoiceBlockers = checkInvoiceLegalBlockers(
    companyLegal,
    config.clientLegal,
    engineResult
  );

  // Generate or retrieve current active document
  const currentDoc: GeneratedDocument = generateDocument(
    activeDocType,
    config,
    engineResult,
    componentsCatalog,
    companyLegal,
    1
  );

  const compMap = new Map(componentsCatalog.map((c) => [c.id, c]));
  const selectedComps = Object.values(config.selections)
    .filter((s) => s.isSelected)
    .map((s) => ({
      selection: s,
      component: compMap.get(s.componentId)!,
    }))
    .filter((i) => Boolean(i.component));

  const handleCopyText = (content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedStatus('Texte copié dans le presse-papiers');
    setTimeout(() => setCopiedStatus(null), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Draft Governance & Safeguard */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
          <div>
            <span className="text-[11px] text-neutral-400 font-mono uppercase tracking-wider block">
              NEXUS Digital · Édition & Génération Documentaire
            </span>
            <h3 className="text-base font-semibold text-white tracking-tight mt-0.5">
              Production des 4 Documents Contractuels & Techniques
            </h3>
            <p className="text-xs text-neutral-400 mt-1 max-w-2xl leading-relaxed">
              Documents générés en temps réel à partir du cadrage et du catalogue. Aucun document n’est envoyé
              ni publié automatiquement. Tous sont maintenus en état <strong>BROUILLON</strong>.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenCompanyLegal}
              className="px-3 py-1.5 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 rounded-lg text-xs text-neutral-300 font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Building className="w-3.5 h-3.5 text-neutral-400" />
              <span>Mentions Vendeur</span>
            </button>

            <button
              type="button"
              onClick={onOpenClientLegal}
              className="px-3 py-1.5 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 rounded-lg text-xs text-neutral-300 font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <User className="w-3.5 h-3.5 text-neutral-400" />
              <span>Coordonnées Client</span>
            </button>
          </div>
        </div>

        {/* Invoice Blocker Alert Banner if active is Facture */}
        {activeDocType === 'facture' && invoiceBlockers.length > 0 && (
          <div className="p-4 bg-red-950/60 border border-red-800 rounded-xl space-y-2 text-xs">
            <div className="flex items-center gap-2 text-red-200 font-semibold text-xs">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>
                Finalisation de facture BLOQUÉE ({invoiceBlockers.length} information(s) requise(s) manquante(s)) :
              </span>
            </div>
            <p className="text-red-300/90 text-[11px] leading-relaxed">
              Conformément à la réglementation comptable et à la politique de NEXUS, aucune facture définitive ne peut être
              émise avec des données approximatives ou partielles :
            </p>
            <ul className="list-disc list-inside space-y-1 text-red-300 text-[11px] pl-1 font-mono">
              {invoiceBlockers.map((b, idx) => (
                <li key={idx}>{b.message}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Document Switcher Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          <button
            type="button"
            onClick={() => setActiveDocType('cahier_technique')}
            className={`p-3 rounded-lg border text-left transition-colors cursor-pointer ${
              activeDocType === 'cahier_technique'
                ? 'bg-neutral-800 border-neutral-600 text-white shadow-xs'
                : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
            }`}
          >
            <span className="text-[10px] font-mono uppercase text-neutral-500 block">Doc 1</span>
            <span className="text-xs font-semibold block mt-0.5">Cahier Technique Interne</span>
            <span className="text-[10px] text-neutral-500 block mt-1">Architecture & spécifications</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveDocType('cahier_client')}
            className={`p-3 rounded-lg border text-left transition-colors cursor-pointer ${
              activeDocType === 'cahier_client'
                ? 'bg-neutral-800 border-neutral-600 text-white shadow-xs'
                : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
            }`}
          >
            <span className="text-[10px] font-mono uppercase text-neutral-500 block">Doc 2</span>
            <span className="text-xs font-semibold block mt-0.5">Cahier Explicatif Client</span>
            <span className="text-[10px] text-neutral-500 block mt-1">Bénéfices & responsabilités</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveDocType('bon_commande')}
            className={`p-3 rounded-lg border text-left transition-colors cursor-pointer ${
              activeDocType === 'bon_commande'
                ? 'bg-neutral-800 border-neutral-600 text-white shadow-xs'
                : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
            }`}
          >
            <span className="text-[10px] font-mono uppercase text-neutral-500 block">Doc 3</span>
            <span className="text-xs font-semibold block mt-0.5">Bon de Commande</span>
            <span className="text-[10px] text-neutral-500 block mt-1">Prestations & engagements</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveDocType('facture')}
            className={`p-3 rounded-lg border text-left transition-colors cursor-pointer ${
              activeDocType === 'facture'
                ? invoiceBlockers.length > 0
                  ? 'bg-neutral-800 border-red-700/80 text-white shadow-xs'
                  : 'bg-neutral-800 border-neutral-600 text-white shadow-xs'
                : invoiceBlockers.length > 0
                ? 'bg-neutral-950 border-red-950 text-neutral-400 hover:text-white'
                : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase text-neutral-500">Doc 4</span>
              {invoiceBlockers.length > 0 && (
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-red-950 text-red-400 border border-red-800 font-mono">
                  Bloqué
                </span>
              )}
            </div>
            <span className="text-xs font-semibold block mt-0.5">Facture (Brouillon)</span>
            <span className="text-[10px] text-neutral-500 block mt-1">Conformité légale & TVA</span>
          </button>
        </div>
      </div>

      {/* Document Action Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-neutral-900 border border-neutral-800 px-4 py-3 rounded-xl">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="text-[11px] font-mono uppercase px-2.5 py-1 rounded bg-amber-950/80 text-amber-300 border border-amber-800/80 font-semibold tracking-wider">
            DOCUMENT DE TRAVAIL EN BROUILLON À VÉRIFIER
          </span>
          <span className="text-xs text-neutral-400 font-mono">
            Réf : {currentDoc.referenceNumber}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {copiedStatus && (
            <span className="text-xs text-emerald-400 animate-pulse">{copiedStatus}</span>
          )}

          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs font-medium transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimer / PDF</span>
          </button>
        </div>
      </div>

      {/* Render Document Content */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 sm:p-10 space-y-8 text-neutral-200 print:bg-white print:text-black print:border-none print:p-0">
        {/* Document Header with Real Brand Logo */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 border-b border-neutral-800 pb-6 print:border-neutral-300">
          <div className="space-y-3">
            <NexusLogo variant="document" showSubtext={true} />

            <div>
              <span className="text-[11px] font-mono uppercase tracking-widest text-neutral-400 print:text-neutral-600 block">
                {companyLegal.tradeName || 'NEXUS Digital'} · {companyLegal.companyName || 'NEXUS Premium Solutions'}
              </span>
              <h2 className="text-xl font-bold tracking-tight text-white print:text-black mt-0.5">
                {currentDoc.title}
              </h2>
              <p className="text-xs text-neutral-400 print:text-neutral-600 mt-1">
                Projet : <strong>{config.projectTitle}</strong> (Typologie : {config.projectType} · Délai : {engineResult.deliveryEstimate.label})
              </p>
            </div>
          </div>

          <div className="text-right text-xs space-y-1 font-mono text-neutral-400 print:text-neutral-700">
            <div>Date : {currentDoc.content.meta.date}</div>
            <div>Statut : Brouillon de travail à vérifier</div>
            <div>Version : v{currentDoc.version}.0</div>
            <div>Auteur : {currentDoc.content.meta.author}</div>
          </div>
        </div>

        {/* Prominent Legal Disclaimer Banner */}
        <div className="p-3 bg-neutral-950 border border-amber-900/60 rounded-lg text-[11px] text-amber-300/90 leading-relaxed print:bg-neutral-100 print:text-neutral-800 print:border-neutral-300">
          <strong>Avertissement :</strong> Ce document constitue un <em>document de travail en brouillon à vérifier</em>. Il ne constitue pas un engagement juridique ou fiscal ferme tant que le cadrage des exigences critiques n'est pas validé et que la situation fiscale de NEXUS Premium Solutions n'a pas été confirmée.
        </div>

        {/* Parties prenantes (Vendeur / Client) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-4 bg-neutral-950 border border-neutral-800 rounded-xl print:bg-neutral-50 print:border-neutral-300">
          <div className="space-y-1 text-xs">
            <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider block">
              Prestataire / Ingénierie
            </span>
            <div className="font-semibold text-white print:text-black">
              {companyLegal.companyName || 'À configurer'} {companyLegal.tradeName ? `(${companyLegal.tradeName})` : ''}
            </div>
            <div className="text-neutral-400 print:text-neutral-600">
              {companyLegal.address || 'Adresse à configurer'}, {companyLegal.city || ''}
            </div>
            <div className="font-mono text-[11px] text-neutral-400 print:text-neutral-600">
              SIRET : {companyLegal.sirenSiret || 'À configurer'} · RCS : {companyLegal.rcsNumber || 'À configurer'}
            </div>
            <div className="font-mono text-[11px] text-neutral-400 print:text-neutral-600">
              TVA : {companyLegal.vatNumber || 'À configurer'}
            </div>
          </div>

          <div className="space-y-1 text-xs">
            <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider block">
              Client / Bénéficiaire
            </span>
            <div className="font-semibold text-white print:text-black">
              {config.clientLegal.companyName || config.clientName || 'À configurer'}
            </div>
            <div className="text-neutral-400 print:text-neutral-600">
              Contact : {config.clientLegal.contactName || 'Non spécifié'} {config.clientLegal.contactRole ? `(${config.clientLegal.contactRole})` : ''}
            </div>
            <div className="text-neutral-400 print:text-neutral-600">
              {config.clientLegal.address || 'Adresse à configurer'}, {config.clientLegal.postalCode} {config.clientLegal.city}
            </div>
            <div className="font-mono text-[11px] text-neutral-400 print:text-neutral-600">
              Email : {config.clientLegal.email || 'À configurer'} · Tél : {config.clientLegal.phone || 'Non renseigné'}
            </div>
          </div>
        </div>

        {/* 1. CONTENT FOR CAHIER TECHNIQUE INTERNE */}
        {activeDocType === 'cahier_technique' && (
          <div className="space-y-6 text-xs text-neutral-300 print:text-neutral-900 leading-relaxed">
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-white print:text-black uppercase tracking-wider border-b border-neutral-800 pb-1">
                1. Objectifs & Exigences Validées
              </h4>
              <p className="text-neutral-400">
                Périmètre fonctionnel arrêté lors de la phase de cadrage NEXUS Digital :
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {config.requirements
                  .filter((r) => r.status === 'Validée')
                  .map((r) => (
                    <div
                      key={r.id}
                      className="p-2.5 bg-neutral-950 border border-neutral-800 rounded-lg text-[11px]"
                    >
                      <div className="font-semibold text-neutral-200">{r.title}</div>
                      <p className="text-neutral-400 text-[10px] mt-0.5">{r.question}</p>
                      {r.responseDetails && (
                        <div className="text-cyan-400 font-mono text-[10px] mt-1">
                          Consigné : « {r.responseDetails} »
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-white print:text-black uppercase tracking-wider border-b border-neutral-800 pb-1">
                2. Spécification Détaillée des Composants Logiciels ({selectedComps.length} modules)
              </h4>
              <div className="space-y-3 pt-1">
                {selectedComps.map(({ component, selection }) => (
                  <div
                    key={component.id}
                    className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-cyan-400 text-[10px]">[{component.category}]</span>
                        <strong className="text-white text-xs">{component.name}</strong>
                      </div>
                      <span className="font-mono text-neutral-400 text-[11px]">
                        {component.effortMinHours}h - {component.effortMaxHours}h
                      </span>
                    </div>

                    <p className="text-neutral-400 text-[11px] font-mono">
                      Spécification interne : {component.internalExplanation}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] text-neutral-500 pt-1 border-t border-neutral-900">
                      <div>
                        <strong>Sécurité requise :</strong> {component.securityRequirements || 'Conforme standard'}
                      </div>
                      <div>
                        <strong>Critère d’acceptation :</strong> {component.acceptanceTests || 'Recette visuelle et unitaire'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-white print:text-black uppercase tracking-wider border-b border-neutral-800 pb-1">
                3. Effort Global & Calendrier
              </h4>
              <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg space-y-1 font-mono text-[11px]">
                <div>Effort cumulé retenu : {engineResult.totalEffortMin}h à {engineResult.totalEffortMax}h d'ingénierie</div>
                <div>Délai de réalisation de référence : {engineResult.deliveryEstimate.referenceWeeksMin} à {engineResult.deliveryEstimate.referenceWeeksMax} semaines</div>
                <div>Date cible : {engineResult.deliveryEstimate.targetStartDate || 'À définir avec le client'}</div>
              </div>
            </div>
          </div>
        )}

        {/* 2. CONTENT FOR CAHIER EXPLICATIF CLIENT */}
        {activeDocType === 'cahier_client' && (
          <div className="space-y-6 text-xs text-neutral-300 print:text-neutral-900 leading-relaxed">
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-white print:text-black uppercase tracking-wider border-b border-neutral-800 pb-1">
                1. Vision du Projet & Approche NEXUS
              </h4>
              <p className="text-neutral-300 leading-relaxed">
                Ce cahier des charges explicatif a pour vocation de traduire vos objectifs stratégiques en un dispositif digital performant,
                sobre et évolutif. Conformément à notre principe fondateur <em>« L’entreprise d’abord. La technologie ensuite »</em>,
                chaque brique logicielle intégrée répond à un besoin métier précis et validé.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-white print:text-black uppercase tracking-wider border-b border-neutral-800 pb-1">
                2. Les Bénéfices Concrets pour Votre Entreprise
              </h4>
              <div className="space-y-2.5 pt-1">
                {selectedComps.map(({ component }) => (
                  <div
                    key={component.id}
                    className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg space-y-1"
                  >
                    <strong className="text-white text-xs block">{component.name}</strong>
                    <p className="text-neutral-300 text-xs leading-relaxed">
                      {component.clientExplanation}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-white print:text-black uppercase tracking-wider border-b border-neutral-800 pb-1">
                3. Vos Engagements & Fournitures Clés
              </h4>
              <p className="text-neutral-400">
                Pour garantir le respect du délai prévisionnel ({engineResult.deliveryEstimate.referenceWeeksMin} à {engineResult.deliveryEstimate.referenceWeeksMax} semaines),
                votre équipe mettra à disposition de NEXUS :
              </p>
              <ul className="list-disc list-inside space-y-1 text-neutral-300 pt-1">
                {engineResult.deliveryEstimate.clientDependencies.map((dep, idx) => (
                  <li key={idx}>{dep}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* 3. CONTENT FOR BON DE COMMANDE */}
        {activeDocType === 'bon_commande' && (
          <div className="space-y-6 text-xs text-neutral-300 print:text-neutral-900 leading-relaxed">
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-white print:text-black uppercase tracking-wider border-b border-neutral-800 pb-1">
                Tableau des Prestations Retenues
              </h4>
              <table className="w-full text-left text-xs border border-neutral-800">
                <thead className="bg-neutral-950 text-neutral-400 uppercase font-mono text-[10px]">
                  <tr>
                    <th className="p-2.5 border-b border-neutral-800">Désignation</th>
                    <th className="p-2.5 border-b border-neutral-800">Catégorie</th>
                    <th className="p-2.5 border-b border-neutral-800 text-right">Effort estimé</th>
                    <th className="p-2.5 border-b border-neutral-800 text-right">Coût ponctuel</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800">
                  {selectedComps.map(({ component }) => (
                    <tr key={component.id} className="hover:bg-neutral-950/50">
                      <td className="p-2.5 font-medium text-white">{component.name}</td>
                      <td className="p-2.5 text-neutral-400 font-mono text-[11px]">{component.category}</td>
                      <td className="p-2.5 text-right font-mono text-neutral-300">
                        {component.effortMinHours}h - {component.effortMaxHours}h
                      </td>
                      <td className="p-2.5 text-right font-mono text-neutral-300">
                        {component.oneTimeCostDefault > 0 ? `${component.oneTimeCostDefault} €` : 'Inclus'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Total Chiffré */}
            <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl space-y-2 text-right">
              <div className="text-xs text-neutral-400">
                Taux horaire appliqué :{' '}
                <strong className="text-white font-mono">
                  {config.pricing.hourlyRate !== null ? `${config.pricing.hourlyRate} € HT / h` : 'À configurer'}
                </strong>
              </div>
              <div className="text-base font-bold font-mono text-white">
                Total Prestations HT :{' '}
                {engineResult.pricingCalculation.totalHTMin !== null && engineResult.pricingCalculation.totalHTMax !== null
                  ? `${engineResult.pricingCalculation.totalHTMin.toLocaleString('fr-FR')} € — ${engineResult.pricingCalculation.totalHTMax.toLocaleString('fr-FR')} € HT`
                  : 'À configurer'}
              </div>
              <div className="text-xs text-neutral-400 font-mono">
                TVA ({config.pricing.taxRatePercent !== null ? `${config.pricing.taxRatePercent}%` : 'À configurer'}) :{' '}
                {engineResult.pricingCalculation.taxAmountMin !== null && engineResult.pricingCalculation.taxAmountMax !== null
                  ? `${engineResult.pricingCalculation.taxAmountMin.toLocaleString('fr-FR')} € — ${engineResult.pricingCalculation.taxAmountMax.toLocaleString('fr-FR')} €`
                  : 'À configurer'}
              </div>
              <div className="text-lg font-bold font-mono text-cyan-400 border-t border-neutral-800 pt-2">
                Net à payer TTC :{' '}
                {engineResult.pricingCalculation.totalTTCMin !== null && engineResult.pricingCalculation.totalTTCMax !== null
                  ? `${engineResult.pricingCalculation.totalTTCMin.toLocaleString('fr-FR')} € — ${engineResult.pricingCalculation.totalTTCMax.toLocaleString('fr-FR')} € TTC`
                  : 'À configurer'}
              </div>
            </div>

            {/* Conditions & Signatures */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-neutral-800">
              <div className="space-y-1 text-[11px] text-neutral-400">
                <strong className="text-neutral-200 block">Conditions de règlement :</strong>
                <p>30% d'acompte à la signature du bon de commande ferme, solde à la livraison et recette du dispositif digital.</p>
                <p>Validité de la présente proposition : 30 jours à compter de la date d’émission.</p>
              </div>

              <div className="p-4 border border-dashed border-neutral-700 rounded-lg text-center text-xs text-neutral-500 space-y-8">
                <div>Bon pour accord et commande ferme (Date & Signature client) :</div>
                <div className="text-[10px] text-neutral-600 italic">Signature précédée de la mention manuscrite « Bon pour accord »</div>
              </div>
            </div>
          </div>
        )}

        {/* 4. CONTENT FOR FACTURE */}
        {activeDocType === 'facture' && (
          <div className="space-y-6 text-xs text-neutral-300 print:text-neutral-900 leading-relaxed">
            <div className="p-3 bg-amber-950/30 border border-amber-800/60 rounded-lg text-[11px] text-amber-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong>Statut légal :</strong> Ce document constitue une simulation en brouillon pour validation comptable. Aucune facture définitive ne peut être diffusée sans enregistrement préalable du profil légal complet.
              </span>
            </div>

            <table className="w-full text-left text-xs border border-neutral-800">
              <thead className="bg-neutral-950 text-neutral-400 uppercase font-mono text-[10px]">
                <tr>
                  <th className="p-2.5 border-b border-neutral-800">Ligne de facturation</th>
                  <th className="p-2.5 border-b border-neutral-800 text-right">Base</th>
                  <th className="p-2.5 border-b border-neutral-800 text-right">Taux HT</th>
                  <th className="p-2.5 border-b border-neutral-800 text-right">Total HT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800">
                <tr>
                  <td className="p-2.5 font-medium text-white">
                    Ingénierie web & digitalisation ({config.projectType}) — Lot de composants validés
                  </td>
                  <td className="p-2.5 text-right font-mono text-neutral-300">
                    {engineResult.totalEffortMin}h - {engineResult.totalEffortMax}h
                  </td>
                  <td className="p-2.5 text-right font-mono text-neutral-300">
                    {config.pricing.hourlyRate !== null ? `${config.pricing.hourlyRate} €/h` : 'Non renseigné'}
                  </td>
                  <td className="p-2.5 text-right font-mono text-white">
                    {engineResult.pricingCalculation.costLaborMin !== null
                      ? `${engineResult.pricingCalculation.costLaborMin.toLocaleString('fr-FR')} € — ${engineResult.pricingCalculation.costLaborMax?.toLocaleString('fr-FR')} €`
                      : 'À configurer'}
                  </td>
                </tr>

                {config.pricing.oneTimeExpenses !== null && config.pricing.oneTimeExpenses > 0 && (
                  <tr>
                    <td className="p-2.5 text-neutral-300">Frais techniques ponctuels annexes</td>
                    <td className="p-2.5 text-right font-mono text-neutral-400">Forfait</td>
                    <td className="p-2.5 text-right font-mono text-neutral-400">-</td>
                    <td className="p-2.5 text-right font-mono text-neutral-200">
                      {config.pricing.oneTimeExpenses} €
                    </td>
                  </tr>
                )}

                {config.pricing.discountAmount !== null && config.pricing.discountAmount > 0 && (
                  <tr className="text-emerald-400">
                    <td className="p-2.5">Remise commerciale accordée</td>
                    <td className="p-2.5 text-right font-mono">-</td>
                    <td className="p-2.5 text-right font-mono">-</td>
                    <td className="p-2.5 text-right font-mono">
                      -{config.pricing.discountAmount} €
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Totaux & Mentions Légales Facture */}
            <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl space-y-2 text-right">
              <div className="text-sm font-semibold text-white font-mono">
                Total Hors Taxes (HT) :{' '}
                {engineResult.pricingCalculation.totalHTMin !== null
                  ? `${engineResult.pricingCalculation.totalHTMin.toLocaleString('fr-FR')} € HT`
                  : 'À configurer'}
              </div>
              <div className="text-xs text-neutral-400 font-mono">
                TVA ({config.pricing.taxRatePercent !== null ? `${config.pricing.taxRatePercent}%` : 'À configurer'}) :{' '}
                {engineResult.pricingCalculation.taxAmountMin !== null
                  ? `${engineResult.pricingCalculation.taxAmountMin.toLocaleString('fr-FR')} €`
                  : 'À configurer'}
              </div>
              <div className="text-lg font-bold font-mono text-white border-t border-neutral-800 pt-2">
                Total TTC Net à Payer :{' '}
                {engineResult.pricingCalculation.totalTTCMin !== null
                  ? `${engineResult.pricingCalculation.totalTTCMin.toLocaleString('fr-FR')} € TTC`
                  : 'À configurer'}
              </div>
            </div>

            {/* Mentions Obligatoires de Règlement */}
            <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg text-[11px] text-neutral-400 space-y-1">
              <div className="font-semibold text-neutral-300">Coordonnées de règlement :</div>
              <div className="font-mono text-[10px] text-neutral-200">
                IBAN / BIC : {companyLegal.ibanBic || 'À configurer dans les paramètres légaux'}
              </div>
              <div className="text-[10px] leading-relaxed pt-1">
                {companyLegal.legalNotice ||
                  'Pénalités de retard : 3 fois le taux d’intérêt légal. Indemnité forfaitaire pour frais de recouvrement en cas de retard : 40 €.'}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
