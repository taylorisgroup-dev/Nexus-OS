import React from 'react';
import { Menu, Plus, ShieldCheck, MapPin, Sparkles } from 'lucide-react';
import type { ActiveSection } from '../../types/nexus';
import { NexusLogo } from '../brand/NexusLogo';

interface HeaderProps {
  currentSection: ActiveSection;
  onOpenMobileSidebar: () => void;
  onQuickAction?: () => void;
  quickActionLabel?: string;
}

export const Header: React.FC<HeaderProps> = ({
  currentSection,
  onOpenMobileSidebar,
  onQuickAction,
  quickActionLabel,
}) => {
  const titles: Record<ActiveSection, { title: string; subtitle: string }> = {
    cockpit: {
      title: 'Cockpit Dirigeant',
      subtitle: 'Vue d’ensemble stratégique, pipeline et actions prioritaires du jour',
    },
    campaigns: {
      title: 'Campagnes & Scraping B2B',
      subtitle: 'Campagnes ciblées, extraction d’entreprises réelles et scripts adaptés',
    },
    acquisition: {
      title: 'Scraping & Acquisition Directe',
      subtitle: 'Extraction en direct de données réelles vérifiées sur Google Maps et le web',
    },
    prospects: {
      title: 'Fichier Prospects & Données Vérifiées',
      subtitle: 'Entreprises réelles, coordonnées vérifiées Google Maps et audit web',
    },
    phoning: {
      title: 'Poste de Prospection Téléphonique',
      subtitle: 'Poste concentré opérationnel · Numérotation manuelle & qualification de cadrage',
    },
    offers: {
      title: 'Catalogue des Offres & Solutions',
      subtitle: 'Ingénierie d’affaires, digitalisation et automatisation NEXUS',
    },
    projects: {
      title: 'Projets Clients & Déploiements',
      subtitle: 'Orchestration des missions et suivi de livraison opérationnelle',
    },
    tasks: {
      title: 'Actions & Relances Commerciales',
      subtitle: 'Priorités, suivi des échéances et relances issues des appels',
    },
    branches_reports: {
      title: 'Branches & Rapports de Consolidation',
      subtitle: 'Maturité des pôles NEXUS, gouvernance transversale et rentabilité',
    },
    automations: {
      title: 'Centre d’Automatisations & Alertes',
      subtitle: 'Règles internes sûres, notifications in-app et garde-fous humains',
    },
    configurator: {
      title: 'Configurateur Web & Documents',
      subtitle: 'NEXUS Digital · Cadrage 24 points, chiffrage et documents contractuels',
    },
    ideas_decisions: {
      title: 'Idées & Décisions Stratégiques',
      subtitle: 'Registre d’innovation et journal de gouvernance interne',
    },
    settings: {
      title: 'Paramètres & Nettoyage des Données',
      subtitle: 'Purge des données d’exemple, exports CSV/JSON et sécurité Firestore',
    },
  };

  const current = titles[currentSection] || titles.cockpit;

  return (
    <header className="sticky top-0 z-30 h-16 bg-[#07080B]/95 backdrop-blur-md border-b border-neutral-800/80 px-4 sm:px-8 flex items-center justify-between">
      {/* Zone 1: Mobile toggle & Brand Logo */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          className="p-1.5 text-neutral-400 hover:text-white rounded-lg md:hidden cursor-pointer"
          aria-label="Ouvrir le menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <NexusLogo variant="header" showSubtext={false} />
          <div className="hidden sm:flex items-center gap-2 text-xs text-neutral-400">
            <span className="text-neutral-600">/</span>
            <span className="font-semibold text-neutral-100">{current.title}</span>
          </div>
        </div>
      </div>

      {/* Zone 2: Subtitle / Context (Middle zone) */}
      <div className="hidden lg:flex items-center gap-2 text-xs text-neutral-400">
        <span className="text-neutral-400">{current.subtitle}</span>
      </div>

      {/* Zone 3: Security & Fast Action */}
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-neutral-900 border border-neutral-800 text-[11px] text-neutral-300">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Firestore Certifié</span>
        </div>

        {quickActionLabel && onQuickAction && (
          <button
            type="button"
            onClick={onQuickAction}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-neutral-100 text-neutral-950 font-bold text-xs rounded-lg transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{quickActionLabel}</span>
          </button>
        )}
      </div>
    </header>
  );
};
