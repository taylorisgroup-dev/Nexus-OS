import React from 'react';
import type {
  PricingParameters,
  DeliveryEstimation,
  WebProjectType,
} from '../../types/configurator';
import type { EngineResult } from '../../lib/configuratorEngine';
import {
  Calculator,
  Clock,
  Euro,
  Calendar,
  AlertTriangle,
  Info,
  CheckCircle2,
  FileCheck,
  Percent,
} from 'lucide-react';

interface PricingAndDeliveryViewProps {
  pricing: PricingParameters;
  onUpdatePricing: (pricing: PricingParameters) => void;
  delivery: DeliveryEstimation;
  onUpdateDelivery: (delivery: DeliveryEstimation) => void;
  engineResult: EngineResult;
}

export const PricingAndDeliveryView: React.FC<PricingAndDeliveryViewProps> = ({
  pricing,
  onUpdatePricing,
  delivery,
  onUpdateDelivery,
  engineResult,
}) => {
  const { pricingCalculation, deliveryEstimate, scopeAlert } = engineResult;

  const handlePricingChange = <K extends keyof PricingParameters>(
    key: K,
    val: PricingParameters[K]
  ) => {
    const updated = { ...pricing, [key]: val };
    // Determine if fully configured
    updated.isConfigured = updated.hourlyRate !== null && updated.taxRatePercent !== null;
    onUpdatePricing(updated);
  };

  const handleDeliveryChange = <K extends keyof DeliveryEstimation>(
    key: K,
    val: DeliveryEstimation[K]
  ) => {
    onUpdateDelivery({ ...delivery, [key]: val });
  };

  return (
    <div className="space-y-6">
      {/* 1. Visible Pricing Formula Card */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-neutral-800 pb-4">
          <div>
            <span className="text-[11px] text-neutral-400 font-mono uppercase tracking-wider block">
              NEXUS Digital · Modèle Économique Transparent
            </span>
            <h3 className="text-base font-semibold text-white tracking-tight mt-0.5">
              Chiffrage & Formule Mathématique Visible
            </h3>
            <p className="text-xs text-neutral-400 mt-1">
              Aucun tarif ni taux n’est inventé : tout paramètre non encore arrêté est clairement désigné « À configurer ».
            </p>
          </div>

          <div
            className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-medium flex items-center gap-2 ${
              pricingCalculation.isFullyConfigured
                ? 'bg-emerald-950/80 border-emerald-800 text-emerald-300'
                : 'bg-amber-950/80 border-amber-800 text-amber-300'
            }`}
          >
            {pricingCalculation.isFullyConfigured ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Paramètres financiers complets</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span>Paramètres à configurer ({pricingCalculation.missingParameters.join(', ')})</span>
              </>
            )}
          </div>
        </div>

        {/* Critical Requirements Blocker Banner */}
        {engineResult.isFirmEstimationBlocked && (
          <div className="p-4 bg-amber-950/40 border border-amber-800 rounded-xl space-y-1.5 text-xs text-amber-200">
            <div className="flex items-center gap-2 font-semibold text-amber-300">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Estimation ferme bloquée — Cadrage incomplet</span>
            </div>
            <p className="text-[11px] text-amber-300/90 leading-relaxed">
              {engineResult.firmEstimationBlockerReason}
            </p>
          </div>
        )}

        {/* The Exact Formula in French as requested by prompt */}
        <div className="p-3.5 bg-neutral-950 border border-neutral-800 rounded-lg space-y-2">
          <div className="flex items-center gap-2 text-neutral-400 text-xs font-semibold">
            <Calculator className="w-4 h-4 text-cyan-400" />
            <span>Formule de calcul appliquée :</span>
          </div>
          <p className="font-mono text-xs text-neutral-200 bg-neutral-900/90 p-2.5 rounded border border-neutral-800 break-words leading-relaxed">
            {pricingCalculation.formulaDisplay}
          </p>
        </div>

        {/* Interactive Parameter Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
          {/* Taux Horaire */}
          <div className="p-3.5 bg-neutral-950 border border-neutral-800 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-neutral-200">
                Taux horaire HT (€ / h)
              </label>
              <span className="text-[10px] text-neutral-500 font-mono">Obligatoire</span>
            </div>
            <div className="relative">
              <input
                type="number"
                min={0}
                step={5}
                value={pricing.hourlyRate === null ? '' : pricing.hourlyRate}
                onChange={(e) =>
                  handlePricingChange(
                    'hourlyRate',
                    e.target.value === '' ? null : Number(e.target.value)
                  )
                }
                placeholder="À configurer"
                className="w-full pl-3 pr-8 py-1.5 bg-neutral-900 border border-neutral-700 rounded text-xs text-neutral-100 font-mono placeholder-neutral-500 focus:outline-none focus:border-cyan-400"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-neutral-500 font-mono">
                €/h
              </span>
            </div>
            <p className="text-[10px] text-neutral-400 leading-tight">
              Base de valorisation de l’effort technique ({engineResult.totalEffortMin}h à{' '}
              {engineResult.totalEffortMax}h).
            </p>
          </div>

          {/* Taux TVA */}
          <div className="p-3.5 bg-neutral-950 border border-neutral-800 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-neutral-200">Taux de taxe / TVA (%)</label>
              <span className="text-[10px] text-neutral-500 font-mono">Obligatoire</span>
            </div>
            <div className="relative">
              <input
                type="number"
                min={0}
                step={0.5}
                value={pricing.taxRatePercent === null ? '' : pricing.taxRatePercent}
                onChange={(e) =>
                  handlePricingChange(
                    'taxRatePercent',
                    e.target.value === '' ? null : Number(e.target.value)
                  )
                }
                placeholder="À configurer"
                className="w-full pl-3 pr-8 py-1.5 bg-neutral-900 border border-neutral-700 rounded text-xs text-neutral-100 font-mono placeholder-neutral-500 focus:outline-none focus:border-cyan-400"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-neutral-500 font-mono">
                %
              </span>
            </div>
            <p className="text-[10px] text-neutral-400 leading-tight">
              Taux de taxe à vérifier et configurer selon la situation fiscale exacte de NEXUS Premium Solutions.
            </p>
          </div>

          {/* Marge optionnelle */}
          <div className="p-3.5 bg-neutral-950 border border-neutral-800 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-neutral-200">Marge projet (%)</label>
              <span className="text-[10px] text-neutral-500 font-mono">Optionnel</span>
            </div>
            <div className="relative">
              <input
                type="number"
                min={0}
                step={1}
                value={pricing.marginPercent === null ? '' : pricing.marginPercent}
                onChange={(e) =>
                  handlePricingChange(
                    'marginPercent',
                    e.target.value === '' ? null : Number(e.target.value)
                  )
                }
                placeholder="Non renseignée"
                className="w-full pl-3 pr-8 py-1.5 bg-neutral-900 border border-neutral-700 rounded text-xs text-neutral-100 font-mono placeholder-neutral-500 focus:outline-none focus:border-cyan-400"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-neutral-500 font-mono">
                %
              </span>
            </div>
            <p className="text-[10px] text-neutral-400 leading-tight">
              Marge d'aléa ou de pilotage appliquée sur la main-d’œuvre.
            </p>
          </div>

          {/* Remise Commerciale */}
          <div className="p-3.5 bg-neutral-950 border border-neutral-800 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-neutral-200">
                Remise commerciale (€ HT)
              </label>
              <span className="text-[10px] text-neutral-500 font-mono">Optionnel</span>
            </div>
            <div className="relative">
              <input
                type="number"
                min={0}
                step={10}
                value={pricing.discountAmount === null ? '' : pricing.discountAmount}
                onChange={(e) =>
                  handlePricingChange(
                    'discountAmount',
                    e.target.value === '' ? null : Number(e.target.value)
                  )
                }
                placeholder="Non renseignée"
                className="w-full pl-3 pr-8 py-1.5 bg-neutral-900 border border-neutral-800 rounded text-xs text-neutral-100 font-mono focus:outline-none"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-neutral-500 font-mono">
                €
              </span>
            </div>
            <p className="text-[10px] text-neutral-400 leading-tight">
              Déduite du total HT avant calcul de la taxe.
            </p>
          </div>

          {/* Frais Annexes Ponctuels */}
          <div className="p-3.5 bg-neutral-950 border border-neutral-800 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-neutral-200">
                Frais ponctuels annexes (€ HT)
              </label>
              <span className="text-[10px] text-neutral-500 font-mono">Optionnel</span>
            </div>
            <div className="relative">
              <input
                type="number"
                min={0}
                step={10}
                value={pricing.oneTimeExpenses === null ? '' : pricing.oneTimeExpenses}
                onChange={(e) =>
                  handlePricingChange(
                    'oneTimeExpenses',
                    e.target.value === '' ? null : Number(e.target.value)
                  )
                }
                placeholder="Non renseignés"
                className="w-full pl-3 pr-8 py-1.5 bg-neutral-900 border border-neutral-800 rounded text-xs text-neutral-100 font-mono focus:outline-none"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-neutral-500 font-mono">
                €
              </span>
            </div>
            <p className="text-[10px] text-neutral-400 leading-tight">
              Achats de polices, thèmes ou gabarits spécifiques.
            </p>
          </div>

          {/* Frais Tiers Explicités */}
          <div className="p-3.5 bg-neutral-950 border border-neutral-800 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-neutral-200">
                Frais tiers récurrents / an (€)
              </label>
              <span className="text-[10px] text-neutral-500 font-mono">Optionnel</span>
            </div>
            <div className="relative">
              <input
                type="number"
                min={0}
                step={10}
                value={pricing.thirdPartyExpenses === null ? '' : pricing.thirdPartyExpenses}
                onChange={(e) =>
                  handlePricingChange(
                    'thirdPartyExpenses',
                    e.target.value === '' ? null : Number(e.target.value)
                  )
                }
                placeholder="Non renseignés"
                className="w-full pl-3 pr-8 py-1.5 bg-neutral-900 border border-neutral-800 rounded text-xs text-neutral-100 font-mono focus:outline-none"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-neutral-500 font-mono">
                €/an
              </span>
            </div>
            <p className="text-[10px] text-neutral-400 leading-tight">
              Domaines, certificats SSL dédiés ou licences annuelles tiers.
            </p>
          </div>
        </div>

        {/* Pricing Results Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-neutral-950 border border-neutral-800 rounded-xl">
          <div className="space-y-1">
            <span className="text-[11px] text-neutral-500 uppercase tracking-wider font-mono">
              Total HT Estimé
            </span>
            <div className="text-lg font-bold font-mono text-cyan-300">
              {engineResult.isFirmEstimationBlocked ? (
                <span className="text-amber-400 text-sm">Estimation ferme bloquée</span>
              ) : pricingCalculation.totalHTMin !== null && pricingCalculation.totalHTMax !== null ? (
                `${pricingCalculation.totalHTMin.toLocaleString('fr-FR')} € — ${pricingCalculation.totalHTMax.toLocaleString('fr-FR')} € HT`
              ) : (
                'À configurer (Taux manquant)'
              )}
            </div>
            <span className="text-[10px] text-neutral-500 block">
              Comprend {engineResult.totalEffortMin}h à {engineResult.totalEffortMax}h d'ingénierie
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] text-neutral-500 uppercase tracking-wider font-mono">
              Montant TVA ({pricing.taxRatePercent !== null ? `${pricing.taxRatePercent}%` : 'À configurer'})
            </span>
            <div className="text-lg font-bold font-mono text-neutral-300">
              {engineResult.isFirmEstimationBlocked ? (
                <span className="text-neutral-500 text-sm">En attente de validation</span>
              ) : pricingCalculation.taxAmountMin !== null && pricingCalculation.taxAmountMax !== null ? (
                `${pricingCalculation.taxAmountMin.toLocaleString('fr-FR')} € — ${pricingCalculation.taxAmountMax.toLocaleString('fr-FR')} €`
              ) : (
                'À configurer (Taux manquant)'
              )}
            </div>
            <span className="text-[10px] text-neutral-500 block">
              Régime fiscal à vérifier selon la situation de l’entreprise
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] text-neutral-500 uppercase tracking-wider font-mono">
              Total TTC Estimé
            </span>
            <div className="text-lg font-bold font-mono text-white">
              {engineResult.isFirmEstimationBlocked ? (
                <span className="text-amber-400 text-sm">Cadrage incomplet</span>
              ) : pricingCalculation.totalTTCMin !== null && pricingCalculation.totalTTCMax !== null ? (
                `${pricingCalculation.totalTTCMin.toLocaleString('fr-FR')} € — ${pricingCalculation.totalTTCMax.toLocaleString('fr-FR')} € TTC`
              ) : (
                'À configurer'
              )}
            </div>
            <span className="text-[10px] text-neutral-500 block">
              Coûts récurrents tiers : {engineResult.totalRecurringMonthlyCosts} € / mois
            </span>
          </div>
        </div>
      </div>

      {/* 2. Delivery Estimation, Client Dependencies & Planning Card */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-4">
        <div className="border-b border-neutral-800 pb-3 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-neutral-400 font-mono uppercase tracking-wider block">
              Planning & Délais de Référence
            </span>
            <h3 className="text-base font-semibold text-white tracking-tight mt-0.5">
              Délais d’Ingénierie & Dépendances Client
            </h3>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-neutral-200 font-mono bg-neutral-950 px-3 py-1 rounded-lg border border-neutral-800 font-semibold">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>
              {deliveryEstimate.label}
            </span>
          </div>
        </div>

        {scopeAlert?.exceedsStandard && (
          <div className="p-3.5 bg-amber-950/40 border border-amber-800/80 rounded-lg text-xs text-amber-200 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-semibold">Alerte périmètre non standard :</strong>
              <p className="text-[11px] text-amber-300/90 leading-relaxed mt-0.5">
                {scopeAlert.message}
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-xs font-medium text-neutral-200">
              Date cible de démarrage des travaux
            </label>
            <div className="relative">
              <input
                type="date"
                value={delivery.targetStartDate}
                onChange={(e) => handleDeliveryChange('targetStartDate', e.target.value)}
                className="w-full px-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded text-xs text-neutral-200 focus:outline-none focus:border-cyan-400"
              />
            </div>
            <p className="text-[10px] text-neutral-400">
              Détermine le rétroplanning et les jalons de validation des maquettes et recettes.
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-medium text-neutral-200">
              Notes de calendrier & jalons spécifiques
            </label>
            <textarea
              rows={2}
              value={delivery.notes}
              onChange={(e) => handleDeliveryChange('notes', e.target.value)}
              placeholder="Ex: Mise en ligne impérative avant le salon professionnel le 15 novembre..."
              className="w-full px-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded text-xs text-neutral-200 focus:outline-none focus:border-cyan-400"
            />
          </div>
        </div>

        {/* Critical Client Dependencies Checklist */}
        <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl space-y-2">
          <span className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
            <FileCheck className="w-4 h-4 text-cyan-400" />
            Fournitures & Dépendances Critiques du Client (Non imputables à NEXUS) :
          </span>
          <p className="text-[11px] text-neutral-400 leading-relaxed">
            Tout retard sur la fourniture de ces éléments suspend automatiquement le délai d’engagement :
          </p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs text-neutral-300">
            {deliveryEstimate.clientDependencies.map((dep, idx) => (
              <li
                key={idx}
                className="flex items-center gap-2 p-2 bg-neutral-900 border border-neutral-800 rounded text-[11px]"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
                <span>{dep}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
