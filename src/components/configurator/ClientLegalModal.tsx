import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { UserCheck, AlertTriangle, Building, Mail, Phone, MapPin, Receipt } from 'lucide-react';
import type { ClientLegalProfile } from '../../types/configurator';

interface ClientLegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialProfile: ClientLegalProfile;
  onSave: (profile: ClientLegalProfile) => void;
  clientDisplayName?: string;
}

export const ClientLegalModal: React.FC<ClientLegalModalProps> = ({
  isOpen,
  onClose,
  initialProfile,
  onSave,
  clientDisplayName,
}) => {
  const [form, setForm] = useState<ClientLegalProfile>({ ...initialProfile });

  useEffect(() => {
    setForm({ ...initialProfile });
  }, [initialProfile, isOpen]);

  const handleChange = (field: keyof ClientLegalProfile, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
    onClose();
  };

  // Missing legal fields for invoice check
  const missingForInvoice: string[] = [];
  if (!form.companyName.trim()) missingForInvoice.push('Nom ou Raison sociale du client');
  if (!form.address.trim() || !form.city.trim()) missingForInvoice.push('Adresse de facturation complète (Rue & Ville)');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Coordonnées Client & Facturation — ${clientDisplayName || form.companyName || 'Nouveau Client'}`}
      subtitle="Informations contractuelles indispensables pour les bons de commande et la facturation"
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSave} className="space-y-4 text-xs text-neutral-300">
        {missingForInvoice.length > 0 && (
          <div className="p-3 bg-amber-950/40 border border-amber-800/80 rounded-lg space-y-1">
            <div className="flex items-center gap-2 text-amber-300 font-semibold text-xs">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Champs indispensables pour finaliser une facture client</span>
            </div>
            <p className="text-neutral-400 text-[11px] leading-relaxed">
              Pour des raisons de conformité fiscale, la facture ne pourra pas être émise sans ces informations :{' '}
              <strong className="text-amber-200">{missingForInvoice.join(', ')}</strong>.
            </p>
          </div>
        )}

        <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl space-y-3">
          <div className="flex items-center gap-2 font-semibold text-neutral-100 text-xs">
            <Building className="w-4 h-4 text-neutral-400" />
            <span>Identité du Client</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-neutral-400 mb-1">
                Nom ou Raison sociale <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={form.companyName}
                onChange={(e) => handleChange('companyName', e.target.value)}
                placeholder="Ex: Entreprise Cliente SARL"
                className="w-full px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded text-xs text-neutral-200 focus:outline-none focus:border-neutral-700"
              />
            </div>

            <div>
              <label className="block text-[11px] text-neutral-400 mb-1">
                SIREN / SIRET (si entreprise)
              </label>
              <input
                type="text"
                value={form.sirenSiret || ''}
                onChange={(e) => handleChange('sirenSiret', e.target.value)}
                placeholder="Ex: 888 777 666 00019"
                className="w-full px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded text-xs text-neutral-200 font-mono focus:outline-none focus:border-neutral-700"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-neutral-400 mb-1">Nom du contact principal</label>
              <input
                type="text"
                value={form.contactName}
                onChange={(e) => handleChange('contactName', e.target.value)}
                placeholder="Ex: Jean Dupont"
                className="w-full px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded text-xs text-neutral-200 focus:outline-none focus:border-neutral-700"
              />
            </div>

            <div>
              <label className="block text-[11px] text-neutral-400 mb-1">Fonction du contact</label>
              <input
                type="text"
                value={form.contactRole || ''}
                onChange={(e) => handleChange('contactRole', e.target.value)}
                placeholder="Ex: Dirigeant, Directeur Marketing..."
                className="w-full px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded text-xs text-neutral-200 focus:outline-none focus:border-neutral-700"
              />
            </div>
          </div>
        </div>

        <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl space-y-3">
          <div className="flex items-center gap-2 font-semibold text-neutral-100 text-xs">
            <MapPin className="w-4 h-4 text-neutral-400" />
            <span>Adresse de Facturation</span>
          </div>

          <div>
            <label className="block text-[11px] text-neutral-400 mb-1">
              Adresse (Rue, numéro, voie) <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => handleChange('address', e.target.value)}
              placeholder="Ex: 45 rue de la République"
              className="w-full px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded text-xs text-neutral-200 focus:outline-none focus:border-neutral-700"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] text-neutral-400 mb-1">
                Code postal <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={form.postalCode}
                onChange={(e) => handleChange('postalCode', e.target.value)}
                placeholder="Ex: 69002"
                className="w-full px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded text-xs text-neutral-200 focus:outline-none focus:border-neutral-700"
              />
            </div>

            <div>
              <label className="block text-[11px] text-neutral-400 mb-1">
                Ville <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => handleChange('city', e.target.value)}
                placeholder="Ex: Lyon"
                className="w-full px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded text-xs text-neutral-200 focus:outline-none focus:border-neutral-700"
              />
            </div>

            <div>
              <label className="block text-[11px] text-neutral-400 mb-1">Pays</label>
              <input
                type="text"
                value={form.country}
                onChange={(e) => handleChange('country', e.target.value)}
                placeholder="Ex: France"
                className="w-full px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded text-xs text-neutral-200 focus:outline-none focus:border-neutral-700"
              />
            </div>
          </div>
        </div>

        <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl space-y-3">
          <div className="flex items-center gap-2 font-semibold text-neutral-100 text-xs">
            <Mail className="w-4 h-4 text-neutral-400" />
            <span>Contact & TVA Client</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] text-neutral-400 mb-1">Email pour facturation</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="compta@client.fr"
                className="w-full px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded text-xs text-neutral-200 focus:outline-none focus:border-neutral-700"
              />
            </div>

            <div>
              <label className="block text-[11px] text-neutral-400 mb-1">Téléphone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="+33 4 72 ..."
                className="w-full px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded text-xs text-neutral-200 focus:outline-none focus:border-neutral-700"
              />
            </div>

            <div>
              <label className="block text-[11px] text-neutral-400 mb-1">N° TVA Intracommunautaire</label>
              <input
                type="text"
                value={form.vatNumber || ''}
                onChange={(e) => handleChange('vatNumber', e.target.value)}
                placeholder="Ex: FR 88 888777666"
                className="w-full px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded text-xs text-neutral-200 font-mono focus:outline-none focus:border-neutral-700"
              />
            </div>
          </div>
        </div>

        <div className="pt-2 flex items-center justify-end gap-3 border-t border-neutral-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-xs font-medium transition-colors"
          >
            Fermer
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-white hover:bg-neutral-100 text-neutral-950 rounded-lg text-xs font-medium transition-colors shadow-xs"
          >
            Valider les coordonnées
          </button>
        </div>
      </form>
    </Modal>
  );
};
