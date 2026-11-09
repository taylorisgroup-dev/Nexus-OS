import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Modal } from '../ui/Modal';
import {
  AlertTriangle,
  Building,
  Receipt,
  Image as ImageIcon,
  Upload,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import type { CompanyLegalProfile } from '../../types/configurator';
import { NexusLogo } from '../brand/NexusLogo';

interface CompanyLegalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CompanyLegalModal: React.FC<CompanyLegalModalProps> = ({ isOpen, onClose }) => {
  const { companyLegal, updateCompanyLegal } = useData();

  const [form, setForm] = useState<CompanyLegalProfile>({ ...companyLegal });
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const handleChange = (field: keyof CompanyLegalProfile, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const base64 = uploadEvent.target?.result as string;
        handleChange('logoUrl', base64);
        if (typeof window !== 'undefined') {
          localStorage.setItem('nexus_logo_url', base64);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const base64 = uploadEvent.target?.result as string;
        handleChange('bannerUrl', base64);
        if (typeof window !== 'undefined') {
          localStorage.setItem('nexus_banner_url', base64);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (typeof window !== 'undefined') {
        if (form.logoUrl) localStorage.setItem('nexus_logo_url', form.logoUrl);
        if (form.bannerUrl) localStorage.setItem('nexus_banner_url', form.bannerUrl);
      }
      await updateCompanyLegal(form);
      setSaveStatus('Profil légal & identité de marque NEXUS enregistrés avec succès.');
      setTimeout(() => {
        setSaveStatus(null);
        onClose();
      }, 1200);
    } catch (err: unknown) {
      console.error(err);
    }
  };

  // Missing legal fields check
  const missingFields: string[] = [];
  if (!form.companyName.trim()) missingFields.push('Raison sociale');
  if (!form.sirenSiret.trim()) missingFields.push('SIREN / SIRET');
  if (!form.address.trim() || !form.city.trim()) missingFields.push('Adresse postale');
  if (!form.vatNumber.trim()) missingFields.push('Numéro TVA intracommunautaire');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Paramètres Légaux, Fiscaux & Marque — NEXUS Digital"
      subtitle="Coordonnées officielles requises pour les bons de commande, factures et branding"
      maxWidth="max-w-3xl"
    >
      <form onSubmit={handleSave} className="space-y-5 text-xs text-neutral-300">
        {saveStatus && (
          <div className="p-3 bg-emerald-950/80 border border-emerald-800 text-emerald-300 rounded-lg">
            {saveStatus}
          </div>
        )}

        {missingFields.length > 0 && (
          <div className="p-3.5 bg-amber-950/40 border border-amber-800/80 rounded-lg space-y-1">
            <div className="flex items-center gap-2 text-amber-300 font-semibold">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Mentions légales obligatoires manquantes pour facturation</span>
            </div>
            <p className="text-neutral-400 text-[11px] leading-relaxed">
              Tant que ces mentions ne sont pas renseignées, la finalisation d’une facture sera strictement bloquée :{' '}
              <strong className="text-amber-200">{missingFields.join(', ')}</strong>.
            </p>
          </div>
        )}

        {/* 1. Coordonnées de l'entreprise */}
        <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl space-y-3">
          <div className="flex items-center gap-2 font-semibold text-neutral-100 text-xs">
            <Building className="w-4 h-4 text-neutral-400" />
            <span>Identité Commerciale & Siège Social</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-neutral-400 mb-1">
                Raison sociale officielle <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={form.companyName}
                onChange={(e) => handleChange('companyName', e.target.value)}
                placeholder="Ex: NEXUS Premium Solutions"
                className="w-full px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded text-xs text-neutral-200 focus:outline-none focus:border-neutral-700"
              />
            </div>

            <div>
              <label className="block text-[11px] text-neutral-400 mb-1">Nom commercial / Branche</label>
              <input
                type="text"
                value={form.tradeName}
                onChange={(e) => handleChange('tradeName', e.target.value)}
                placeholder="Ex: NEXUS Digital"
                className="w-full px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded text-xs text-neutral-200 focus:outline-none focus:border-neutral-700"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] text-neutral-400 mb-1">Forme juridique</label>
              <input
                type="text"
                value={form.legalForm}
                onChange={(e) => handleChange('legalForm', e.target.value)}
                placeholder="Ex: SASU, EURL, SARL..."
                className="w-full px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded text-xs text-neutral-200 focus:outline-none focus:border-neutral-700"
              />
            </div>

            <div>
              <label className="block text-[11px] text-neutral-400 mb-1">
                Numéro SIREN / SIRET <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={form.sirenSiret}
                onChange={(e) => handleChange('sirenSiret', e.target.value)}
                placeholder="Ex: 912 345 678 00012"
                className="w-full px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded text-xs text-neutral-200 focus:outline-none focus:border-neutral-700"
              />
            </div>

            <div>
              <label className="block text-[11px] text-neutral-400 mb-1">RCS / Ville d'immatriculation</label>
              <input
                type="text"
                value={form.rcsNumber}
                onChange={(e) => handleChange('rcsNumber', e.target.value)}
                placeholder="Ex: RCS Paris B 912 345 678"
                className="w-full px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded text-xs text-neutral-200 focus:outline-none focus:border-neutral-700"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-[11px] text-neutral-400 mb-1">
                Adresse postale du siège <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => handleChange('address', e.target.value)}
                placeholder="Ex: 12 avenue des Opérations"
                className="w-full px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded text-xs text-neutral-200 focus:outline-none focus:border-neutral-700"
              />
            </div>

            <div>
              <label className="block text-[11px] text-neutral-400 mb-1">
                Ville & Code Postal <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => handleChange('city', e.target.value)}
                placeholder="Ex: 75008 Paris"
                className="w-full px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded text-xs text-neutral-200 focus:outline-none focus:border-neutral-700"
              />
            </div>
          </div>
        </div>

        {/* 2. Marque & Emplacement Logo */}
        <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-semibold text-neutral-100 text-xs">
              <ImageIcon className="w-4 h-4 text-cyan-400" />
              <span>Identité Visuelle & Actifs de Marque NEXUS</span>
            </div>
            <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider">
              Charte & Documents
            </span>
          </div>

          <div className="p-3 bg-neutral-900/60 border border-neutral-800 rounded-lg text-[11px] text-neutral-400 leading-relaxed space-y-1">
            <p>
              <strong className="text-neutral-200">Emplacement de marque dédié :</strong> Le logo clair remplace le monogramme dans l’en-tête et s’intègre dans tous les documents émis. Le visuel sombre sert de bannière d’ambiance.
            </p>
            <p className="text-[10px] text-neutral-500 italic">
              Note de transparence : Si les fichiers de marque ne sont pas stockés dans le système de fichiers du serveur, vous pouvez charger directement l’image locale ci-dessous ou saisir son URL. En l’absence de fichier image, la typographie et la charte vectorielle originale (graphite #17191D, noir bleuté #0B1018, argent #D9DCE2, rouge #E3262E, bleu #0879E8) sont appliquées avec rigueur sans feindre une intégration non réalisée.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Logo clair */}
            <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-neutral-200 text-xs">
                  Logo clair (En-tête & Documents)
                </span>
                {form.logoUrl && (
                  <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
                    <CheckCircle2 className="w-3 h-3" /> Fichier actif
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={form.logoUrl || ''}
                  onChange={(e) => handleChange('logoUrl', e.target.value)}
                  placeholder="/brand/logo-nps.png ou URL..."
                  className="flex-1 px-2.5 py-1.5 bg-neutral-950 border border-neutral-800 rounded text-xs text-neutral-200 font-mono focus:outline-none focus:border-neutral-700"
                />
                <label className="px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded text-xs cursor-pointer flex items-center gap-1 shrink-0 font-medium transition-colors">
                  <Upload className="w-3 h-3" />
                  <span>Charger</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Live Preview with white margin crop */}
              <div className="pt-1 space-y-1">
                <span className="text-[10px] text-neutral-500 block">
                  Aperçu du rendu (avec rognage des marges blanches) :
                </span>
                <div className="p-2 bg-neutral-950 border border-neutral-800 rounded flex items-center justify-center">
                  <NexusLogo
                    variant="document"
                    showSubtext={true}
                    imageSrc={form.logoUrl || undefined}
                  />
                </div>
              </div>
            </div>

            {/* Bannière sombre */}
            <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-neutral-200 text-xs">
                  Visuel sombre d'ambiance (Bannière)
                </span>
                {form.bannerUrl && (
                  <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
                    <CheckCircle2 className="w-3 h-3" /> Fichier actif
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={form.bannerUrl || ''}
                  onChange={(e) => handleChange('bannerUrl', e.target.value)}
                  placeholder="/brand/banner-dark.png ou URL..."
                  className="flex-1 px-2.5 py-1.5 bg-neutral-950 border border-neutral-800 rounded text-xs text-neutral-200 font-mono focus:outline-none focus:border-neutral-700"
                />
                <label className="px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded text-xs cursor-pointer flex items-center gap-1 shrink-0 font-medium transition-colors">
                  <Upload className="w-3 h-3" />
                  <span>Charger</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleBannerUpload}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="pt-1 space-y-1">
                <span className="text-[10px] text-neutral-500 block">
                  Aperçu d'ambiance :
                </span>
                <div className="h-16 rounded overflow-hidden relative border border-neutral-800 bg-neutral-950 flex items-center justify-center px-3">
                  {form.bannerUrl ? (
                    <img
                      src={form.bannerUrl}
                      alt="Banner Preview"
                      className="absolute inset-0 w-full h-full object-cover opacity-50"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-900/30 via-neutral-950 to-red-900/30" />
                  )}
                  <span className="relative z-10 text-[10px] font-mono text-neutral-300 font-semibold tracking-wider">
                    THINK HUMAN, EXECUTE AI, EVOLVE HYBRID.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Fiscalité & Facturation */}
        <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl space-y-3">
          <div className="flex items-center gap-2 font-semibold text-neutral-100 text-xs">
            <Receipt className="w-4 h-4 text-neutral-400" />
            <span>Fiscalité, TVA & Numérotation</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-[11px] text-neutral-400 mb-1">
                Numéro TVA ou Mention fiscale officielle <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={form.vatNumber}
                onChange={(e) => handleChange('vatNumber', e.target.value)}
                placeholder="À vérifier selon la situation fiscale exacte de NEXUS Premium Solutions"
                className="w-full px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded text-xs text-neutral-200 focus:outline-none focus:border-neutral-700"
              />
              <span className="text-[10px] text-neutral-500 mt-1 block">
                À renseigner selon la situation fiscale exacte (assujettissement à la TVA, franchise ou exonération spécifique).
              </span>
            </div>

            <div>
              <label className="block text-[11px] text-neutral-400 mb-1">Préfixe de facture</label>
              <input
                type="text"
                value={form.invoiceNumberPrefix}
                onChange={(e) => handleChange('invoiceNumberPrefix', e.target.value)}
                placeholder="Ex: FAC-ND-"
                className="w-full px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded text-xs text-neutral-200 focus:outline-none focus:border-neutral-700"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] text-neutral-400 mb-1">Coordonnées bancaires pour règlement (IBAN / BIC)</label>
            <input
              type="text"
              value={form.ibanBic}
              onChange={(e) => handleChange('ibanBic', e.target.value)}
              placeholder="Ex: FR76 3000 4000 0000 0000 000 / BIC : BNPAFRPP"
              className="w-full px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded text-xs text-neutral-200 font-mono focus:outline-none focus:border-neutral-700"
            />
          </div>

          <div>
            <label className="block text-[11px] text-neutral-400 mb-1">Mentions légales obligatoires & pénalités de retard</label>
            <textarea
              rows={2}
              value={form.legalNotice}
              onChange={(e) => handleChange('legalNotice', e.target.value)}
              className="w-full px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded text-[11px] text-neutral-300 focus:outline-none focus:border-neutral-700"
            />
          </div>
        </div>

        <div className="pt-2 flex items-center justify-end gap-3 border-t border-neutral-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-xs font-medium transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-white hover:bg-neutral-100 text-neutral-950 rounded-lg text-xs font-medium transition-colors shadow-xs"
          >
            Enregistrer les paramètres
          </button>
        </div>
      </form>
    </Modal>
  );
};
