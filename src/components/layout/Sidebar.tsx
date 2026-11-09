import React from 'react';
import {
  LayoutDashboard,
  PhoneCall,
  Layers,
  Users,
  CheckSquare,
  Briefcase,
  Sliders,
  GitBranch,
  Cpu,
  Settings,
  LogOut,
  ShieldCheck,
  X,
  MapPin,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import type { ActiveSection } from '../../types/nexus';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { NexusLogo } from '../brand/NexusLogo';

interface SidebarProps {
  currentSection: ActiveSection;
  onSelectSection: (section: ActiveSection) => void;
  isOpenMobile: boolean;
  onToggleMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentSection,
  onSelectSection,
  isOpenMobile,
  onToggleMobile,
}) => {
  const { user, logout, configuredOwnerEmail } = useAuth();
  const { kpis, phoningCampaigns, prospects } = useData();

  // Navigation organized into executive operational groups
  const navigationGroups: {
    groupTitle: string;
    items: {
      id: ActiveSection;
      label: string;
      icon: React.ElementType;
      badge?: number | string;
      badgeAlert?: boolean;
    }[];
  }[] = [
    {
      groupTitle: 'Prospection & Exécution',
      items: [
        {
          id: 'cockpit',
          label: 'Cockpit Central',
          icon: LayoutDashboard,
        },
        {
          id: 'phoning',
          label: 'Poste Phoning & Appels',
          icon: PhoneCall,
        },
        {
          id: 'campaigns',
          label: 'Campagnes & Scraping',
          icon: Layers,
          badge: phoningCampaigns.length > 0 ? phoningCampaigns.length : undefined,
        },
        {
          id: 'prospects',
          label: 'Fichier Prospects & Maps',
          icon: Users,
          badge: kpis.activeProspects > 0 ? kpis.activeProspects : undefined,
        },
        {
          id: 'tasks',
          label: 'Actions & Relances',
          icon: CheckSquare,
          badge: kpis.todayTasks.length > 0 ? kpis.todayTasks.length : undefined,
          badgeAlert: kpis.overdueTasksCount > 0,
        },
      ],
    },
    {
      groupTitle: 'Solutions & Chiffrage',
      items: [
        {
          id: 'offers',
          label: 'Offres & Solutions',
          icon: Briefcase,
          badge: kpis.activeOffersCount > 0 ? kpis.activeOffersCount : undefined,
        },
        {
          id: 'projects',
          label: 'Projets Clients',
          icon: Layers,
          badge: kpis.activeProjects > 0 ? kpis.activeProjects : undefined,
        },
        {
          id: 'configurator',
          label: 'Configurateur Web 24pts',
          icon: Sliders,
        },
      ],
    },
    {
      groupTitle: 'Gouvernance & Système',
      items: [
        {
          id: 'branches_reports',
          label: 'Branches & Rapports',
          icon: GitBranch,
        },
        {
          id: 'automations',
          label: 'Automatisations',
          icon: Cpu,
        },
        {
          id: 'settings',
          label: 'Paramètres & Nettoyage',
          icon: Settings,
        },
      ],
    },
  ];

  const handleSelect = (id: ActiveSection) => {
    onSelectSection(id);
    if (isOpenMobile) onToggleMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-neutral-950/80 backdrop-blur-xs md:hidden"
          onClick={onToggleMobile}
        />
      )}

      {/* Sidebar container with metallic obsidian styling */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-[#07080B] border-r border-neutral-800/90 flex flex-col justify-between transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand header */}
        <div className="p-4 border-b border-neutral-800/80 relative">
          <div className="flex items-center justify-between">
            <NexusLogo variant="sidebar" showSubtext={true} />
            <button
              type="button"
              onClick={onToggleMobile}
              className="p-1 text-neutral-400 hover:text-white md:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* DNA & Principles Micro-Card with subtle dual-glow */}
          <div className="mt-3 p-2.5 rounded-lg bg-neutral-950/80 border border-neutral-800/80 relative overflow-hidden text-[10px] space-y-1">
            <div className="absolute top-0 left-0 w-1/2 h-[1px] bg-red-500/40" />
            <div className="absolute top-0 right-0 w-1/2 h-[1px] bg-blue-500/40" />
            <p className="text-neutral-300 font-mono tracking-tight font-semibold">
              « THINK HUMAN, EXECUTE AI, EVOLVE HYBRID. »
            </p>
            <p className="text-neutral-500 italic">
              « L’entreprise d’abord. La technologie ensuite. »
            </p>
          </div>
        </div>

        {/* Grouped Navigation */}
        <nav className="flex-1 px-3 py-3 space-y-4 overflow-y-auto">
          {navigationGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-1">
              <span className="px-2.5 text-[9px] font-mono uppercase tracking-[0.2em] text-neutral-500 font-semibold block">
                {group.groupTitle}
              </span>

              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = currentSection === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelect(item.id)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer relative ${
                      isActive
                        ? 'bg-neutral-900 text-white font-semibold shadow-xs ring-1 ring-neutral-700/80'
                        : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/40'
                    }`}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-gradient-to-b from-red-500 to-blue-500" />
                    )}

                    <div className="flex items-center gap-2.5">
                      <Icon
                        className={`w-4 h-4 transition-colors ${
                          isActive ? 'text-white' : 'text-neutral-500'
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>

                    {item.badge !== undefined && (
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                          item.badgeAlert
                            ? 'bg-red-950 text-red-300 border border-red-800'
                            : isActive
                            ? 'bg-neutral-800 text-neutral-200'
                            : 'bg-neutral-950 text-neutral-400 border border-neutral-800'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Owner profile & Logout with verified status */}
        <div className="p-3 border-t border-neutral-800/80 bg-neutral-950/60">
          <div className="px-2.5 py-2 mb-2 rounded-lg bg-neutral-900/80 border border-neutral-800 flex items-center justify-between">
            <div className="truncate mr-2">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-neutral-200">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="truncate">Dirigeant Propriétaire</span>
              </div>
              <p className="text-[10px] text-neutral-400 font-mono truncate">
                {user?.email || configuredOwnerEmail}
              </p>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" title="Connecté" />
          </div>

          <button
            type="button"
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-3 py-1.5 text-xs text-neutral-400 hover:text-red-300 hover:bg-neutral-900 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>
    </>
  );
};
