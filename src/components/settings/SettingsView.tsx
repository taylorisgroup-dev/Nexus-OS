import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { testConnection } from '../../lib/firebase';
import {
  ShieldCheck,
  Database,
  Download,
  Trash2,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  FileCode,
  Lock,
  UserCheck,
} from 'lucide-react';
import { NexusLogo } from '../brand/NexusLogo';
import { NexusBanner } from '../brand/NexusBanner';

export const SettingsView: React.FC = () => {
  const { user, configuredOwnerEmail, isOwner } = useAuth();
  const {
    prospects,
    offers,
    projects,
    tasks,
    ideas,
    decisions,
    cleanFakeData,
    clearAllData,
    exportToCSV,
    exportToJSON,
  } = useData();

  const [connectionStatus, setConnectionStatus] = useState<{
    tested: boolean;
    ok: boolean;
    message: string;
    loading: boolean;
  }>({
    tested: false,
    ok: false,
    message: '',
    loading: false,
  });

  const [cleaningFakeLoading, setCleaningFakeLoading] = useState(false);
  const [clearingLoading, setClearingLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const runConnectionCheck = async () => {
    setConnectionStatus((prev) => ({ ...prev, loading: true }));
    const result = await testConnection();
    setConnectionStatus({
      tested: true,
      ok: result.ok,
      message: result.message,
      loading: false,
    });
  };

  useEffect(() => {
    runConnectionCheck();
  }, []);

  const handleCleanFake = async () => {
    if (
      !confirm(
        'Supprimer toutes les données factices ou de test (prospects contenant "Fictif" et campagnes de démonstration) ?'
      )
    )
      return;
    setCleaningFakeLoading(true);
    setActionSuccess(null);
    try {
      const res = await cleanFakeData();
      setActionSuccess(
        `Nettoyage terminé : ${res.deletedProspects} prospect(s) factice(s) et ${res.deletedCampaigns} campagne(s) de test supprimé(s). Base 100% propre !`
      );
    } catch (err: unknown) {
      console.error(err);
      setActionSuccess('Erreur lors du nettoyage.');
    } finally {
      setCleaningFakeLoading(false);
    }
  };

  const handleClear = async () => {
    if (
      !confirm(
        'ATTENTION : Supprimer définitivement toutes les données (prospects, offres, projets, tâches, idées, décisions) ? Cette action est irréversible.'
      )
    )
      return;
    setClearingLoading(true);
    setActionSuccess(null);
    try {
      await clearAllData();
      setActionSuccess('Toutes les données ont été purgées avec succès.');
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setClearingLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {actionSuccess && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-900 text-emerald-300 text-xs rounded-xl flex items-center justify-between">
          <span>{actionSuccess}</span>
          <button
            type="button"
            onClick={() => setActionSuccess(null)}
            className="text-emerald-400 hover:text-white ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Brand Identity & Visual Assets */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-5">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 block font-semibold">
            Charte Graphique & Marque
          </span>
          <h2 className="text-sm font-semibold tracking-tight text-white mt-0.5">
            Identité Visuelle NEXUS Premium Solutions
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            Application des actifs de marque : logo clair avec recadrage automatique des marges blanches pour l’en-tête et les documents, et visuel sombre pour les bannières d’ambiance.
          </p>
        </div>

        <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <NexusLogo variant="large" showSubtext={true} />
            <div className="flex items-center gap-2 font-mono text-[11px]">
              <span className="px-2.5 py-1 rounded bg-red-950/80 border border-red-800 text-red-300">
                Rouge ADN : #DC2626
              </span>
              <span className="px-2.5 py-1 rounded bg-blue-950/80 border border-blue-800 text-blue-300">
                Bleu Cobalt : #2563EB
              </span>
              <span className="px-2.5 py-1 rounded bg-neutral-800 border border-neutral-700 text-neutral-300">
                Titane : #0F172A
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-neutral-800 text-xs text-neutral-400 leading-relaxed">
            <strong>Intégration des fichiers locaux :</strong> Si vous déposez vos fichiers <code className="text-neutral-200">logo-nps.png</code> et <code className="text-neutral-200">banner-nexus.png</code> dans les assets publics, NEXUS OS les détecte automatiquement et recadre les bordures blanches périphériques sans déformation.
          </div>
        </div>
      </div>

      {/* 1. Executive Identity & Security Audit */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-3 border-b border-neutral-800 pb-4">
          <div className="p-2.5 bg-neutral-950 border border-neutral-800 rounded-lg text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold tracking-tight text-white">
              Identité Dirigeant & Sécurité Firestore
            </h2>
            <p className="text-xs text-neutral-400">
              Contrôle d’accès propriétaire strict et modèle deny-by-default
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-lg space-y-2">
            <div className="text-neutral-500 font-medium flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Compte Propriétaire Autorisé</span>
            </div>
            <div className="font-mono text-sm text-neutral-200 select-all break-all">
              {configuredOwnerEmail}
            </div>
            <div className="text-[11px] text-emerald-400/90 pt-1">
              ✓ Vérification cryptographique par token Google OAuth email_verified
            </div>
          </div>

          <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-lg space-y-2">
            <div className="text-neutral-500 font-medium flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Politique Firestore</span>
            </div>
            <div className="font-semibold text-neutral-200">
              Deny-by-default Strict (Zéro fuite)
            </div>
            <div className="text-[11px] text-neutral-400 leading-relaxed pt-1">
              Toutes les règles rejettent les requêtes anonymes ou extérieures. Aucun secret stocké dans le navigateur.
            </div>
          </div>
        </div>

        {/* Live Firestore Connection Status */}
        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-neutral-950/60 p-3.5 rounded-lg border border-neutral-800/80 text-xs">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-neutral-400" />
            <span className="text-neutral-300">État de la connexion Firestore :</span>
            {connectionStatus.loading ? (
              <span className="text-neutral-400 flex items-center gap-1">
                <RefreshCw className="w-3 h-3 animate-spin" />
                Vérification...
              </span>
            ) : connectionStatus.ok ? (
              <span className="text-emerald-400 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Opérationnel ({connectionStatus.message})
              </span>
            ) : (
              <span className="text-red-400 font-medium flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                {connectionStatus.message}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={runConnectionCheck}
            disabled={connectionStatus.loading}
            className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded text-xs transition-colors shrink-0 cursor-pointer disabled:opacity-50"
          >
            Tester à nouveau
          </button>
        </div>
      </div>

      {/* 2. Global Exports (CSV & JSON) */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-3 border-b border-neutral-800 pb-4">
          <div className="p-2.5 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-300">
            <Download className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold tracking-tight text-white">
              Exportations Complètes des Données
            </h2>
            <p className="text-xs text-neutral-400">
              Téléchargement souverain des tables métiers en CSV (tableur) ou JSON brut
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          {/* Prospects */}
          <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg space-y-2 flex flex-col justify-between">
            <div>
              <span className="font-semibold text-neutral-200 block">Prospects ({prospects.length})</span>
              <span className="text-[11px] text-neutral-500">Coordonnées & Besoins</span>
            </div>
            <div className="flex gap-1.5 pt-2">
              <button
                type="button"
                onClick={() => exportToCSV('prospects')}
                className="flex-1 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded text-[11px] font-medium transition-colors"
              >
                CSV
              </button>
              <button
                type="button"
                onClick={() => exportToJSON('prospects')}
                className="flex-1 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded text-[11px] font-medium transition-colors"
              >
                JSON
              </button>
            </div>
          </div>

          {/* Offers */}
          <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg space-y-2 flex flex-col justify-between">
            <div>
              <span className="font-semibold text-neutral-200 block">Offres ({offers.length})</span>
              <span className="text-[11px] text-neutral-500">Solutions & Livrables</span>
            </div>
            <div className="flex gap-1.5 pt-2">
              <button
                type="button"
                onClick={() => exportToCSV('offers')}
                className="flex-1 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded text-[11px] font-medium transition-colors"
              >
                CSV
              </button>
              <button
                type="button"
                onClick={() => exportToJSON('offers')}
                className="flex-1 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded text-[11px] font-medium transition-colors"
              >
                JSON
              </button>
            </div>
          </div>

          {/* Projects */}
          <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg space-y-2 flex flex-col justify-between">
            <div>
              <span className="font-semibold text-neutral-200 block">Projets ({projects.length})</span>
              <span className="text-[11px] text-neutral-500">Orchestrations & Jalons</span>
            </div>
            <div className="flex gap-1.5 pt-2">
              <button
                type="button"
                onClick={() => exportToCSV('projects')}
                className="flex-1 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded text-[11px] font-medium transition-colors"
              >
                CSV
              </button>
              <button
                type="button"
                onClick={() => exportToJSON('projects')}
                className="flex-1 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded text-[11px] font-medium transition-colors"
              >
                JSON
              </button>
            </div>
          </div>

          {/* Tasks */}
          <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg space-y-2 flex flex-col justify-between">
            <div>
              <span className="font-semibold text-neutral-200 block">Actions ({tasks.length})</span>
              <span className="text-[11px] text-neutral-500">Exécution & Priorités</span>
            </div>
            <div className="flex gap-1.5 pt-2">
              <button
                type="button"
                onClick={() => exportToCSV('tasks')}
                className="flex-1 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded text-[11px] font-medium transition-colors"
              >
                CSV
              </button>
              <button
                type="button"
                onClick={() => exportToJSON('tasks')}
                className="flex-1 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded text-[11px] font-medium transition-colors"
              >
                JSON
              </button>
            </div>
          </div>
        </div>

        {/* Full database archive export */}
        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-neutral-800/80 text-xs">
          <span className="text-neutral-400">Export global groupé (snapshot intégral du cockpit) :</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => exportToCSV('all')}
              className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded text-xs font-medium transition-colors flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Tous les CSV</span>
            </button>
            <button
              type="button"
              onClick={() => exportToJSON('all')}
              className="px-3 py-1.5 bg-white hover:bg-neutral-100 text-neutral-950 rounded text-xs font-medium transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Archive Complète JSON</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Demo Data Seeder & Purge */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-3 border-b border-neutral-800 pb-4">
          <div className="p-2.5 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-300">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold tracking-tight text-white">
              Gestion des Données & Démonstration
            </h2>
            <p className="text-xs text-neutral-400">
              Amorçage de cas d’usage fictifs d’ingénierie d’affaires ou réinitialisation
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Nettoyer les données factices */}
          <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-lg flex flex-col justify-between space-y-3">
            <div>
              <h3 className="font-semibold text-emerald-300">Nettoyer les données factices & de test</h3>
              <p className="text-neutral-400 text-xs mt-1 leading-relaxed">
                Supprime automatiquement tous les prospects marqués comme fictifs et réinitialise les campagnes de test pour repartir sur une base 100% réelle et opérationnelle.
              </p>
            </div>
            <button
              type="button"
              onClick={handleCleanFake}
              disabled={cleaningFakeLoading}
              className="w-full py-2 px-3 bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 text-emerald-200 rounded-lg font-medium text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>{cleaningFakeLoading ? 'Nettoyage en cours...' : 'Nettoyer les données factices'}</span>
            </button>
          </div>

          {/* Purge */}
          <div className="p-4 bg-neutral-950 border border-red-950/60 rounded-lg flex flex-col justify-between space-y-3">
            <div>
              <h3 className="font-semibold text-red-300">Purger toutes les données</h3>
              <p className="text-neutral-400 text-xs mt-1 leading-relaxed">
                Supprime l'intégralité des documents de votre base Firestore (prospects, offres, projets, tâches, idées, décisions).
              </p>
            </div>
            <button
              type="button"
              onClick={handleClear}
              disabled={clearingLoading}
              className="w-full py-2 px-3 bg-red-950/60 hover:bg-red-900 border border-red-900 text-red-200 rounded-lg font-medium text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{clearingLoading ? 'Suppression en cours...' : 'Purger la base'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. Strategic Charter Reminder */}
      <div className="p-6 rounded-xl bg-neutral-950 border border-neutral-800 text-xs space-y-3">
        <h3 className="font-semibold text-neutral-200 text-sm">Charte Opérationnelle NEXUS OS</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-neutral-400 leading-relaxed">
          <div className="space-y-1">
            <span className="text-neutral-300 font-mono text-[11px] block">
              ADN : « THINK HUMAN, EXECUTE AI, EVOLVE HYBRID. »
            </span>
            <p>
              L’intelligence commence par l’écoute humaine et la compréhension du métier. L’exécution mobilise les technologies adaptées et l’organisation évolue vers un modèle hybride pérenne.
            </p>
          </div>
          <div className="space-y-1">
            <span className="text-neutral-300 font-mono text-[11px] block">
              Principe : « L’entreprise d’abord. La technologie ensuite. »
            </span>
            <p>
              Aucun outil, automatisation ou surcoût n’est introduit sans qu’un besoin opérationnel concret et validé ne l’exige. Évite les doublons technologiques entre branches.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
