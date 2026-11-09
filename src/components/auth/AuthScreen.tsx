import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Shield, Lock, AlertTriangle, ArrowRight, LogOut } from 'lucide-react';
import { NexusLogo } from '../brand/NexusLogo';
import { NexusBanner } from '../brand/NexusBanner';

export const AuthScreen: React.FC = () => {
  const {
    user,
    isOwner,
    configuredOwnerEmail,
    authError,
    loginWithGoogle,
    logout,
    clearError,
  } = useAuth();

  // If a user is logged in, but not the configured owner
  if (user && !isOwner) {
    return (
      <div className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-neutral-900 border border-red-900/50 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-red-600" />
          <div className="flex items-center gap-3 text-red-400 mb-6">
            <div className="p-2.5 bg-red-950/80 border border-red-800 rounded-lg">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-neutral-100">
                Accès non autorisé
              </h2>
              <p className="text-xs text-red-400">Instance privée verrouillée</p>
            </div>
          </div>

          <div className="space-y-4 text-sm text-neutral-300 leading-relaxed border-t border-neutral-800 pt-4">
            <p>
              Ce cockpit <strong className="text-white font-medium">NEXUS OS</strong> est strictement réservé au compte dirigeant propriétaire configuré :
            </p>
            <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg font-mono text-xs text-neutral-300 break-all select-all">
              {configuredOwnerEmail}
            </div>
            <p className="text-neutral-400 text-xs">
              Compte actuellement connecté : <span className="font-mono text-neutral-200">{user.email || 'Anonyme'}</span>.
            </p>
            <div className="bg-red-950/30 border border-red-900/30 p-3 rounded-lg text-xs text-red-300">
              Règles Firestore deny-by-default : aucune donnée ni écran métier n’est accessible depuis cette identité.
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3">
            <button
              type="button"
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs font-medium transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Se déconnecter et changer de compte
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Not signed in
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col justify-between p-6 sm:p-12 relative overflow-hidden">
      {/* Background subtle geometry */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-neutral-900/60 via-neutral-950 to-neutral-950 pointer-events-none" />

      {/* Top Bar minimal */}
      <div className="relative z-10 flex items-center justify-between">
        <NexusLogo variant="header" showSubtext={true} />
        <div className="flex items-center gap-2 text-xs text-neutral-400">
          <Shield className="w-3.5 h-3.5 text-emerald-500" />
          <span>Accès privé certifié</span>
        </div>
      </div>

      {/* Central Login Box with Ambient Banner Styling */}
      <div className="relative z-10 my-auto py-10 max-w-xl mx-auto w-full space-y-6">
        <NexusBanner
          title="Cockpit Privé NEXUS OS"
          subtitle="Partenaire d’ingénierie d’affaires et de digitalisation."
          showMotto={false}
          className="p-6"
        />

        <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-8 sm:p-10 shadow-2xl backdrop-blur-md">
          <div className="space-y-3 mb-8">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-neutral-800 text-neutral-300 text-xs font-medium">
              <Lock className="w-3.5 h-3.5 text-neutral-400" />
              <span>Cockpit dirigeant solo</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white">
              Piloter NEXUS Premium Solutions
            </h2>
            <p className="text-sm text-neutral-400 leading-relaxed">
              Analyse des besoins avant orchestration des solutions adaptées.
            </p>
          </div>

          {/* DNA & Principles */}
          <div className="p-4 bg-neutral-950/60 border border-neutral-800/80 rounded-xl space-y-2 mb-8 text-xs">
            <div className="flex items-baseline gap-2">
              <span className="text-neutral-500 uppercase tracking-wider text-[10px]">ADN</span>
              <span className="text-neutral-200 font-medium">
                « THINK HUMAN, EXECUTE AI, EVOLVE HYBRID. »
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-neutral-500 uppercase tracking-wider text-[10px]">Principe</span>
              <span className="text-neutral-300">
                « L’entreprise d’abord. La technologie ensuite. »
              </span>
            </div>
          </div>

          {authError && (
            <div className="mb-6 p-3 bg-red-950/40 border border-red-900/50 rounded-lg flex items-center justify-between text-xs text-red-300">
              <span>{authError}</span>
              <button
                type="button"
                onClick={clearError}
                className="text-red-400 hover:text-red-200 ml-2"
              >
                ✕
              </button>
            </div>
          )}

          {/* Login Button */}
          <button
            type="button"
            onClick={loginWithGoogle}
            className="w-full flex items-center justify-center gap-3 px-5 py-3 bg-white hover:bg-neutral-100 text-neutral-950 rounded-xl font-medium text-sm transition-all shadow-md hover:shadow-lg active:scale-[0.99] cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <span>Connexion Google - Compte Dirigeant</span>
            <ArrowRight className="w-4 h-4 ml-1 text-neutral-600" />
          </button>

          <div className="mt-6 text-center">
            <p className="text-[11px] text-neutral-500">
              Accès réservé au compte certifié <span className="font-mono text-neutral-400">{configuredOwnerEmail}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Footer minimal */}
      <div className="relative z-10 text-center text-xs text-neutral-500 flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-neutral-900 pt-6">
        <span>© {new Date().getFullYear()} NEXUS Premium Solutions. Tous droits réservés.</span>
        <div className="flex items-center gap-4 text-[11px] text-neutral-500">
          <span>Firestore Deny-by-Default</span>
          <span>·</span>
          <span>Zéro appel externe non sollicité</span>
          <span>·</span>
          <span>Données souveraines</span>
        </div>
      </div>
    </div>
  );
};
